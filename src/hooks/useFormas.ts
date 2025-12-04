import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Forma } from '@/types/production';
import { toast } from '@/hooks/use-toast';

export type FormaInsert = {
  name: string;
  code: string;
  altura_max: number; // New field
  base_max: number; // New field
  comprimento_max: number; // New field
  capacity: number;
  setupMinutes?: number; // New field
  status?: 'available' | 'in-use' | 'maintenance';
};

const mapDbToForma = (db: any): Forma => ({
  id: db.id,
  name: db.name,
  code: db.code,
  dimensions: {
    altura_max: Number(db.altura_max_cm), // Map new dimension field
    base_max: Number(db.base_max_cm),     // Map new dimension field
    comprimento_max: Number(db.comprimento_max_cm), // Map new dimension field
  },
  capacity: db.capacity,
  setupMinutes: db.setup_minutes, // Map new setupMinutes field
  status: db.status as 'available' | 'in-use' | 'maintenance',
});

export const useFormas = () => {
  return useQuery({
    queryKey: ['formas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(mapDbToForma);
    },
  });
};

export const useCreateForma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (forma: FormaInsert) => {
      const { data, error } = await supabase
        .from('formas')
        .insert({
          name: forma.name,
          code: forma.code,
          altura_max_cm: forma.altura_max, // Insert new dimension field
          base_max_cm: forma.base_max,     // Insert new dimension field
          comprimento_max_cm: forma.comprimento_max, // Insert new dimension field
          capacity: forma.capacity,
          setup_minutes: forma.setupMinutes || 0, // Insert new setupMinutes field
          status: forma.status || 'available',
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToForma(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formas'] });
      toast({ title: 'Forma criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar forma', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteForma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('formas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formas'] });
      toast({ title: 'Forma excluída com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir forma', description: error.message, variant: 'destructive' });
    },
  });
};