import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Obra, Priority, Urgency } from '@/types/production';
import { toast } from '@/hooks/use-toast';

export type ObraInsert = {
  name: string;
  code: string;
  priority: Priority;
  urgency?: Urgency; // Make urgency optional for insert
  deadline: Date;
  location: string;
  status?: 'active' | 'paused' | 'completed';
};

const mapDbToObra = (db: any): Obra => ({
  id: db.id,
  name: db.name,
  code: db.code,
  priority: db.priority as Priority,
  urgency: db.urgencia as Urgency, // Map new urgency field
  deadline: new Date(db.deadline),
  location: db.location,
  status: db.status as 'active' | 'paused' | 'completed',
});

export const useObras = () => {
  return useQuery({
    queryKey: ['obras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(mapDbToObra);
    },
  });
};

export const useCreateObra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (obra: ObraInsert) => {
      const { data, error } = await supabase
        .from('obras')
        .insert({
          name: obra.name,
          code: obra.code,
          priority: obra.priority,
          urgencia: obra.urgency || 'normal', // Default to 'normal' if not provided
          deadline: obra.deadline.toISOString(),
          location: obra.location,
          status: obra.status || 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToObra(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      toast({ title: 'Obra criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar obra', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteObra = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('obras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      toast({ title: 'Obra excluída com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir obra', description: error.message, variant: 'destructive' });
    },
  });
};