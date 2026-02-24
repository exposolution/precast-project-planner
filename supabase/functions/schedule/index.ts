import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fixed cycle duration: 24 hours in minutes
const CYCLE_DURATION_MINUTES = 24 * 60

interface Obra {
  id: string
  name: string
  code: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  urgencia: string | null
  deadline: string
}

interface Forma {
  id: string
  name: string
  code: string
  height_cm: number
  width_cm: number
  length_cm: number
  capacity: number
  setup_minutes: number
  status: string
}

interface ProductionItem {
  id: string
  obra_id: string
  forma_id: string
  quantity: number
  piece_height: number
  piece_width: number
  piece_length: number
  unit_production_time_minutes: number
  priority: string
}

interface Ciclo {
  id: string
  forma_id: string
  ciclo_numero: number
  inicio: Date
  fim: Date
  capacidade_total: number
  capacidade_ocupada: number
  predecessor_id: string | null
  status: string
  pecas: CicloPeca[]
}

interface CicloPeca {
  id: string
  production_item_id: string
  obra_id: string
  quantidade: number
  inicio_previsto: Date
  fim_previsto: Date
  ordem_no_ciclo: number
}

interface ScheduleResult {
  formaId: string
  ciclos: {
    cicloId: string
    inicio: string
    fim: string
    pecas: string[]
    capacidadeTotal: number
    capacidadeOcupada: number
    predecessor: string | null
  }[]
}

// Priority order for obras
const PRIORITY_ORDER: Record<string, number> = {
  'critical': 0,
  'high': 1,
  'medium': 2,
  'low': 3
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Get next available date at 7:00 AM
function getNextCycleStart(fromDate: Date = new Date()): Date {
  const result = new Date(fromDate)
  result.setHours(7, 0, 0, 0)
  
  // If we're past 7:00 AM today, start tomorrow
  if (fromDate.getHours() >= 7) {
    result.setDate(result.getDate() + 1)
  }
  
  // Skip weekends
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1)
  }
  
  return result
}

// Add 24 hours to get cycle end (FS dependency)
function getCycleEnd(start: Date): Date {
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return end
}

