import { Obra, Forma, ProductionItem, Priority } from '@/types/production';
import { addDays, subDays } from 'date-fns';

const today = new Date();

export const mockObras: Obra[] = [
  {
    id: '1',
    name: 'Edifício Horizonte',
    code: 'OBR-001',
    priority: 'critical',
    deadline: addDays(today, 15),
    location: 'São Paulo, SP',
    status: 'active',
  },
  {
    id: '2',
    name: 'Condomínio Vista Verde',
    code: 'OBR-002',
    priority: 'high',
    deadline: addDays(today, 30),
    location: 'Campinas, SP',
    status: 'active',
  },
  {
    id: '3',
    name: 'Shopping Center Norte',
    code: 'OBR-003',
    priority: 'medium',
    deadline: addDays(today, 45),
    location: 'Guarulhos, SP',
    status: 'active',
  },
  {
    id: '4',
    name: 'Ponte Rio Negro',
    code: 'OBR-004',
    priority: 'high',
    deadline: addDays(today, 20),
    location: 'Manaus, AM',
    status: 'active',
  },
  {
    id: '5',
    name: 'Galpão Industrial',
    code: 'OBR-005',
    priority: 'low',
    deadline: addDays(today, 60),
    location: 'Sorocaba, SP',
    status: 'paused',
  },
];

export const mockFormas: Forma[] = [
  {
    id: 'f1',
    name: 'Viga V-40',
    code: 'FRM-V40',
    dimensions: { length: 400, width: 40, height: 60 },
    capacity: 8,
    status: 'in-use',
  },
  {
    id: 'f2',
    name: 'Pilar P-30',
    code: 'FRM-P30',
    dimensions: { length: 300, width: 30, height: 30 },
    capacity: 12,
    status: 'available',
  },
  {
    id: 'f3',
    name: 'Laje L-200',
    code: 'FRM-L200',
    dimensions: { length: 200, width: 100, height: 20 },
    capacity: 4,
    status: 'in-use',
  },
  {
    id: 'f4',
    name: 'Viga V-60',
    code: 'FRM-V60',
    dimensions: { length: 600, width: 50, height: 80 },
    capacity: 6,
    status: 'available',
  },
  {
    id: 'f5',
    name: 'Painel PA-150',
    code: 'FRM-PA150',
    dimensions: { length: 150, width: 300, height: 15 },
    capacity: 10,
    status: 'maintenance',
  },
  {
    id: 'f6',
    name: 'Pilar P-50',
    code: 'FRM-P50',
    dimensions: { length: 500, width: 50, height: 50 },
    capacity: 8,
    status: 'in-use',
  },
];

export const mockProductionItems: ProductionItem[] = [
  // Obra 1 - Critical
  {
    id: 'pi1',
    obraId: '1',
    formaId: 'f1',
    quantity: 24,
    produced: 16,
    startDate: subDays(today, 3),
    endDate: addDays(today, 2),
    priority: 'critical',
    status: 'in-progress',
  },
  {
    id: 'pi2',
    obraId: '1',
    formaId: 'f3',
    quantity: 12,
    produced: 0,
    startDate: addDays(today, 2),
    endDate: addDays(today, 5),
    priority: 'critical',
    status: 'pending',
  },
  {
    id: 'pi3',
    obraId: '1',
    formaId: 'f6',
    quantity: 20,
    produced: 8,
    startDate: subDays(today, 2),
    endDate: addDays(today, 3),
    priority: 'high',
    status: 'in-progress',
  },
  // Obra 2 - High
  {
    id: 'pi4',
    obraId: '2',
    formaId: 'f2',
    quantity: 36,
    produced: 0,
    startDate: addDays(today, 3),
    endDate: addDays(today, 6),
    priority: 'high',
    status: 'pending',
  },
  {
    id: 'pi5',
    obraId: '2',
    formaId: 'f4',
    quantity: 18,
    produced: 6,
    startDate: subDays(today, 1),
    endDate: addDays(today, 4),
    priority: 'high',
    status: 'in-progress',
  },
  // Obra 3 - Medium
  {
    id: 'pi6',
    obraId: '3',
    formaId: 'f1',
    quantity: 30,
    produced: 0,
    startDate: addDays(today, 5),
    endDate: addDays(today, 9),
    priority: 'medium',
    status: 'pending',
  },
  {
    id: 'pi7',
    obraId: '3',
    formaId: 'f5',
    quantity: 40,
    produced: 0,
    startDate: addDays(today, 7),
    endDate: addDays(today, 11),
    priority: 'medium',
    status: 'pending',
  },
  // Obra 4 - High
  {
    id: 'pi8',
    obraId: '4',
    formaId: 'f3',
    quantity: 16,
    produced: 4,
    startDate: subDays(today, 1),
    endDate: addDays(today, 4),
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 'pi9',
    obraId: '4',
    formaId: 'f2',
    quantity: 24,
    produced: 0,
    startDate: addDays(today, 4),
    endDate: addDays(today, 6),
    priority: 'medium',
    status: 'pending',
  },
  // Obra 5 - Low
  {
    id: 'pi10',
    obraId: '5',
    formaId: 'f4',
    quantity: 15,
    produced: 0,
    startDate: addDays(today, 10),
    endDate: addDays(today, 13),
    priority: 'low',
    status: 'pending',
  },
];

export const getPriorityValue = (priority: Priority): number => {
  const values: Record<Priority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return values[priority];
};

export const sortByPriority = (items: ProductionItem[]): ProductionItem[] => {
  return [...items].sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
};
