import { ProductionItem, Obra, Forma } from '@/types/production';
import { PriorityBadge } from './PriorityBadge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Package, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductionQueueProps {
  items: ProductionItem[];
  obras: Obra[];
  formas: Forma[];
}

export function ProductionQueue({ items, obras, formas }: ProductionQueueProps) {
  const getObra = (id: string) => obras.find(o => o.id === id);
  const getForma = (id: string) => formas.find(f => f.id === id);

  const getStatusColor = (status: ProductionItem['status']) => {
    const colors = {
      pending: 'bg-muted-foreground',
      'in-progress': 'bg-primary',
      completed: 'bg-success',
      delayed: 'bg-destructive',
    };
    return colors[status];
  };

  const getStatusLabel = (status: ProductionItem['status']) => {
    const labels = {
      pending: 'Pendente',
      'in-progress': 'Em Produção',
      completed: 'Concluído',
      delayed: 'Atrasado',
    };
    return labels[status];
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Fila de Produção</h3>
        <span className="text-xs text-muted-foreground">{items.length} itens</span>
      </div>
      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {items.map((item, index) => {
          const obra = getObra(item.obraId);
          const forma = getForma(item.formaId);
          const progress = (item.produced / item.quantity) * 100;

          return (
            <div
              key={item.id}
              className={cn(
                'p-4 table-row-hover',
                index === 0 && 'bg-primary/5 border-l-2 border-l-primary'
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">
                      {obra?.name}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-mono">
                      {forma?.code}
                    </span>
                    <PriorityBadge priority={item.priority} size="sm" />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {item.produced}/{item.quantity} peças
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(item.endDate, "dd MMM", { locale: ptBR })}
                    </span>
                    <span className={cn(
                      'flex items-center gap-1',
                      getStatusColor(item.status).replace('bg-', 'text-')
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(item.status))} />
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={progress} className="h-1.5" />
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
