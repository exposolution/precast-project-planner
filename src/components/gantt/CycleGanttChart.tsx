import { useMemo, useState } from 'react';
import { Obra, Forma } from '@/types/production';
import { FormaSchedule, Ciclo, useApplyDelay } from '@/hooks/useCycleSchedule';
import { format, differenceInHours, startOfDay, addDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, AlertTriangle, ArrowRight, Package, Settings2 } from 'lucide-react';

interface CycleGanttChartProps {
  schedule: FormaSchedule[];
  obras: Obra[];
  formas: Forma[];
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-primary',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  delayed: 'bg-red-500',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em Produção',
  completed: 'Concluído',
  delayed: 'Atrasado',
};

export function CycleGanttChart({ schedule, obras, formas }: CycleGanttChartProps) {
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [selectedCiclo, setSelectedCiclo] = useState<{ formaId: string; ciclo: Ciclo } | null>(null);
  const [delayMinutes, setDelayMinutes] = useState('60');
  
  const applyDelay = useApplyDelay();
  
  const getObra = (id: string) => obras.find(o => o.id === id);
  const getForma = (id: string) => formas.find(f => f.id === id);

  const { startDate, endDate, days, totalHours } = useMemo(() => {
    const allDates: Date[] = [];
    
    for (const formaSchedule of schedule) {
      for (const ciclo of formaSchedule.ciclos) {
        allDates.push(new Date(ciclo.inicio));
        allDates.push(new Date(ciclo.fim));
      }
    }
    
    if (allDates.length === 0) {
      const today = startOfDay(new Date());
      const end = addDays(today, 14);
      return {
        startDate: today,
        endDate: end,
        days: eachDayOfInterval({ start: today, end }),
        totalHours: 14 * 24,
      };
    }

    const minDate = startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const maxDate = startOfDay(addDays(new Date(Math.max(...allDates.map(d => d.getTime()))), 1));
    const daysList = eachDayOfInterval({ start: minDate, end: maxDate });

    return {
      startDate: minDate,
      endDate: maxDate,
      days: daysList,
      totalHours: differenceInHours(maxDate, minDate),
    };
  }, [schedule]);

  const getBarPosition = (inicio: Date, fim: Date) => {
    const startOffset = differenceInHours(inicio, startDate);
    const duration = differenceInHours(fim, inicio);
    const left = (startOffset / totalHours) * 100;
    const width = Math.max((duration / totalHours) * 100, 1);
    return { left: `${left}%`, width: `${width}%` };
  };

  const handleApplyDelay = async () => {
    if (!selectedCiclo) return;
    
    await applyDelay.mutateAsync({
      cicloId: selectedCiclo.ciclo.cicloId,
      delayMinutes: parseInt(delayMinutes, 10),
      delayType: 'cycle'
    });
    
    setDelayDialogOpen(false);
    setSelectedCiclo(null);
  };

  if (schedule.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum ciclo agendado. Adicione itens de produção e clique em "Recalcular Agenda".
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Gantt de Produção - Ciclos de 24h (FS)
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
          {' • '}Cada barra representa um ciclo de 24h
          {' • '}Dependência FS (Finish-to-Start)
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Timeline header */}
          <div className="flex border-b border-border bg-secondary/30">
            <div className="w-56 flex-shrink-0 px-4 py-2 border-r border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Forma (Swimlane)
              </span>
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {days.map((day, idx) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex-1 text-center py-2 text-xs border-r border-border/50 min-w-[80px]',
                        isWeekend && 'bg-muted/30',
                        isToday && 'bg-primary/10'
                      )}
                    >
                      <div className={cn('font-medium', isToday && 'text-primary')}>
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

          {/* Gantt rows - one per forma (swimlane) */}
          <div className="relative">
            {schedule.map((formaSchedule, rowIdx) => {
              const forma = formaSchedule.forma || getForma(formaSchedule.formaId);

              return (
                <div
                  key={formaSchedule.formaId}
                  className={cn(
                    'flex border-b border-border/50',
                    rowIdx % 2 === 0 ? 'bg-card' : 'bg-secondary/10'
                  )}
                >
                  {/* Forma info */}
                  <div className="w-56 flex-shrink-0 px-4 py-3 border-r border-border">
                    <div className="text-sm font-medium text-foreground truncate">
                      {forma?.code || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {forma?.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Capacidade: {forma?.capacity || 0} peças/ciclo
                    </div>
                  </div>

                  {/* Gantt bar area */}
                  <div className="flex-1 relative py-2 px-1 min-h-[70px]">
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

                    {/* Cycle bars with FS connections */}
                    {formaSchedule.ciclos.map((ciclo, cicloIdx) => {
                      const position = getBarPosition(new Date(ciclo.inicio), new Date(ciclo.fim));
                      const statusColor = STATUS_COLORS[ciclo.status] || 'bg-primary';
                      const utilizacao = Math.round((ciclo.capacidadeOcupada / ciclo.capacidadeTotal) * 100);
                      const hasDelay = ciclo.atrasoMinutos > 0;

                      return (
                        <div key={ciclo.cicloId}>
                          {/* FS Connection arrow (if has predecessor) */}
                          {ciclo.predecessor && cicloIdx > 0 && (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 text-muted-foreground/50"
                              style={{ 
                                left: position.left,
                                marginLeft: '-12px'
                              }}
                            >
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'absolute top-2 h-12 rounded-md cursor-pointer transition-all hover:brightness-110 border-2 border-transparent hover:border-foreground/20',
                                  statusColor,
                                  hasDelay && 'ring-2 ring-red-400 ring-offset-1'
                                )}
                                style={position}
                                onClick={() => {
                                  setSelectedCiclo({ formaId: formaSchedule.formaId, ciclo });
                                  setDelayDialogOpen(true);
                                }}
                              >
                                {/* Capacity indicator */}
                                <div 
                                  className="absolute inset-0 bg-white/20 rounded-md"
                                  style={{ width: `${utilizacao}%` }}
                                />
                                
                                <div className="relative h-full flex flex-col justify-center px-2">
                                  <div className="flex items-center gap-1">
                                    {hasDelay && <AlertTriangle className="h-3 w-3 text-white" />}
                                    <span className="text-[10px] font-bold text-white">
                                      Ciclo {ciclo.cicloNumero}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] text-white/80">
                                    <Package className="h-2.5 w-2.5" />
                                    <span>{ciclo.capacidadeOcupada}/{ciclo.capacidadeTotal}</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                  <p className="font-medium">Ciclo {ciclo.cicloNumero}</p>
                                  <span className={cn(
                                    'px-2 py-0.5 rounded text-[10px] font-medium',
                                    statusColor,
                                    'text-white'
                                  )}>
                                    {STATUS_LABELS[ciclo.status]}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Início:</span>
                                    <p>{format(new Date(ciclo.inicio), "dd/MM HH:mm")}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Fim:</span>
                                    <p>{format(new Date(ciclo.fim), "dd/MM HH:mm")}</p>
                                  </div>
                                </div>
                                
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Capacidade:</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                      <div 
                                        className={cn('h-full', statusColor)}
                                        style={{ width: `${utilizacao}%` }}
                                      />
                                    </div>
                                    <span className="font-medium">{utilizacao}%</span>
                                  </div>
                                </div>
                                
                                {hasDelay && (
                                  <p className="text-xs text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Atraso: {Math.round(ciclo.atrasoMinutos / 60)}h {ciclo.atrasoMinutos % 60}min
                                  </p>
                                )}
                                
                                {ciclo.pecas.length > 0 && (
                                  <div className="text-xs border-t border-border pt-2 mt-2">
                                    <span className="text-muted-foreground">Peças no ciclo:</span>
                                    <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                      {ciclo.pecas.map((peca, idx) => {
                                        const obra = getObra(peca.obraId);
                                        return (
                                          <div key={idx} className="flex items-center justify-between text-[10px] bg-secondary/50 rounded px-1.5 py-0.5">
                                            <span className="font-medium">{obra?.code || 'N/A'}</span>
                                            <span>{peca.quantidade} peças</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                                  Clique para aplicar atraso
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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
        <span className="text-xs text-muted-foreground">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <span className={cn('w-4 h-2 rounded', color)} />
            <span className="text-xs text-muted-foreground">
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-4">
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Dependência FS</span>
        </div>
      </div>

      {/* Delay Dialog */}
      <Dialog open={delayDialogOpen} onOpenChange={setDelayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Aplicar Atraso ao Ciclo
            </DialogTitle>
          </DialogHeader>
          
          {selectedCiclo && (
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Forma:</span>{' '}
                  <span className="font-medium">{getForma(selectedCiclo.formaId)?.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Ciclo:</span>{' '}
                  <span className="font-medium">{selectedCiclo.ciclo.cicloNumero}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Início atual:</span>{' '}
                  <span className="font-medium">
                    {format(new Date(selectedCiclo.ciclo.inicio), "dd/MM/yyyy HH:mm")}
                  </span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delay">Atraso em minutos</Label>
                <Input
                  id="delay"
                  type="number"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Todos os ciclos subsequentes desta forma serão reagendados (FS).
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDelayDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleApplyDelay}
                  disabled={applyDelay.isPending}
                  className="gap-2"
                >
                  {applyDelay.isPending && (
                    <span className="animate-spin">⏳</span>
                  )}
                  Aplicar Atraso
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}