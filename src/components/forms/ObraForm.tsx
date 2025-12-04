import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateObra } from '@/hooks/useObras';
import { Plus } from 'lucide-react';
import { Priority, Urgency } from '@/types/production';

export const ObraForm = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [urgency, setUrgency] = useState<Urgency>('normal'); // New state
  const [atrasDeFormaId, setAtrasDeFormaId] = useState(''); // State for 'atras_de_forma'
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');

  const createObra = useCreateObra();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrgency = urgency;
    if (urgency === 'atras_de_forma:' && atrasDeFormaId) {
      finalUrgency = `atras_de_forma:${atrasDeFormaId}`;
    } else if (urgency === 'atras_de_forma:' && !atrasDeFormaId) {
      // If 'atras_de_forma' is selected but no ID, default to normal
      finalUrgency = 'normal';
    }

    createObra.mutate(
      {
        name,
        code,
        priority,
        urgency: finalUrgency, // Pass new urgency field
        deadline: new Date(deadline),
        location,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setCode('');
          setPriority('medium');
          setUrgency('normal');
          setAtrasDeFormaId('');
          setDeadline('');
          setLocation('');
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
            <Label htmlFor="urgency">Urgência</Label>
            <Select value={urgency} onValueChange={(v) => {
              setUrgency(v as Urgency);
              if (!v.startsWith('atras_de_forma:')) {
                setAtrasDeFormaId('');
              }
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passa_frente">Passa Frente</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="atras_de_forma:">Atrás de Forma Específica</SelectItem>
                <SelectItem value="vai_fim_fila">Vai Fim da Fila</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {urgency === 'atras_de_forma:' && (
            <div className="space-y-2">
              <Label htmlFor="atrasDeFormaId">ID da Forma para seguir</Label>
              <Input
                id="atrasDeFormaId"
                value={atrasDeFormaId}
                onChange={(e) => setAtrasDeFormaId(e.target.value)}
                placeholder="Ex: f1"
                required
              />
            </div>
          )}
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