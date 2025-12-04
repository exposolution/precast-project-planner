import { Obra, Forma, ProductionItem, Lote, Urgency, Priority } from '@/types/production';
import { addMinutes, addDays, isSameDay, startOfDay, setHours, setMinutes, isBefore, isAfter } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Helper to get urgency value for sorting obras
const getUrgencyValue = (urgency: Urgency): number => {
  if (urgency === 'passa_frente') return 4;
  if (urgency.startsWith('atras_de_forma:')) return 3;
  if (urgency === 'normal') return 2;
  if (urgency === 'vai_fim_fila') return 1;
  return 0; // Default for unknown urgency
};

// Helper to get priority value for sorting items within an obra
const getPriorityValue = (priority: Priority): number => {
  const values: Record<Priority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return values[priority];
};

interface GanttSchedulerOptions {
  initialStartTime: Date;
  workDayStartHour: number; // e.g., 7 for 07:00
  workDayEndHour: number;   // e.g., 17 for 17:00
  workDays: number[];       // e.g., [1, 2, 3, 4, 5] for Mon-Fri
}

export const generateGanttSchedule = (
  obras: Obra[],
  formas: Forma[],
  productionItems: ProductionItem[],
  options: GanttSchedulerOptions
): Lote[] => {
  const { initialStartTime, workDayStartHour, workDayEndHour, workDays } = options;

  const scheduledLotes: Lote[] = [];
  let currentTime = initialStartTime;
  let lastFormaId: string | null = null;

  // 1. Order Obras by Urgency
  const sortedObras = [...obras].sort((a, b) => {
    const urgencyDiff = getUrgencyValue(b.urgency) - getUrgencyValue(a.urgency);
    if (urgencyDiff !== 0) return urgencyDiff;
    // Secondary sort by existing priority if urgency is the same
    return getPriorityValue(b.priority) - getPriorityValue(a.priority);
  });

  // Map to store grouped pieces for each obra
  const obraGroupedPieces = new Map<string, Map<string, ProductionItem[]>>(); // obraId -> "altura_base" -> ProductionItem[]

  // 2. Group pieces by key (altura, base) for each obra
  productionItems.forEach(item => {
    if (!obraGroupedPieces.has(item.obraId)) {
      obraGroupedPieces.set(item.obraId, new Map());
    }
    const obraGroups = obraGroupedPieces.get(item.obraId)!;
    const groupKey = `${item.altura}_${item.base}`;
    if (!obraGroups.has(groupKey)) {
      obraGroups.set(groupKey, []);
    }
    obraGroups.get(groupKey)!.push(item);
  });

  // Function to advance time past non-work hours/days
  const advanceTimeToWorkTime = (time: Date): Date => {
    let newTime = time;
    while (true) {
      const dayOfWeek = newTime.getDay(); // 0 = Sunday, 6 = Saturday
      const isWorkDay = workDays.includes(dayOfWeek);
      const currentHour = newTime.getHours();

      if (!isWorkDay) {
        newTime = addDays(startOfDay(newTime), 1);
        newTime = setHours(newTime, workDayStartHour);
        newTime = setMinutes(newTime, 0);
        continue;
      }

      if (currentHour < workDayStartHour) {
        newTime = setHours(newTime, workDayStartHour);
        newTime = setMinutes(newTime, 0);
      } else if (currentHour >= workDayEndHour) {
        newTime = addDays(startOfDay(newTime), 1);
        newTime = setHours(newTime, workDayStartHour);
        newTime = setMinutes(newTime, 0);
        continue;
      }
      break;
    }
    return newTime;
  };

  // Function to calculate end time considering work hours
  const calculateEndTime = (start: Date, durationMinutes: number): Date => {
    let current = start;
    let remainingDuration = durationMinutes;

    while (remainingDuration > 0) {
      current = advanceTimeToWorkTime(current);
      const endOfWorkDay = setHours(startOfDay(current), workDayEndHour);

      if (isBefore(current, endOfWorkDay)) {
        const minutesUntilEndOfWorkDay = (endOfWorkDay.getTime() - current.getTime()) / (1000 * 60);
        const minutesToTake = Math.min(remainingDuration, minutesUntilEndOfWorkDay);
        current = addMinutes(current, minutesToTake);
        remainingDuration -= minutesToTake;
      } else {
        // Move to the next day's start
        current = addDays(startOfDay(current), 1);
        current = setHours(current, workDayStartHour);
        current = setMinutes(current, 0);
      }
    }
    return current;
  };

  // 3. Process each obra to create lots and build the queue
  const tempLotesQueue: Lote[] = []; // Temporary queue to be sorted by urgency

  for (const obra of sortedObras) {
    const groupsForObra = obraGroupedPieces.get(obra.id);
    if (!groupsForObra) continue;

    for (const [groupKey, itemsInGroup] of groupsForObra.entries()) {
      // For simplicity, we'll take the first item in the group to represent dimensions
      // In a real scenario, all items in a group should have identical dimensions
      const representativeItem = itemsInGroup[0];
      const { altura, base, comprimento, tempoUnitarioMinutos } = representativeItem;

      // 4. Identify compatible formas
      const compatibleFormas = formas.filter(forma =>
        forma.dimensions.altura_max >= altura &&
        forma.dimensions.base_max >= base &&
        forma.dimensions.comprimento_max >= comprimento
      );

      if (compatibleFormas.length === 0) {
        console.warn(`No compatible forma found for group ${groupKey} of obra ${obra.code}. Skipping.`);
        continue;
      }

      // 5. Select ideal forma
      const idealForma = compatibleFormas.sort((f1, f2) => {
        const capacity1 = Math.floor(f1.dimensions.comprimento_max / comprimento);
        const capacity2 = Math.floor(f2.dimensions.comprimento_max / comprimento);

        if (capacity1 !== capacity2) {
          return capacity2 - capacity1; // Higher capacity first
        }
        return f1.dimensions.comprimento_max - f2.dimensions.comprimento_max; // Smaller max_comprimento in case of tie
      })[0];

      const formaCapacityPerLote = Math.floor(idealForma.dimensions.comprimento_max / comprimento);
      if (formaCapacityPerLote < 1) {
        console.warn(`Forma ${idealForma.code} has capacity < 1 for group ${groupKey}. Skipping.`);
        continue;
      }

      // 6. Create lots
      let remainingQuantity = itemsInGroup.reduce((sum, item) => sum + item.quantity, 0);
      let loteIndex = 0;

      while (remainingQuantity > 0) {
        const quantityInLote = Math.min(remainingQuantity, formaCapacityPerLote);
        remainingQuantity -= quantityInLote;

        const lote: Lote = {
          id: uuidv4(),
          originalItemId: representativeItem.id,
          obraId: obra.id,
          formaId: idealForma.id,
          altura,
          base,
          comprimento,
          quantity: quantityInLote,
          tempoUnitarioMinutos,
          startDate: new Date(), // Will be updated during scheduling
          endDate: new Date(),   // Will be updated during scheduling
          setupApplied: false,
          priority: representativeItem.priority,
          urgency: obra.urgency,
          obraCode: obra.code,
          formaCode: idealForma.code,
        };
        tempLotesQueue.push(lote);
      }
    }
  }

  // 7. Mount the final queue respecting obra urgency
  const finalLotesQueue: Lote[] = [];

  // Sort tempLotesQueue by obra urgency first, then by item priority
  tempLotesQueue.sort((a, b) => {
    const urgencyDiff = getUrgencyValue(b.urgency) - getUrgencyValue(a.urgency);
    if (urgencyDiff !== 0) return urgencyDiff;
    return getPriorityValue(b.priority) - getPriorityValue(a.priority);
  });

  // This part of the algorithm is tricky because 'atras_de_forma:X' requires knowing the final positions.
  // For a simplified sequential Gantt, we'll process in order of sorted obras,
  // and then apply the 'atras_de_forma' logic dynamically.
  // A more robust solution might involve multiple passes or a more complex queue management.

  // For now, let's re-sort the tempLotesQueue based on the full urgency logic
  // This is a simplified approach for the "montar a fila final" step.
  // A true "atras_de_forma" would require inserting into an already partially built queue.
  // For this implementation, we'll group all lots for an obra and then insert them.

  const lotsByObraId = new Map<string, Lote[]>();
  tempLotesQueue.forEach(lote => {
    if (!lotsByObraId.has(lote.obraId)) {
      lotsByObraId.set(lote.obraId, []);
    }
    lotsByObraId.get(lote.obraId)!.push(lote);
  });

  for (const obra of sortedObras) {
    const lotsForThisObra = lotsByObraId.get(obra.id);
    if (!lotsForThisObra || lotsForThisObra.length === 0) continue;

    // Sort lots within this obra by item priority
    lotsForThisObra.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));

    if (obra.urgency === 'passa_frente') {
      finalLotesQueue.unshift(...lotsForThisObra); // Insert at the beginning
    } else if (obra.urgency.startsWith('atras_de_forma:')) {
      const formaIdToFollow = obra.urgency.split(':')[1];
      const lastIndexForForma = finalLotesQueue.map(l => l.formaId).lastIndexOf(formaIdToFollow);
      if (lastIndexForForma !== -1) {
        finalLotesQueue.splice(lastIndexForForma + 1, 0, ...lotsForThisObra);
      } else {
        finalLotesQueue.push(...lotsForThisObra); // If forma not found, append to end
      }
    } else if (obra.urgency === 'vai_fim_fila') {
      finalLotesQueue.push(...lotsForThisObra); // Append to the end
    } else { // 'normal' or default
      finalLotesQueue.push(...lotsForThisObra); // Append sequentially
    }
  }

  // 8. Generate sequential scheduling (Gantt simplified)
  for (const lote of finalLotesQueue) {
    currentTime = advanceTimeToWorkTime(currentTime);

    let setupDuration = 0;
    if (lastFormaId !== null && lastFormaId !== lote.formaId) {
      const currentForma = formas.find(f => f.id === lote.formaId);
      if (currentForma) {
        setupDuration = currentForma.setupMinutes;
        lote.setupApplied = true;
      }
    }

    if (setupDuration > 0) {
      currentTime = addMinutes(currentTime, setupDuration);
      currentTime = advanceTimeToWorkTime(currentTime); // Ensure setup doesn't end outside work hours
    }

    const productionDuration = lote.quantity * lote.tempoUnitarioMinutos;
    lote.startDate = currentTime;
    lote.endDate = calculateEndTime(currentTime, productionDuration);
    currentTime = lote.endDate;
    lastFormaId = lote.formaId;

    scheduledLotes.push(lote);
  }

  return scheduledLotes;
};