import { useMemo } from 'react';
import { Lote, Obra, Forma } from '@/types/production';
import { format, differenceInDays, addDays, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GanttChartProps {
  lotes: Lote[]; // Now accepts Lote objects
  obras: Obra[]; // Still needed for full obra details if necessary
  formas: Forma[]; // Still needed for full forma details if necessary
}

export function GanttChart({ lotes, obras, formas }: GanttChartProps) {
  const getObra = (id: string) => obras.find(o => o.id === id);
  const getForma = (id: string) => formas.find(f => f.id === id);

  const { startDate, endDate, days, totalDays } = useMemo(() => {
    if (lotes.length === 0) {
      const today = startOfDay(new Date());
      return {
        startDate: addDays(today, -7),
        endDate: addDays(today, 7),
        days: eachDayOfInterval({ start: addDays(today, -7), end: addDays(today, 7) }),
        totalDays: 15,
      };
    }
    const dates = lotes.flatMap(lote => [lote.startDate, lote.endDate]);
    const minDate = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = startOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));
    const adjustedStart = addDays(minDate, -1);
    const adjustedEnd = addDays(maxDate, 2);
    const daysList = eachDayOfInterval({ start: adjustedStart, end: adjustedEnd });
    
    return {
      startDate: adjustedStart,
      endDate: adjustedEnd,
      days: daysList,
      totalDays: daysList.length,
    };
  }, [lotes]);

  const getBarPosition = (itemStart: Date, itemEnd: Date) => {
    const startOffset = differenceInDays(startOfDay(itemStart), startDate);
    const duration = differenceInDays(startOfDay(itemEnd), startOfDay(itemStart)) + 1;
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const today = startOfDay(new Date());
  const todayPosition = ((differenceInDays(today, startDate) + 0.5) / totalDays) * 100;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Gráfico Gantt - Cronograma de Produção</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline header */}
          <div className="flex border-b border-border bg-secondary/30">
            <div className="w-64 flex-shrink-0 px-4 py-2 border-r border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lote
              </span>
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {days.map((day, idx) => {
                  const isCurrentDay = isSameDay(day, today);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex-1 text-center py-2 text-xs border-r border-border/50',
                        isCurrentDay && 'bg-primary/10',
                        isWeekend && 'bg-muted/30'
                      )}
                    >
                      <div className={cn(
                        'font-medium',
                        isCurrentDay ? 'text-primary' : 'text-muted-foreground'
                      )}>
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

          {/* Gantt rows */}
          <div className="relative">
            {/* Today line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
              style={{ left: `calc(256px + ${todayPosition}% * (100% - 256px) / 100)` }}
            >
              <div className="absolute -top-1 -left-2 bg-primary text-primary-foreground text-[10px] px-1 rounded">
                Hoje
              </div>
            </div>

            {lotes.map((lote, idx) => {
              const obra = getObra(lote.obraId);
              const forma = getForma(lote.formaId);
              const position = getBarPosition(lote.startDate, lote.endDate);

              return (
                <div
                  key={lote.id}
                  className={cn(
                    'flex border-b border-border/50 hover:bg-secondary/20 transition-colors',
                    idx % 2 === 0 && 'bg-card',
                    idx % 2 === 1 && 'bg-secondary/10'
                  )}
                >
                  {/* Task info */}
                  <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-border">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={lote.priority} size="sm" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {lote.obraCode}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {lote.formaCode} • {lote.quantity} peças
                    </div>
                  </div>

                  {/* Gantt bar area */}
                  <div className="flex-1 relative py-3 px-2">
                    <div className="relative h-8">
                      {/* Weekend backgrounds */}
                      {days.map((day, dayIdx) => {
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        if (!isWeekend) return null;
                        const left = (dayIdx / totalDays) * 100;
                        return (
                          <div
                            key={dayIdx}
                            className="absolute top-0 bottom-0 bg-muted/20"
                            style={{ left: `${left}%`, width: `${100 / totalDays}%` }}
                          />
                        );
                      })}

                      {/* Bar */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'absolute top-1 h-6 rounded cursor-pointer transition-all hover:brightness-110',
                              `gantt-bar-${lote.priority}`
                            )}
                            style={position}
                          >
                            {lote.setupApplied && (
                                <span className="absolute -left-2 top-1/2 -translate-y-1/2 text-[8px] text-foreground bg-secondary px-1 rounded-full">
                                  Setup
                                </span>
                            )}
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-foreground drop-shadow-sm">
                              {lote.quantity} pçs
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium">{obra?.name} ({lote.obraCode})</p>
                            <p className="text-xs text-muted-foreground">{forma?.name} ({lote.formaCode})</p>
                            <p className="text-xs">Quantidade: {lote.quantity} peças</p>
                            <div className="flex gap-4 text-xs">
                              <span>Início: {format(lote.startDate, 'dd/MM HH:mm')}</span>
                              <span>Fim: {format(lote.endDate, 'dd/MM HH:mm')}</span>
                            </div>
                            {lote.setupApplied && <p className="text-xs text-muted-foreground">Setup aplicado</p>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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
        <div className="flex items-center gap-1">
          <span className="w-4 h-2 rounded gantt-bar-critical" />
          <span className="text-xs text-muted-foreground">Crítico</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-2 rounded gantt-bar-high" />
          <span className="text-xs text-muted-foreground">Alto</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-2 rounded gantt-bar-medium" />
          <span className="text-xs text-muted-foreground">Médio</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-2 rounded gantt-bar-low" />
          <span className="text-xs text-muted-foreground">Baixo</span>
        </div>
      </div>
    </div>
  );
}