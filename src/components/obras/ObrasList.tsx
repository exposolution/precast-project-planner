import { Obra, ProductionItem } from '@/types/production';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Calendar, Package, AlertTriangle, CheckCircle2, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ObrasListProps {
  obras: Obra[];
  productionItems: ProductionItem[];
}

export function ObrasList({ obras, productionItems }: ObrasListProps) {
  const getObraStats = (obraId: string) => {
    const items = productionItems.filter(item => item.obraId === obraId);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalProduced = items.reduce((sum, item) => sum + item.produced, 0);
    const progress = totalQuantity > 0 ? (totalProduced / totalQuantity) * 100 : 0;
    return { itemCount: items.length, totalQuantity, totalProduced, progress };
  };

  const getStatusIcon = (status: Obra['status']) => {
    const icons = {
      active: <CheckCircle2 className="w-4 h-4 text-success" />,
      paused: <PauseCircle className="w-4 h-4 text-warning" />,
      completed: <CheckCircle2 className="w-4 h-4 text-muted-foreground" />,
    };
    return icons[status];
  };

  const getDaysUntilDeadline = (deadline: Date) => {
    const days = differenceInDays(deadline, new Date());
    return days;
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Obras Cadastradas</h3>
        <span className="text-xs text-muted-foreground">{obras.length} obras</span>
      </div>
      <div className="divide-y divide-border">
        {obras.map((obra) => {
          const stats = getObraStats(obra.id);
          const daysLeft = getDaysUntilDeadline(obra.deadline);
          const isUrgent = daysLeft <= 7 && daysLeft >= 0;
          const isOverdue = daysLeft < 0;

          return (
            <div key={obra.id} className="p-4 table-row-hover">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                  obra.priority === 'critical' && 'bg-destructive/20',
                  obra.priority === 'high' && 'bg-primary/20',
                  obra.priority === 'medium' && 'bg-warning/20',
                  obra.priority === 'low' && 'bg-muted'
                )}>
                  <span className="text-lg font-bold font-mono text-foreground">
                    {obra.code.split('-')[1]}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusIcon(obra.status)}
                    <h4 className="font-medium text-foreground">{obra.name}</h4>
                    <PriorityBadge priority={obra.priority} size="sm" />
                    {isUrgent && (
                      <span className="flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle className="w-3 h-3" />
                        Urgente
                      </span>
                    )}
                    {isOverdue && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        Atrasado
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {obra.location}
                    </span>
                    <span className={cn(
                      'flex items-center gap-1',
                      isOverdue && 'text-destructive',
                      isUrgent && !isOverdue && 'text-warning'
                    )}>
                      <Calendar className="w-3 h-3" />
                      {format(obra.deadline, "dd MMM yyyy", { locale: ptBR })}
                      <span className="text-muted-foreground/70">
                        ({daysLeft >= 0 ? `${daysLeft}d restantes` : `${Math.abs(daysLeft)}d atraso`})
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {stats.itemCount} itens • {stats.totalProduced}/{stats.totalQuantity} peças
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={stats.progress} className="h-2 flex-1" />
                    <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                      {Math.round(stats.progress)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