// Find available window in a forma's schedule
function findAvailableWindow(
  formaId: string,
  requiredCapacity: number,
  existingCiclos: Map<string, Ciclo[]>,
  formasMap: Map<string, Forma>,
  startFrom: Date = new Date()
): { ciclo: Ciclo | null, newCiclo: boolean, startDate: Date, endDate: Date } {
  const forma = formasMap.get(formaId)
  if (!forma) {
    throw new Error(`Forma ${formaId} not found`)
  }
  
  const formaCiclos = existingCiclos.get(formaId) || []
  
  // Check existing cycles for available capacity
  for (const ciclo of formaCiclos) {
    const availableCapacity = ciclo.capacidade_total - ciclo.capacidade_ocupada
    if (availableCapacity >= requiredCapacity && new Date(ciclo.inicio) >= startFrom) {
      return {
        ciclo,
        newCiclo: false,
        startDate: new Date(ciclo.inicio),
        endDate: new Date(ciclo.fim)
      }
    }
  }
  
  // Need to create a new cycle - find next available slot
  let cycleStart: Date
  
  if (formaCiclos.length > 0) {
    // Get the last cycle's end time (FS dependency)
    const lastCiclo = formaCiclos[formaCiclos.length - 1]
    cycleStart = new Date(lastCiclo.fim)
    
    // Skip weekends
    while (cycleStart.getDay() === 0 || cycleStart.getDay() === 6) {
      cycleStart.setDate(cycleStart.getDate() + 1)
    }
    cycleStart.setHours(7, 0, 0, 0)
  } else {
    cycleStart = getNextCycleStart(startFrom)
  }
  
  const cycleEnd = getCycleEnd(cycleStart)
  
  return {
    ciclo: null,
    newCiclo: true,
    startDate: cycleStart,
    endDate: cycleEnd
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { action } = body

    console.log('Schedule function called with action:', action)

    // Fetch all required data
    const [obrasRes, formasRes, itemsRes, ciclosRes] = await Promise.all([
      supabase.from('obras').select('*').eq('status', 'active'),
      supabase.from('formas').select('*').eq('disponivel', true),
      supabase.from('production_items').select('*'),
      supabase.from('gantt_ciclos').select('*').order('ciclo_numero', { ascending: true })
    ])

    if (obrasRes.error) throw obrasRes.error
    if (formasRes.error) throw formasRes.error
    if (itemsRes.error) throw itemsRes.error
    if (ciclosRes.error) throw ciclosRes.error

    const obras: Obra[] = obrasRes.data || []
    const formas: Forma[] = formasRes.data || []
    const items: ProductionItem[] = itemsRes.data || []
    
    // Build maps for quick lookup
    const formasMap = new Map<string, Forma>()
    for (const forma of formas) {
      formasMap.set(forma.id, forma)
    }
    
    const obrasMap = new Map<string, Obra>()
    for (const obra of obras) {
      obrasMap.set(obra.id, obra)
    }

    // ============================================
    // ACTION: suggest_date - Find available date window for new piece
    // ============================================
    if (action === 'suggest_date') {
      const { pieceHeight, pieceWidth, pieceLength, quantity, tempoUnitario, formaId } = body
      console.log('Suggesting date for piece:', { pieceHeight, pieceWidth, pieceLength, quantity, formaId })

      // Find compatible forms or use specified forma
      let compatibleFormas: Forma[]
      
      if (formaId) {
        const forma = formasMap.get(formaId)
        if (forma) {
          compatibleFormas = [forma]
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Forma especificada não encontrada'
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      } else {
        compatibleFormas = formas.filter(f => 
          f.height_cm >= pieceHeight && 
          f.width_cm >= pieceWidth &&
          f.status === 'available'
        )
      }
      
      if (compatibleFormas.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nenhuma forma compatível encontrada para estas dimensões'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      // Calculate capacity for each compatible form
      const formasWithCapacity = compatibleFormas.map(f => ({
        ...f,
        calculatedCapacity: Math.min(f.capacity, Math.floor(f.length_cm / pieceLength))
      })).filter(f => f.calculatedCapacity >= 1)
      
      if (formasWithCapacity.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nenhuma forma com capacidade suficiente para a peça'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      // Sort by capacity (highest first), then by length (smallest first for ties)
      formasWithCapacity.sort((a, b) => {
        if (b.calculatedCapacity !== a.calculatedCapacity) return b.calculatedCapacity - a.calculatedCapacity
        return a.length_cm - b.length_cm
      })
      
      const selectedForma = formasWithCapacity[0]
      
      // Build existing cycles map
      const existingCiclos = new Map<string, Ciclo[]>()
      for (const ciclo of ciclosRes.data || []) {
        const formaCiclos = existingCiclos.get(ciclo.forma_id) || []
        formaCiclos.push({
          ...ciclo,
          inicio: new Date(ciclo.inicio),
          fim: new Date(ciclo.fim),
          pecas: []
        })
        existingCiclos.set(ciclo.forma_id, formaCiclos)
      }
      
      // Calculate how many cycles needed
      const piecesPerCycle = selectedForma.calculatedCapacity
      const numCycles = Math.ceil(quantity / piecesPerCycle)
      
      // Find available windows
      const windows: { startDate: Date, endDate: Date, capacity: number }[] = []
      let searchFrom = new Date()
      
      for (let i = 0; i < numCycles; i++) {
        const window = findAvailableWindow(
          selectedForma.id,
          Math.min(piecesPerCycle, quantity - (i * piecesPerCycle)),
          existingCiclos,
          formasMap,
          searchFrom
        )
        
        windows.push({
          startDate: window.startDate,
          endDate: window.endDate,
          capacity: selectedForma.calculatedCapacity
        })
        
        // For next iteration, search from end of this window (FS)
        searchFrom = window.endDate
      }
      
      const firstWindow = windows[0]
      const lastWindow = windows[windows.length - 1]
      
      // Build alternative windows from other compatible forms
      const alternatives = formasWithCapacity.slice(1, 4).map(f => {
        const altWindow = findAvailableWindow(f.id, 1, existingCiclos, formasMap)
        return {
          formaId: f.id,
          formaName: f.name,
          formaCode: f.code,
          capacity: f.calculatedCapacity,
          startDate: altWindow.startDate.toISOString(),
          endDate: altWindow.endDate.toISOString()
        }
      })
      
      return new Response(JSON.stringify({
        success: true,
        suggestion: {
          startDate: firstWindow.startDate.toISOString(),
          endDate: lastWindow.endDate.toISOString(),
          selectedForma: {
            id: selectedForma.id,
            name: selectedForma.name,
            code: selectedForma.code,
            capacity: selectedForma.calculatedCapacity
          },
          numCycles,
          totalPieces: quantity,
          cycleDurationHours: 24,
          windows: windows.map(w => ({
            startDate: w.startDate.toISOString(),
            endDate: w.endDate.toISOString(),
            capacity: w.capacity
          })),
          alternatives
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ============================================
    // ACTION: reschedule - Full schedule recalculation with FS dependencies
    // ============================================
    if (action === 'reschedule') {
      console.log('Starting full reschedule with FS dependencies...')
      console.log(`Obras: ${obras.length}, Formas: ${formas.length}, Items: ${items.length}`)

      // 1. Sort obras by urgency/priority
      const sortedObras = [...obras].sort((a, b) => {
        if (a.urgencia === 'passa_frente' && b.urgencia !== 'passa_frente') return -1
        if (b.urgencia === 'passa_frente' && a.urgencia !== 'passa_frente') return 1
        if (a.urgencia === 'vai_fim_fila' && b.urgencia !== 'vai_fim_fila') return 1
        if (b.urgencia === 'vai_fim_fila' && a.urgencia !== 'vai_fim_fila') return -1
        
        // Sort by deadline, then priority
        const deadlineDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        if (deadlineDiff !== 0) return deadlineDiff
        
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      })

      // 2. Group items by obra and forma
      const obraItems = new Map<string, ProductionItem[]>()
      for (const item of items) {
        if (!item.piece_height || !item.piece_width || !item.piece_length) continue
        const existing = obraItems.get(item.obra_id) || []
        existing.push(item)
        obraItems.set(item.obra_id, existing)
      }
      
      // Sort items within each obra by priority
      for (const [obraId, obraItemList] of obraItems) {
        obraItemList.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      }

      // 3. Clear existing schedule
      await supabase.from('gantt_ciclo_pecas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('gantt_ciclos').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 4. Build new schedule with FS dependencies
      const newCiclos: Map<string, Ciclo[]> = new Map()
      const cicloPecas: CicloPeca[] = []
      
      // Process each obra in order
      for (const obra of sortedObras) {
        const obraItemsList = obraItems.get(obra.id) || []
        
        for (const item of obraItemsList) {
          const forma = formasMap.get(item.forma_id)
          if (!forma) {
            console.log(`Forma ${item.forma_id} not found for item ${item.id}`)
            continue
          }
          
          // Calculate capacity based on piece dimensions
          const capacityByLength = Math.floor(forma.length_cm / item.piece_length)
          const effectiveCapacity = Math.min(forma.capacity, capacityByLength > 0 ? capacityByLength : forma.capacity)
          
          if (effectiveCapacity < 1) {
            console.log(`Form ${forma.id} has no capacity for item ${item.id}`)
            continue
          }
          
          // Distribute pieces across cycles
          let remainingQty = item.quantity
          
          while (remainingQty > 0) {
            const qtyInCycle = Math.min(effectiveCapacity, remainingQty)
            
            // Find or create a cycle with available capacity
            const formaCiclos = newCiclos.get(forma.id) || []
            let targetCiclo: Ciclo | null = null
            
            // Check existing cycles for available capacity
            for (const ciclo of formaCiclos) {
              const available = ciclo.capacidade_total - ciclo.capacidade_ocupada
              if (available >= qtyInCycle) {
                targetCiclo = ciclo
                break
              }
            }
            
            // Create new cycle if needed (FS: starts after last cycle ends)
            if (!targetCiclo) {
              const lastCiclo = formaCiclos[formaCiclos.length - 1]
              let cycleStart: Date
              
              if (lastCiclo) {
                // FS dependency: new cycle starts when previous ends
                cycleStart = new Date(lastCiclo.fim)
                // Skip weekends
                while (cycleStart.getDay() === 0 || cycleStart.getDay() === 6) {
                  cycleStart.setDate(cycleStart.getDate() + 1)
                }
                cycleStart.setHours(7, 0, 0, 0)
              } else {
                cycleStart = getNextCycleStart()
              }
              
              const cycleEnd = getCycleEnd(cycleStart)
              
              targetCiclo = {
                id: crypto.randomUUID(),
                forma_id: forma.id,
                ciclo_numero: formaCiclos.length + 1,
                inicio: cycleStart,
                fim: cycleEnd,
                capacidade_total: effectiveCapacity,
                capacidade_ocupada: 0,
                predecessor_id: lastCiclo?.id || null,
                status: 'scheduled',
                pecas: []
              }
              
              formaCiclos.push(targetCiclo)
              newCiclos.set(forma.id, formaCiclos)
            }
            
            // Add piece to cycle
            const peca: CicloPeca = {
              id: crypto.randomUUID(),
              production_item_id: item.id,
              obra_id: obra.id,
              quantidade: qtyInCycle,
              inicio_previsto: targetCiclo.inicio,
              fim_previsto: targetCiclo.fim,
              ordem_no_ciclo: targetCiclo.pecas.length + 1
            }
            
            targetCiclo.pecas.push(peca)
            targetCiclo.capacidade_ocupada += qtyInCycle
            cicloPecas.push(peca)
            
            remainingQty -= qtyInCycle
          }
        }
      }

      // 5. Save to database
      const ciclosToInsert = []
      for (const [formaId, formaCiclos] of newCiclos) {
        for (const ciclo of formaCiclos) {
          ciclosToInsert.push({
            id: ciclo.id,
            forma_id: ciclo.forma_id,
            ciclo_numero: ciclo.ciclo_numero,
            inicio: ciclo.inicio.toISOString(),
            fim: ciclo.fim.toISOString(),
            capacidade_total: ciclo.capacidade_total,
            capacidade_ocupada: ciclo.capacidade_ocupada,
            predecessor_id: ciclo.predecessor_id,
            status: ciclo.status
          })
        }
      }
      
      if (ciclosToInsert.length > 0) {
        const { error: insertCiclosError } = await supabase.from('gantt_ciclos').insert(ciclosToInsert)
        if (insertCiclosError) {
          console.error('Error inserting ciclos:', insertCiclosError)
          throw insertCiclosError
        }
      }
      
      const pecasToInsert = cicloPecas.map(p => ({
        id: p.id,
        ciclo_id: [...newCiclos.values()].flat().find(c => c.pecas.includes(p))?.id,
        production_item_id: p.production_item_id,
        obra_id: p.obra_id,
        quantidade: p.quantidade,
        inicio_previsto: p.inicio_previsto.toISOString(),
        fim_previsto: p.fim_previsto.toISOString(),
        ordem_no_ciclo: p.ordem_no_ciclo
      })).filter(p => p.ciclo_id)
      
      if (pecasToInsert.length > 0) {
        const { error: insertPecasError } = await supabase.from('gantt_ciclo_pecas').insert(pecasToInsert)
        if (insertPecasError) {
          console.error('Error inserting pecas:', insertPecasError)
          throw insertPecasError
        }
      }

      // 6. Build response in expected format
      const result: ScheduleResult[] = []
      for (const [formaId, formaCiclos] of newCiclos) {
        result.push({
          formaId,
          ciclos: formaCiclos.map(c => ({
            cicloId: c.id,
            inicio: c.inicio.toISOString(),
            fim: c.fim.toISOString(),
            pecas: c.pecas.map(p => p.production_item_id),
            capacidadeTotal: c.capacidade_total,
            capacidadeOcupada: c.capacidade_ocupada,
            predecessor: c.predecessor_id
          }))
        })
      }

      console.log(`Schedule complete: ${ciclosToInsert.length} cycles, ${pecasToInsert.length} pieces`)

      return new Response(JSON.stringify({
        success: true,
        message: `Agendamento completo: ${ciclosToInsert.length} ciclos, ${pecasToInsert.length} peças`,
        schedule: result
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ============================================
    // ACTION: apply_delay - Apply delay to a cycle and propagate
    // ============================================
    if (action === 'apply_delay') {
      const { cicloId, delayMinutes, delayType } = body
      console.log('Applying delay:', { cicloId, delayMinutes, delayType })
      
      // Fetch the cycle
      const { data: ciclo, error: cicloError } = await supabase
        .from('gantt_ciclos')
        .select('*')
        .eq('id', cicloId)
        .single()
      
      if (cicloError) throw cicloError
      if (!ciclo) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Ciclo não encontrado'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      // Get all cycles for this forma that come after this one (FS chain)
      const { data: affectedCiclos, error: affectedError } = await supabase
        .from('gantt_ciclos')
        .select('*')
        .eq('forma_id', ciclo.forma_id)
        .gte('ciclo_numero', ciclo.ciclo_numero)
        .order('ciclo_numero', { ascending: true })
      
      if (affectedError) throw affectedError
      
      // Apply delay to all affected cycles (FS propagation)
      const updates = []
      for (const c of affectedCiclos || []) {
        const newInicio = new Date(new Date(c.inicio).getTime() + delayMinutes * 60 * 1000)
        const newFim = new Date(new Date(c.fim).getTime() + delayMinutes * 60 * 1000)
        
        updates.push({
          id: c.id,
          inicio: newInicio.toISOString(),
          fim: newFim.toISOString(),
          atraso_minutos: (c.atraso_minutos || 0) + delayMinutes,
          status: c.id === cicloId ? 'delayed' : c.status
        })
      }
      
      // Update cycles
      for (const update of updates) {
        await supabase
          .from('gantt_ciclos')
          .update({
            inicio: update.inicio,
            fim: update.fim,
            atraso_minutos: update.atraso_minutos,
            status: update.status
          })
          .eq('id', update.id)
      }
      
      // Update pieces in affected cycles
      for (const update of updates) {
        await supabase
          .from('gantt_ciclo_pecas')
          .update({
            inicio_previsto: update.inicio,
            fim_previsto: update.fim,
            status: update.id === cicloId ? 'delayed' : 'scheduled'
          })
          .eq('ciclo_id', update.id)
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: `Atraso aplicado: ${updates.length} ciclos afetados`,
        affectedCycles: updates.length
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ============================================
    // ACTION: get_schedule - Get current schedule in structured format
    // ============================================
    if (action === 'get_schedule') {
      const { data: ciclos, error: ciclosError } = await supabase
        .from('gantt_ciclos')
        .select(`
          *,
          forma:formas(*),
          pecas:gantt_ciclo_pecas(
            *,
            production_item:production_items(*)
          )
        `)
        .order('forma_id')
        .order('ciclo_numero', { ascending: true })
      
      if (ciclosError) throw ciclosError
      
      // Group by forma
      const byForma = new Map<string, any[]>()
      for (const ciclo of ciclos || []) {
        const formaCiclos = byForma.get(ciclo.forma_id) || []
        formaCiclos.push(ciclo)
        byForma.set(ciclo.forma_id, formaCiclos)
      }
      
      const result = Array.from(byForma.entries()).map(([formaId, formaCiclos]) => ({
        formaId,
        forma: formaCiclos[0]?.forma,
        ciclos: formaCiclos.map(c => ({
          cicloId: c.id,
          cicloNumero: c.ciclo_numero,
          inicio: c.inicio,
          fim: c.fim,
          capacidadeTotal: c.capacidade_total,
          capacidadeOcupada: c.capacidade_ocupada,
          predecessor: c.predecessor_id,
          status: c.status,
          atrasoMinutos: c.atraso_minutos,
          pecas: c.pecas.map((p: any) => ({
            id: p.id,
            productionItemId: p.production_item_id,
            obraId: p.obra_id,
            quantidade: p.quantidade,
            inicioPrevisto: p.inicio_previsto,
            fimPrevisto: p.fim_previsto,
            status: p.status,
            ordemNoCiclo: p.ordem_no_ciclo
          }))
        }))
      }))
      
      return new Response(JSON.stringify({
        success: true,
        schedule: result
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Ação não reconhecida: ' + action
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Schedule function error:', err)
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})