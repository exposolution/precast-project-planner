import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CicloPeca {
  id: string;
  productionItemId: string;
  obraId: string;
  quantidade: number;
  inicioPrevisto: string;
  fimPrevisto: string;
  status: string;
  ordemNoCiclo: number;
}

export interface Ciclo {
  cicloId: string;
  cicloNumero: number;
  inicio: string;
  fim: string;
  capacidadeTotal: number;
  capacidadeOcupada: number;
  predecessor: string | null;
  status: string;
  atrasoMinutos: number;
  pecas: CicloPeca[];
}

export interface FormaSchedule {
  formaId: string;
  forma: {
    id: string;
    name: string;
    code: string;
    capacity: number;
  };
  ciclos: Ciclo[];
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
  numCycles: number;
  totalPieces: number;
  cycleDurationHours: number;
  windows: {
    startDate: string;
    endDate: string;
    capacity: number;
  }[];
  alternatives: {
    formaId: string;
    formaName: string;
    formaCode: string;
    capacity: number;
    startDate: string;
    endDate: string;
  }[];
}

export const useCycleSchedule = () => {
  return useQuery({
    queryKey: ['cycle-schedule'],
    queryFn: async (): Promise<FormaSchedule[]> => {
      const { data, error } = await supabase.functions.invoke('schedule', {
        body: { action: 'get_schedule' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.schedule;
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
      queryClient.invalidateQueries({ queryKey: ['cycle-schedule'] });
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
      formaId?: string;
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

export const useApplyDelay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      cicloId: string;
      delayMinutes: number;
      delayType: 'cycle' | 'piece' | 'forma';
    }) => {
      const { data, error } = await supabase.functions.invoke('schedule', {
        body: { 
          action: 'apply_delay',
          ...params
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cycle-schedule'] });
      toast({ 
        title: 'Atraso aplicado',
        description: data.message 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao aplicar atraso', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};