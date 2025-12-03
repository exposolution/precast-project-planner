import { Forma, ProductionItem } from '@/types/production';
import { cn } from '@/lib/utils';
import { Box, Wrench, CheckCircle, Clock } from 'lucide-react';

interface FormasListProps {
  formas: Forma[];
  productionItems: ProductionItem[];
}

export function FormasList({ formas, productionItems }: FormasListProps) {
  const getFormaUsage = (formaId: string) => {
    const items = productionItems.filter(item => item.formaId === formaId);
    const inProgress = items.filter(item => item.status === 'in-progress').length;
    const pending = items.filter(item => item.status === 'pending').length;
    return { total: items.length, inProgress, pending };
  };

  const getStatusIcon = (status: Forma['status']) => {
    const icons = {
      available: <CheckCircle className="w-4 h-4 text-success" />,
      'in-use': <Clock className="w-4 h-4 text-primary" />,
      maintenance: <Wrench className="w-4 h-4 text-warning" />,
    };
    return icons[status];
  };

  const getStatusLabel = (status: Forma['status']) => {
    const labels = {
      available: 'Disponível',
      'in-use': 'Em Uso',
      maintenance: 'Manutenção',
    };
    return labels[status];
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Formas / Seções</h3>
        <span className="text-xs text-muted-foreground">{formas.length} formas</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {formas.map((forma) => {
          const usage = getFormaUsage(forma.id);
          
          return (
            <div key={forma.id} className="p-4 bg-card table-row-hover">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  forma.status === 'available' && 'bg-success/20',
                  forma.status === 'in-use' && 'bg-primary/20',
                  forma.status === 'maintenance' && 'bg-warning/20'
                )}>
                  <Box className={cn(
                    'w-5 h-5',
                    forma.status === 'available' && 'text-success',
                    forma.status === 'in-use' && 'text-primary',
                    forma.status === 'maintenance' && 'text-warning'
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{forma.code}</span>
                    {getStatusIcon(forma.status)}
                  </div>
                  <h4 className="font-medium text-foreground text-sm mt-0.5">{forma.name}</h4>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>
                      {forma.dimensions.length}×{forma.dimensions.width}×{forma.dimensions.height}cm
                    </span>
                    <span>•</span>
                    <span>{forma.capacity} pç/dia</span>
                  </div>

                  {usage.total > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {usage.inProgress > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          {usage.inProgress} em produção
                        </span>
                      )}
                      {usage.pending > 0 && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          {usage.pending} na fila
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
