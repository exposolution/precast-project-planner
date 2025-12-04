import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductionItem, Priority } from '@/types/production';
import { toast } from '@/hooks/use-toast';

export type ProductionItemInsert = {
  obraId: string;
  formaId?: string | null; // Forma might not be assigned yet
  quantity: number;
  produced?: number;
  startDate: Date;
  endDate: Date;
  priority: Priority;
  status?: 'pending' | 'in-progress' | 'completed' | 'delayed';
  notes?: string;
  altura: number; // New field
  base: number; // New field
  comprimento: number; // New field
  tempoUnitarioMinutos: number; // New field
};

const mapDbToProductionItem = (db: any): ProductionItem => ({
  id: db.id,
  obraId: db.obra_id,
  formaId: db.forma_id,
  quantity: db.quantity,
  produced: db.produced,
  startDate: new Date(db.start_date),
  endDate: new Date(db.end_date),
  priority: db.priority as Priority,
  status: db.status as 'pending' | 'in-progress' | 'completed' | 'delayed',
  notes: db.notes,
  altura: db.altura_cm, // Map new field
  base: db.base_cm,     // Map new field
  comprimento: db.comprimento_cm, // Map new field
  tempoUnitarioMinutos: db.tempo_unitario_minutos, // Map new field
});

export const useProductionItems = () => {
  return useQuery({
    queryKey: ['production_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(mapDbToProductionItem);
    },
  });
};

export const useCreateProductionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: ProductionItemInsert) => {
      const { data, error } = await supabase
        .from('production_items')
        .insert({
          obra_id: item.obraId,
          forma_id: item.formaId || null, // Allow null for formaId
          quantity: item.quantity,
          produced: item.produced || 0,
          start_date: item.startDate.toISOString(),
          end_date: item.endDate.toISOString(),
          priority: item.priority,
          status: item.status || 'pending',
          notes: item.notes,
          altura_cm: item.altura, // Insert new field
          base_cm: item.base,     // Insert new field
          comprimento_cm: item.comprimento, // Insert new field
          tempo_unitario_minutos: item.tempoUnitarioMinutos, // Insert new field
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToProductionItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_items'] });
      toast({ title: 'Item de produção criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar item', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateProductionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, produced, status, formaId }: { id: string; produced?: number; status?: string; formaId?: string | null }) => {
      const updates: any = {};
      if (produced !== undefined) updates.produced = produced;
      if (status) updates.status = status;
      if (formaId !== undefined) updates.forma_id = formaId; // Allow updating formaId

      const { data, error } = await supabase
        .from('production_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbToProductionItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_items'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteProductionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('production_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_items'] });
      toast({ title: 'Item excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    },
  });
};