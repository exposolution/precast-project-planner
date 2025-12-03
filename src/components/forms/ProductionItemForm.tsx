import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProductionItem } from '@/hooks/useProductionItems';
import { Plus } from 'lucide-react';
import { Priority, Obra, Forma } from '@/types/production';

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
  const [unitProductionTimeMinutes, setUnitProductionTimeMinutes] = useState(''); // New state

  const createItem = useCreateProductionItem();

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