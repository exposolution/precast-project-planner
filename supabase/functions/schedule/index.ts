import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Obra {
  id: string
  name: string
  code: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  urgency: 'passa_frente' | 'normal' | 'vai_fim_fila' | null
  urgency_after_forma_id: string | null
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
  disponivel: boolean
}

interface ProductionItem {
  id: string
  obra_id: string
  forma_id: string
  quantity: number
  piece_height_cm: number
  piece_width_cm: number
  piece_length_cm: number
  tempo_unitario_minutos: number
}

interface CalendarioTrabalho {
  data: string
  turno_inicio: string
  turno_fim: string
  eh_feriado: boolean
}

interface Lote {
  id: string
  obra_id: string
  grupo_altura_cm: number
  grupo_base_cm: number
  forma_id: string
  quantidade: number
  tempo_producao_min: number
  setup_aplicado: boolean
  setup_minutos: number
  inicio: Date
  fim: Date
  ordem_fila: number
}

interface PieceGroup {
  obraId: string
  altura: number
  base: number
  comprimento: number
  tempoUnitario: number
  quantidade: number
}

// Priority order for obras
const PRIORITY_ORDER: Record<string, number> = {
  'critical': 0,
  'high': 1,
  'medium': 2,
  'low': 3
}

// Default work hours
const DEFAULT_SHIFT_START = 7 * 60 // 7:00 in minutes
const DEFAULT_SHIFT_END = 17 * 60  // 17:00 in minutes (10 hours)

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getWorkingHours(date: Date, calendario: Map<string, CalendarioTrabalho>): { start: number, end: number } | null {
  if (isWeekend(date)) return null
  
  const key = formatDateKey(date)
  const cal = calendario.get(key)
  
  if (cal?.eh_feriado) return null
  
  if (cal) {
    return {
      start: parseTime(cal.turno_inicio),
      end: parseTime(cal.turno_fim)
    }
  }
  
  return { start: DEFAULT_SHIFT_START, end: DEFAULT_SHIFT_END }
}

function addMinutesWithWorkCalendar(
  startTime: Date,
  minutes: number,
  calendario: Map<string, CalendarioTrabalho>
): Date {
  let currentDate = new Date(startTime)
  let remainingMinutes = minutes
  
  while (remainingMinutes > 0) {
    const workHours = getWorkingHours(currentDate, calendario)
    
    if (!workHours) {
      // Skip to next day
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(Math.floor(DEFAULT_SHIFT_START / 60), DEFAULT_SHIFT_START % 60, 0, 0)
      continue
    }
    
    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes()
    
    // If before shift start, move to shift start
    if (currentMinutes < workHours.start) {
      currentDate.setHours(Math.floor(workHours.start / 60), workHours.start % 60, 0, 0)
    }
    
    // If after shift end, move to next day's shift start
    if (currentMinutes >= workHours.end) {
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(Math.floor(DEFAULT_SHIFT_START / 60), DEFAULT_SHIFT_START % 60, 0, 0)
      continue
    }
    
    const currentMins = currentDate.getHours() * 60 + currentDate.getMinutes()
    const availableMinutes = workHours.end - currentMins
    
    if (remainingMinutes <= availableMinutes) {
      currentDate.setMinutes(currentDate.getMinutes() + remainingMinutes)
      remainingMinutes = 0
    } else {
      remainingMinutes -= availableMinutes
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(Math.floor(DEFAULT_SHIFT_START / 60), DEFAULT_SHIFT_START % 60, 0, 0)
    }
  }
  
  return currentDate
}

