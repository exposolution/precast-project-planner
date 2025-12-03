import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateForma } from '@/hooks/useFormas';
import { Plus } from 'lucide-react';

export const FormaForm = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<'available' | 'in-use' | 'maintenance'>('available');
  const [setupMinutes, setSetupMinutes] = useState(''); // New state

  const createForma = useCreateForma();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForma.mutate(
      {
        name,
        code,
        length: Number(length),
        width: Number(width),
        height: Number(height),
        capacity: Number(capacity),
        status,
        setup_minutes: Number(setupMinutes), // Include new field
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setCode('');
          setLength('');
          setWidth('');
          setHeight('');
          setCapacity('');
          setStatus('available');
          setSetupMinutes(''); // Reset new field
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Forma
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Forma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Viga V-40"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: FRM-V40"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Comp. (cm)</Label>
              <Input
                id="length"
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Larg. (cm)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="40"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Alt. (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="60"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade/dia</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="8"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setupMinutes">Setup (min)</Label>
              <Input
                id="setupMinutes"
                type="number"
                value={setupMinutes}
                onChange={(e) => setSetupMinutes(e.target.value)}
                placeholder="20"
                min="0"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="in-use">Em Uso</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createForma.isPending}>
              {createForma.isPending ? 'Criando...' : 'Criar Forma'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};