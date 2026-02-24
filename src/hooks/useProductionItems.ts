import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductionItem, Priority } from '@/types/production';
import { toast } from '@/hooks/use-toast';

export type ProductionItemInsert = {
  obraId: string;
  formaId: string;
  quantity: number;
  produced?: number;
  startDate: Date;
  endDate: Date;
  priority: Priority;
  status?: 'pending' | 'in-progress' | 'completed' | 'delayed';
  notes?: string;
  pieceHeight: number; // New field
  pieceWidth: number;  // New field
  pieceLength: number; // New field
  unitProductionTimeMinutes: number; // New field
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
  pieceHeight: db.piece_height, // New field
  pieceWidth: db.piece_width,   // New field
  pieceLength: db.piece_length, // New field
  unitProductionTimeMinutes: db.unit_production_time_minutes, // New field
});

export const useProductionItems = () => {
  return useQuery({
    queryKey: ['production_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_items' as any)
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
        .from('production_items' as any)
        .insert({
          obra_id: item.obraId,
          forma_id: item.formaId,
          quantity: item.quantity,
          produced: item.produced || 0,
          start_date: item.startDate.toISOString(),
          end_date: item.endDate.toISOString(),
          priority: item.priority,
          status: item.status || 'pending',
          notes: item.notes,
          piece_height: item.pieceHeight, // New field
          piece_width: item.pieceWidth,   // New field
          piece_length: item.pieceLength, // New field
          unit_production_time_minutes: item.unitProductionTimeMinutes, // New field
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
    mutationFn: async ({ id, produced, status }: { id: string; produced?: number; status?: string }) => {
      const updates: any = {};
      if (produced !== undefined) updates.produced = produced;
      if (status) updates.status = status;

      const { data, error } = await (supabase
        .from('production_items' as any) as any)
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
      const { error } = await supabase.from('production_items' as any).delete().eq('id', id);
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