function findNextAvailableSlot(
  calendario: Map<string, CalendarioTrabalho>,
  startFrom: Date = new Date()
): Date {
  let date = new Date(startFrom)
  date.setHours(Math.floor(DEFAULT_SHIFT_START / 60), DEFAULT_SHIFT_START % 60, 0, 0)
  
  for (let i = 0; i < 365; i++) { // Max 1 year lookahead
    const workHours = getWorkingHours(date, calendario)
    if (workHours) {
      return date
    }
    date.setDate(date.getDate() + 1)
    date.setHours(Math.floor(DEFAULT_SHIFT_START / 60), DEFAULT_SHIFT_START % 60, 0, 0)
  }
  
  return date
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, pieceHeight, pieceWidth, pieceLength, quantity, tempoUnitario } = await req.json()

    // Fetch all required data
    const [obrasRes, formasRes, itemsRes, calendarioRes] = await Promise.all([
      supabase.from('obras').select('*').eq('status', 'active'),
      supabase.from('formas').select('*').eq('disponivel', true),
      supabase.from('production_items').select('*'),
      supabase.from('calendario_trabalho').select('*')
    ])

    if (obrasRes.error) throw obrasRes.error
    if (formasRes.error) throw formasRes.error
    if (itemsRes.error) throw itemsRes.error
    if (calendarioRes.error) throw calendarioRes.error

    const obras: Obra[] = obrasRes.data || []
    const formas: Forma[] = formasRes.data || []
    const items: ProductionItem[] = itemsRes.data || []
    
    // Build calendar map
    const calendario = new Map<string, CalendarioTrabalho>()
    for (const cal of calendarioRes.data || []) {
      calendario.set(cal.data, cal)
    }

    // Action: suggest available date for new production item
    if (action === 'suggest_date') {
      console.log('Suggesting date for new piece:', { pieceHeight, pieceWidth, pieceLength, quantity, tempoUnitario })
      
      // Find compatible forms for this piece
      const compatibleFormas = formas.filter(f => 
        f.height_cm >= pieceHeight && 
        f.width_cm >= pieceWidth &&
        f.status === 'available'
      )
      
      if (compatibleFormas.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nenhuma forma compatível encontrada para estas dimensões'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      // Calculate capacity for each compatible form
      const formasWithCapacity = compatibleFormas.map(f => ({
        ...f,
        capacity: Math.floor(f.length_cm / pieceLength)
      })).filter(f => f.capacity >= 1)
      
      if (formasWithCapacity.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nenhuma forma com capacidade suficiente para o comprimento da peça'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      // Select best form (highest capacity, then smallest length)
      formasWithCapacity.sort((a, b) => {
        if (b.capacity !== a.capacity) return b.capacity - a.capacity
        return a.length_cm - b.length_cm
      })
      
      const selectedForma = formasWithCapacity[0]
      const numLotes = Math.ceil(quantity / selectedForma.capacity)
      const totalProductionTime = numLotes * selectedForma.capacity * tempoUnitario
      const setupTime = selectedForma.setup_minutes || 30
      
      // Get current queue end time by fetching gantt_lotes
      const { data: existingLotes } = await supabase
        .from('gantt_lotes')
        .select('fim')
        .order('fim', { ascending: false })
        .limit(1)
      
      let startDate: Date
      if (existingLotes && existingLotes.length > 0) {
        startDate = new Date(existingLotes[0].fim)
        // Add setup time if there's existing work
        startDate = addMinutesWithWorkCalendar(startDate, setupTime, calendario)
      } else {
        startDate = findNextAvailableSlot(calendario)
      }
      
      const endDate = addMinutesWithWorkCalendar(startDate, totalProductionTime, calendario)
      
      return new Response(JSON.stringify({
        success: true,
        suggestion: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          selectedForma: {
            id: selectedForma.id,
            name: selectedForma.name,
            code: selectedForma.code,
            capacity: selectedForma.capacity
          },
          numLotes,
          totalMinutes: totalProductionTime + setupTime,
          compatibleFormas: formasWithCapacity.map(f => ({
            id: f.id,
            name: f.name,
            code: f.code,
            capacity: f.capacity
          }))
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Action: full reschedule
    if (action === 'reschedule') {
      console.log('Starting full reschedule...')
      console.log(`Obras: ${obras.length}, Formas: ${formas.length}, Items: ${items.length}`)

      // 1. Sort obras by urgency priority
      const sortedObras = [...obras].sort((a, b) => {
        // passa_frente has highest priority
        if (a.urgency === 'passa_frente' && b.urgency !== 'passa_frente') return -1
        if (b.urgency === 'passa_frente' && a.urgency !== 'passa_frente') return 1
        
        // vai_fim_fila has lowest priority
        if (a.urgency === 'vai_fim_fila' && b.urgency !== 'vai_fim_fila') return 1
        if (b.urgency === 'vai_fim_fila' && a.urgency !== 'vai_fim_fila') return -1
        
        // For normal and atrás_de_forma, sort by priority
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      })

      // 2. Group pieces by (altura, base) for each obra
      const obraGroups = new Map<string, PieceGroup[]>()
      
      for (const item of items) {
        if (!item.piece_height_cm || !item.piece_width_cm || !item.piece_length_cm) continue
        
        const group: PieceGroup = {
          obraId: item.obra_id,
          altura: item.piece_height_cm,
          base: item.piece_width_cm,
          comprimento: item.piece_length_cm,
          tempoUnitario: item.tempo_unitario_minutos || 60,
          quantidade: item.quantity
        }
        
        const existing = obraGroups.get(item.obra_id) || []
        // Merge with existing group if same dimensions
        const existingGroup = existing.find(g => 
          g.altura === group.altura && g.base === group.base && g.comprimento === group.comprimento
        )
        if (existingGroup) {
          existingGroup.quantidade += group.quantidade
        } else {
          existing.push(group)
        }
        obraGroups.set(item.obra_id, existing)
      }

      // 3. For each group, find compatible forms and calculate capacity
      const lotes: Lote[] = []
      const filaFinal: Lote[] = []
      const lotesAtrasDe = new Map<string, Lote[]>() // forma_id -> lotes to insert after
      const lotesFimFila: Lote[] = []

      for (const obra of sortedObras) {
        const groups = obraGroups.get(obra.id) || []
        const obraLotes: Lote[] = []

        for (const group of groups) {
          // Find compatible forms
          const compatibleFormas = formas.filter(f => 
            f.height_cm >= group.altura && 
            f.width_cm >= group.base &&
            f.status === 'available'
          )

          // Calculate capacity for each
          const formasWithCapacity = compatibleFormas.map(f => ({
            forma: f,
            capacity: Math.floor(f.length_cm / group.comprimento)
          })).filter(fc => fc.capacity >= 1)

          if (formasWithCapacity.length === 0) {
            console.log(`No compatible forma for group: ${group.altura}x${group.base}x${group.comprimento}`)
            continue
          }

          // Select best form (highest capacity, then smallest length)
          formasWithCapacity.sort((a, b) => {
            if (b.capacity !== a.capacity) return b.capacity - a.capacity
            return a.forma.length_cm - b.forma.length_cm
          })

          const selected = formasWithCapacity[0]
          const numLotes = Math.ceil(group.quantidade / selected.capacity)

          // Create lotes
          for (let i = 0; i < numLotes; i++) {
            const qtdNoLote = Math.min(selected.capacity, group.quantidade - (i * selected.capacity))
            const tempoProducao = qtdNoLote * group.tempoUnitario

            obraLotes.push({
              id: crypto.randomUUID(),
              obra_id: obra.id,
              grupo_altura_cm: group.altura,
              grupo_base_cm: group.base,
              forma_id: selected.forma.id,
              quantidade: qtdNoLote,
              tempo_producao_min: tempoProducao,
              setup_aplicado: false,
              setup_minutos: selected.forma.setup_minutes || 30,
              inicio: new Date(),
              fim: new Date(),
              ordem_fila: 0
            })
          }
        }

        // Insert lotes based on urgency
        if (obra.urgency === 'passa_frente') {
          // Insert at beginning
          filaFinal.unshift(...obraLotes)
        } else if (obra.urgency === 'vai_fim_fila') {
          // Insert at end (collect for later)
          lotesFimFila.push(...obraLotes)
        } else if (obra.urgency_after_forma_id) {
          // Collect for insertion after specific forma
          const existing = lotesAtrasDe.get(obra.urgency_after_forma_id) || []
          existing.push(...obraLotes)
          lotesAtrasDe.set(obra.urgency_after_forma_id, existing)
        } else {
          // Normal - append to queue
          filaFinal.push(...obraLotes)
        }
      }

      // Insert lotes "atrás_de_forma" after their target forma
      for (const [formaId, lotesToInsert] of lotesAtrasDe) {
        // Find last occurrence of this forma in filaFinal
        let lastIndex = -1
        for (let i = filaFinal.length - 1; i >= 0; i--) {
          if (filaFinal[i].forma_id === formaId) {
            lastIndex = i
            break
          }
        }
        
        if (lastIndex >= 0) {
          filaFinal.splice(lastIndex + 1, 0, ...lotesToInsert)
        } else {
          // Forma not found, append to end
          filaFinal.push(...lotesToInsert)
        }
      }

      // Append fim_fila lotes at the end
      filaFinal.push(...lotesFimFila)

      // 4. Generate sequential schedule with work calendar
      let currentTime = findNextAvailableSlot(calendario)
      let lastFormaId: string | null = null

      for (let i = 0; i < filaFinal.length; i++) {
        const lote = filaFinal[i]
        lote.ordem_fila = i + 1

        // Apply setup if forma changed
        if (lastFormaId !== null && lastFormaId !== lote.forma_id) {
          lote.setup_aplicado = true
          currentTime = addMinutesWithWorkCalendar(currentTime, lote.setup_minutos, calendario)
        }

        lote.inicio = new Date(currentTime)
        currentTime = addMinutesWithWorkCalendar(currentTime, lote.tempo_producao_min, calendario)
        lote.fim = new Date(currentTime)

        lastFormaId = lote.forma_id
      }

      // 5. Save to database - delete old lotes and insert new ones
      const { error: deleteError } = await supabase.from('gantt_lotes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (deleteError) {
        console.error('Error deleting old lotes:', deleteError)
      }

      if (filaFinal.length > 0) {
        const lotesToInsert = filaFinal.map(l => ({
          id: l.id,
          obra_id: l.obra_id,
          forma_id: l.forma_id,
          grupo_altura_cm: l.grupo_altura_cm,
          grupo_base_cm: l.grupo_base_cm,
          quantidade: l.quantidade,
          tempo_producao_min: l.tempo_producao_min,
          setup_aplicado: l.setup_aplicado,
          setup_minutos: l.setup_minutos,
          inicio: l.inicio.toISOString(),
          fim: l.fim.toISOString(),
          ordem_fila: l.ordem_fila
        }))

        const { error: insertError } = await supabase.from('gantt_lotes').insert(lotesToInsert)
        if (insertError) {
          console.error('Error inserting lotes:', insertError)
          throw insertError
        }
      }

      console.log(`Schedule complete: ${filaFinal.length} lotes created`)

      return new Response(JSON.stringify({
        success: true,
        message: `Agendamento completo: ${filaFinal.length} lotes criados`,
        lotes: filaFinal.map(l => ({
          ...l,
          inicio: l.inicio.toISOString(),
          fim: l.fim.toISOString()
        }))
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Action: get current schedule
    if (action === 'get_schedule') {
      const { data: lotes, error } = await supabase
        .from('gantt_lotes')
        .select('*')
        .order('ordem_fila', { ascending: true })

      if (error) throw error

      return new Response(JSON.stringify({
        success: true,
        lotes: lotes || []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Ação não reconhecida'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Schedule function error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
