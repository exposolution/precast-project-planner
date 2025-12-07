import { DateSuggestion } from '@/hooks/useCycleSchedule';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Package, CheckCircle2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DateSuggestionPanelProps {
  suggestion: DateSuggestion;
  onAccept: (startDate: string, endDate: string, formaId: string) => void;
  onSelectAlternative?: (formaId: string) => void;
}

export function DateSuggestionPanel({ suggestion, onAccept, onSelectAlternative }: DateSuggestionPanelProps) {
  return (
    <div className="bg-secondary/30 rounded-lg p-4 space-y-4 border border-primary/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h4 className="font-medium text-foreground">Janela Disponível Encontrada</h4>
        </div>
        <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
          Ciclo de {suggestion.cycleDurationHours}h
        </div>
      </div>

      {/* Main suggestion */}
      <div className="bg-card rounded-lg p-3 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{suggestion.selectedForma.code}</span>
            <span className="text-muted-foreground text-sm">({suggestion.selectedForma.name})</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Cap: {suggestion.selectedForma.capacity} peças/ciclo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Data Inicial</span>
            <span className="font-medium">
              {format(new Date(suggestion.startDate), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Data Final</span>
            <span className="font-medium">
              {format(new Date(suggestion.endDate), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{suggestion.numCycles} ciclo{suggestion.numCycles > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{suggestion.totalPieces} peças</span>
          </div>
        </div>

        <Button
          className="w-full mt-3 gap-2"
          onClick={() => onAccept(suggestion.startDate, suggestion.endDate, suggestion.selectedForma.id)}
        >
          <CheckCircle2 className="h-4 w-4" />
          Aceitar Esta Janela
        </Button>
      </div>

      {/* Cycle windows breakdown */}
      {suggestion.windows.length > 1 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground uppercase">Ciclos Alocados</h5>
          <div className="space-y-1">
            {suggestion.windows.map((window, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between text-xs bg-card/50 rounded px-2 py-1.5 border border-border/50"
              >
                <span className="font-medium">Ciclo {idx + 1}</span>
                <span className="text-muted-foreground">
                  {format(new Date(window.startDate), "dd/MM HH:mm")} →{' '}
                  {format(new Date(window.endDate), "dd/MM HH:mm")}
                </span>
                <span className="text-primary">{window.capacity} peças</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative forms */}
      {suggestion.alternatives.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground uppercase">Formas Alternativas</h5>
          <div className="grid gap-2">
            {suggestion.alternatives.map((alt) => (
              <div 
                key={alt.formaId}
                className="flex items-center justify-between text-sm bg-card/50 rounded-lg p-2 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => onSelectAlternative?.(alt.formaId)}
              >
                <div>
                  <span className="font-medium">{alt.formaCode}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{alt.formaName}</span>
                </div>
                <div className="text-right text-xs">
                  <div className="text-muted-foreground">Cap: {alt.capacity}/ciclo</div>
                  <div>
                    {format(new Date(alt.startDate), "dd/MM")} disponível
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}