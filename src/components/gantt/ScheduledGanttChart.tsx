import { useMemo } from 'react';
import { Obra, Forma } from '@/types/production';
import { GanttLote } from '@/hooks/useGanttSchedule';
import { format, differenceInMinutes, startOfDay, addDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, Clock } from 'lucide-react';

interface ScheduledGanttChartProps {
  lotes: GanttLote[];
  obras: Obra[];
  formas: Forma[];
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export function ScheduledGanttChart({ lotes, obras, formas }: ScheduledGanttChartProps) {
  const getObra = (id: string) => obras.find(o => o.id === id);
  const getForma = (id: string) => formas.find(f => f.id === id);

  const { startDate, endDate, days, totalMinutes } = useMemo(() => {
    if (lotes.length === 0) {
      const today = startOfDay(new Date());
      const end = addDays(today, 7);
      return {
        startDate: today,
        endDate: end,
        days: eachDayOfInterval({ start: today, end }),
        totalMinutes: 7 * 24 * 60,
      };
    }

    const dates = lotes.flatMap(l => [new Date(l.inicio), new Date(l.fim)]);
    const minDate = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = startOfDay(addDays(new Date(Math.max(...dates.map(d => d.getTime()))), 1));
    const daysList = eachDayOfInterval({ start: minDate, end: maxDate });

    return {
      startDate: minDate,
      endDate: maxDate,
      days: daysList,
      totalMinutes: differenceInMinutes(maxDate, minDate),
    };
  }, [lotes]);

  const getBarPosition = (inicio: Date, fim: Date) => {
    const startOffset = differenceInMinutes(inicio, startDate);
    const duration = differenceInMinutes(fim, inicio);
    const left = (startOffset / totalMinutes) * 100;
    const width = Math.max((duration / totalMinutes) * 100, 0.5);
    return { left: `${left}%`, width: `${width}%` };
  };

  // Group lotes by forma for visual rows
  const formaRows = useMemo(() => {
    const rows = new Map<string, GanttLote[]>();
    for (const lote of lotes) {
      const existing = rows.get(lote.forma_id) || [];
      existing.push(lote);
      rows.set(lote.forma_id, existing);
    }
    return Array.from(rows.entries());
  }, [lotes]);

  if (lotes.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Nenhum lote agendado. Adicione itens de produção e clique em "Recalcular Agenda".</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Gantt de Produção Agendada</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
          {' • '}{lotes.length} lotes
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Timeline header */}
          <div className="flex border-b border-border bg-secondary/30">
            <div className="w-48 flex-shrink-0 px-4 py-2 border-r border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Forma
              </span>
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {days.map((day, idx) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex-1 text-center py-2 text-xs border-r border-border/50 min-w-[60px]',
                        isWeekend && 'bg-muted/30'
                      )}
                    >
                      <div className="font-medium text-muted-foreground">
                        {format(day, 'dd')}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gantt rows by forma */}
          <div className="relative">
            {formaRows.map(([formaId, formaLotes], rowIdx) => {
              const forma = getForma(formaId);

              return (
                <div
                  key={formaId}
                  className={cn(
                    'flex border-b border-border/50',
                    rowIdx % 2 === 0 ? 'bg-card' : 'bg-secondary/10'
                  )}
                >
                  {/* Forma info */}
                  <div className="w-48 flex-shrink-0 px-4 py-3 border-r border-border">
                    <div className="text-sm font-medium text-foreground truncate">
                      {forma?.code || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {forma?.name}
                    </div>
                  </div>

                  {/* Gantt bar area */}
                  <div className="flex-1 relative py-2 px-1 min-h-[50px]">
                    {/* Weekend backgrounds */}
                    {days.map((day, dayIdx) => {
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      if (!isWeekend) return null;
                      const left = (dayIdx / days.length) * 100;
                      return (
                        <div
                          key={dayIdx}
                          className="absolute top-0 bottom-0 bg-muted/20"
                          style={{ left: `${left}%`, width: `${100 / days.length}%` }}
                        />
                      );
                    })}

                    {/* Lote bars */}
                    {formaLotes.map((lote) => {
                      const obra = getObra(lote.obra_id);
                      const position = getBarPosition(new Date(lote.inicio), new Date(lote.fim));
                      const priorityColor = obra ? PRIORITY_COLORS[obra.priority] : 'bg-primary';

                      return (
                        <Tooltip key={lote.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-1 h-8 rounded cursor-pointer transition-all hover:brightness-110 flex items-center gap-1 px-1',
                                priorityColor
                              )}
                              style={position}
                            >
                              {lote.setup_aplicado && (
                                <Settings className="h-3 w-3 text-white/80 flex-shrink-0" />
                              )}
                              <span className="text-[10px] font-medium text-white truncate">
                                {obra?.code} ({lote.quantidade})
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{obra?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Grupo: {lote.grupo_altura_cm}x{lote.grupo_base_cm}cm
                              </p>
                              <div className="flex gap-4 text-xs">
                                <span>Início: {format(new Date(lote.inicio), 'dd/MM HH:mm')}</span>
                                <span>Fim: {format(new Date(lote.fim), 'dd/MM HH:mm')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Clock className="h-3 w-3" />
                                <span>{lote.tempo_producao_min} min produção</span>
                              </div>
                              {lote.setup_aplicado && (
                                <p className="text-xs text-amber-400 flex items-center gap-1">
                                  <Settings className="h-3 w-3" />
                                  Setup: +{lote.setup_minutos} min
                                </p>
                              )}
                              <p className="text-xs">Quantidade: {lote.quantidade} peças</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-border bg-secondary/20 flex items-center gap-6 flex-wrap">
        <span className="text-xs text-muted-foreground">Prioridade:</span>
        {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
          <div key={priority} className="flex items-center gap-1">
            <span className={cn('w-4 h-2 rounded', color)} />
            <span className="text-xs text-muted-foreground capitalize">
              {priority === 'critical' ? 'Crítico' : 
               priority === 'high' ? 'Alto' : 
               priority === 'medium' ? 'Médio' : 'Baixo'}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-4">
          <Settings className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Setup aplicado</span>
        </div>
      </div>
    </div>
  );
}
