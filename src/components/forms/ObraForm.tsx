import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateObra } from '@/hooks/useObras';
import { Plus } from 'lucide-react';
import { Priority } from '@/types/production';

export const ObraForm = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [urgencia, setUrgencia] = useState<'passa_frente' | 'normal' | 'vai_fim_fila' | `atrás_de_forma:${string}`>('normal'); // New state

  const createObra = useCreateObra();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createObra.mutate(
      {
        name,
        code,
        priority,
        deadline: new Date(deadline),
        location,
        urgencia, // Include new field
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setCode('');
          setPriority('medium');
          setDeadline('');
          setLocation('');
          setUrgencia('normal'); // Reset new field
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Obra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Obra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Edifício Horizonte"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: OBR-001"
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
          <div className="space-y-2">
            <Label htmlFor="urgencia">Urgência (Agendamento)</Label>
            <Select value={urgencia} onValueChange={(v) => setUrgencia(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passa_frente">Passa Frente</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="vai_fim_fila">Vai Fim da Fila</SelectItem>
                {/* 'atrás_de_forma:X' would require a custom input or dynamic select */}
                <SelectItem value="atrás_de_forma:Forma1">Atrás da Forma 1 (Exemplo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo de Entrega</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: São Paulo, SP"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createObra.isPending}>
              {createObra.isPending ? 'Criando...' : 'Criar Obra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};