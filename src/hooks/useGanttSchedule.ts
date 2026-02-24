import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface GanttLote {
  id: string;
  obra_id: string;
  forma_id: string;
  grupo_altura_cm: number;
  grupo_base_cm: number;
  quantidade: number;
  tempo_producao_min: number;
  setup_aplicado: boolean;
  setup_minutos: number;
  inicio: string;
  fim: string;
  ordem_fila: number;
}

export interface DateSuggestion {
  startDate: string;
  endDate: string;
  selectedForma: {
    id: string;
    name: string;
    code: string;
    capacity: number;
  };
  numLotes: number;
  totalMinutes: number;
  compatibleFormas: {
    id: string;
    name: string;
    code: string;
    capacity: number;
  }[];
}

export const useGanttLotes = () => {
  return useQuery({
    queryKey: ['gantt-lotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gantt_lotes' as any)
        .select('*')
        .order('ordem_fila', { ascending: true });

      if (error) throw error;
      return (data as unknown as GanttLote[]) || [];
    },
  });
};

export const useReschedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('schedule', {
        body: { action: 'reschedule' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gantt-lotes'] });
      toast({ 
        title: 'Agendamento recalculado',
        description: data.message 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao recalcular agendamento', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};

export const useSuggestDate = () => {
  return useMutation({
    mutationFn: async (params: {
      pieceHeight: number;
      pieceWidth: number;
      pieceLength: number;
      quantity: number;
      tempoUnitario: number;
    }): Promise<DateSuggestion | null> => {
      const { data, error } = await supabase.functions.invoke('schedule', {
        body: { 
          action: 'suggest_date',
          ...params
        }
      });

      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data.suggestion;
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao sugerir data', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};
