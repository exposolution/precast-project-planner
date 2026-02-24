
-- Tabela de ciclos Gantt (referenciada pela edge function)
CREATE TABLE public.gantt_ciclos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forma_id UUID REFERENCES public.formas(id) ON DELETE CASCADE NOT NULL,
  ciclo_numero INTEGER NOT NULL DEFAULT 1,
  inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fim TIMESTAMP WITH TIME ZONE NOT NULL,
  capacidade_total INTEGER NOT NULL DEFAULT 1,
  capacidade_ocupada INTEGER NOT NULL DEFAULT 0,
  predecessor_id UUID REFERENCES public.gantt_ciclos(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  atraso_minutos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de peças por ciclo
CREATE TABLE public.gantt_ciclo_pecas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ciclo_id UUID REFERENCES public.gantt_ciclos(id) ON DELETE CASCADE NOT NULL,
  production_item_id UUID REFERENCES public.production_items(id) ON DELETE CASCADE NOT NULL,
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  inicio_previsto TIMESTAMP WITH TIME ZONE NOT NULL,
  fim_previsto TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  atraso_minutos INTEGER NOT NULL DEFAULT 0,
  ordem_no_ciclo INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna disponivel na tabela formas
ALTER TABLE public.formas ADD COLUMN disponivel BOOLEAN NOT NULL DEFAULT true;

-- RLS público
ALTER TABLE public.gantt_ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gantt_ciclo_pecas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to gantt_ciclos" ON public.gantt_ciclos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to gantt_ciclo_pecas" ON public.gantt_ciclo_pecas FOR ALL USING (true) WITH CHECK (true);

-- Triggers updated_at
CREATE TRIGGER update_gantt_ciclos_updated_at BEFORE UPDATE ON public.gantt_ciclos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_gantt_ciclo_pecas_updated_at BEFORE UPDATE ON public.gantt_ciclo_pecas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_gantt_ciclos_forma_id ON public.gantt_ciclos(forma_id);
CREATE INDEX idx_gantt_ciclos_predecessor ON public.gantt_ciclos(predecessor_id);
CREATE INDEX idx_gantt_ciclo_pecas_ciclo_id ON public.gantt_ciclo_pecas(ciclo_id);
CREATE INDEX idx_gantt_ciclo_pecas_production_item ON public.gantt_ciclo_pecas(production_item_id);
