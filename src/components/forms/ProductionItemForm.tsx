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
  const [altura, setAltura] = useState(''); // New state
  const [base, setBase] = useState('');     // New state
  const [comprimento, setComprimento] = useState(''); // New state
  const [tempoUnitarioMinutos, setTempoUnitarioMinutos] = useState(''); // New state

  const createItem = useCreateProductionItem();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate(
      {
        obraId,
        formaId: formaId || null, // Allow formaId to be null if not selected
        quantity: Number(quantity),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priority,
        notes: notes || undefined,
        altura: altura ? Number(altura) : null, // Pass null if empty
        base: base ? Number(base) : null,     // Pass null if empty
        comprimento: comprimento ? Number(comprimento) : null, // Pass null if empty
        tempoUnitarioMinutos: tempoUnitarioMinutos ? Number(tempoUnitarioMinutos) : null, // Pass null if empty
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
          setAltura('');
          setBase('');
          setComprimento('');
          setTempoUnitarioMinutos('');
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
              <Label htmlFor="forma">Forma/Seção (Opcional)</Label>
              <Select value={formaId} onValueChange={setFormaId}>
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
              <Label htmlFor="altura">Altura (cm)</Label>
              <Input
                id="altura"
                type="number"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                placeholder="30"
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base">Base (cm)</Label>
              <Input
                id="base"
                type="number"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                placeholder="40"
                min="1"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comprimento">Comprimento (cm)</Label>
              <Input
                id="comprimento"
                type="number"
                value={comprimento}
                onChange={(e) => setComprimento(e.target.value)}
                placeholder="200"
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempoUnitarioMinutos">Tempo Unitário (min)</Label>
              <Input
                id="tempoUnitarioMinutos"
                type="number"
                value={tempoUnitarioMinutos}
                onChange={(e) => setTempoUnitarioMinutos(e.target.value)}
                placeholder="60"
                min="1"
                required
              />
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