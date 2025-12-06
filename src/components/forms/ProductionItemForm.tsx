import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProductionItem } from '@/hooks/useProductionItems';
import { useSuggestDate, DateSuggestion } from '@/hooks/useGanttSchedule';
import { Plus, CalendarClock, Loader2, Sparkles } from 'lucide-react';
import { Priority, Obra, Forma } from '@/types/production';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProductionItemFormProps {
  obras: Obra[];
  formas: Forma[];
}

export const ProductionItemForm = ({ obras, formas }: ProductionItemFormProps) => {
  const [open, setOpen] = useState(false);
  const [obraId, setObraId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');
  const [pieceHeight, setPieceHeight] = useState(''); // New state
  const [pieceWidth, setPieceWidth] = useState('');   // New state
  const [pieceLength, setPieceLength] = useState(''); // New state
  const [unitProductionTimeMinutes, setUnitProductionTimeMinutes] = useState('');
  const [dateSuggestion, setDateSuggestion] = useState<DateSuggestion | null>(null);

  const createItem = useCreateProductionItem();
  const suggestDate = useSuggestDate();

  // Auto-suggest date when dimensions and quantity are filled
  useEffect(() => {
    const height = Number(pieceHeight);
    const width = Number(pieceWidth);
    const length = Number(pieceLength);
    const qty = Number(quantity);
    const tempo = Number(unitProductionTimeMinutes);

    if (height > 0 && width > 0 && length > 0 && qty > 0 && tempo > 0) {
      suggestDate.mutate({
        pieceHeight: height,
        pieceWidth: width,
        pieceLength: length,
        quantity: qty,
        tempoUnitario: tempo
      }, {
        onSuccess: (suggestion) => {
          if (suggestion) {
            setDateSuggestion(suggestion);
            // Auto-fill dates if empty
            if (!startDate && suggestion.startDate) {
              setStartDate(suggestion.startDate.split('T')[0]);
            }
            if (!endDate && suggestion.endDate) {
              setEndDate(suggestion.endDate.split('T')[0]);
            }
            // Auto-select suggested forma if none selected
            if (!formaId && suggestion.selectedForma) {
              setFormaId(suggestion.selectedForma.id);
            }
          }
        }
      });
    }
  }, [pieceHeight, pieceWidth, pieceLength, quantity, unitProductionTimeMinutes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate(
      {
        obraId,
        formaId,
        quantity: Number(quantity),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priority,
        notes: notes || undefined,
        pieceHeight: Number(pieceHeight), // Include new field
        pieceWidth: Number(pieceWidth),   // Include new field
        pieceLength: Number(pieceLength), // Include new field
        unitProductionTimeMinutes: Number(unitProductionTimeMinutes), // Include new field
      },
      {
        onSuccess: () => {
          setOpen(false);
          setObraId('');
          setFormaId('');
          setQuantity('');
          setStartDate('');
          setEndDate('');
          setPriority('medium');
          setNotes('');
          setPieceHeight(''); // Reset new field
          setPieceWidth('');  // Reset new field
          setPieceLength(''); // Reset new field
          setUnitProductionTimeMinutes(''); // Reset new field
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="glow" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Item de Produção
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Item de Produção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="obra">Obra</Label>
              <Select value={obraId} onValueChange={setObraId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  {obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.code} - {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="forma">Forma/Seção Inicial</Label>
              <Select value={formaId} onValueChange={setFormaId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma" />
                </SelectTrigger>
                <SelectContent>
                  {formas.map((forma) => (
                    <SelectItem key={forma.id} value={forma.id}>
                      {forma.code} - {forma.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="24"
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pieceHeight">Altura Peça (cm)</Label>
              <Input
                id="pieceHeight"
                type="number"
                value={pieceHeight}
                onChange={(e) => setPieceHeight(e.target.value)}
                placeholder="10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pieceWidth">Largura Peça (cm)</Label>
              <Input
                id="pieceWidth"
                type="number"
                value={pieceWidth}
                onChange={(e) => setPieceWidth(e.target.value)}
                placeholder="50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pieceLength">Comp. Peça (cm)</Label>
              <Input
                id="pieceLength"
                type="number"
                value={pieceLength}
                onChange={(e) => setPieceLength(e.target.value)}
                placeholder="200"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitProductionTimeMinutes">Tempo Unitário (min)</Label>
            <Input
              id="unitProductionTimeMinutes"
              type="number"
              value={unitProductionTimeMinutes}
              onChange={(e) => setUnitProductionTimeMinutes(e.target.value)}
              placeholder="30"
              min="1"
              required
            />
          </div>

          {/* Date Suggestion Box */}
          {suggestDate.isPending && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Calculando data disponível...</span>
            </div>
          )}

          {dateSuggestion && !suggestDate.isPending && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium text-sm">Data Sugerida pelo Algoritmo</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Início:</span>
                  <p className="font-medium text-foreground">
                    {format(new Date(dateSuggestion.startDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fim Previsto:</span>
                  <p className="font-medium text-foreground">
                    {format(new Date(dateSuggestion.endDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Forma: <strong className="text-foreground">{dateSuggestion.selectedForma.code}</strong> (cap. {dateSuggestion.selectedForma.capacity})</span>
                <span>Lotes: <strong className="text-foreground">{dateSuggestion.numLotes}</strong></span>
                <span>Tempo Total: <strong className="text-foreground">{dateSuggestion.totalMinutes} min</strong></span>
              </div>

              {dateSuggestion.compatibleFormas.length > 1 && (
                <div className="text-xs text-muted-foreground">
                  <span>Formas compatíveis: </span>
                  {dateSuggestion.compatibleFormas.slice(0, 3).map((f, i) => (
                    <span key={f.id} className={cn(f.id === dateSuggestion.selectedForma.id && 'text-primary font-medium')}>
                      {f.code}{i < Math.min(dateSuggestion.compatibleFormas.length, 3) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {dateSuggestion.compatibleFormas.length > 3 && ` +${dateSuggestion.compatibleFormas.length - 3}`}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  setStartDate(dateSuggestion.startDate.split('T')[0]);
                  setEndDate(dateSuggestion.endDate.split('T')[0]);
                  setFormaId(dateSuggestion.selectedForma.id);
                }}
              >
                <CalendarClock className="h-4 w-4" />
                Usar Datas Sugeridas
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais sobre a produção..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createItem.isPending}>
              {createItem.isPending ? 'Criando...' : 'Criar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};