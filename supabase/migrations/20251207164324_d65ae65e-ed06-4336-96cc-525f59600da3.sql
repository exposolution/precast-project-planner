-- Table for production cycles (24h each) per forma with FS dependencies
CREATE TABLE public.gantt_ciclos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forma_id UUID NOT NULL REFERENCES public.formas(id) ON DELETE CASCADE,
  ciclo_numero INTEGER NOT NULL DEFAULT 1,
  inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fim TIMESTAMP WITH TIME ZONE NOT NULL,
  capacidade_total INTEGER NOT NULL,
  capacidade_ocupada INTEGER NOT NULL DEFAULT 0,
  predecessor_id UUID REFERENCES public.gantt_ciclos(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'delayed')),
  atraso_minutos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(forma_id, ciclo_numero)
);

-- Table for pieces allocated to cycles
CREATE TABLE public.gantt_ciclo_pecas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ciclo_id UUID NOT NULL REFERENCES public.gantt_ciclos(id) ON DELETE CASCADE,
  production_item_id UUID NOT NULL REFERENCES public.production_items(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  inicio_previsto TIMESTAMP WITH TIME ZONE NOT NULL,
  fim_previsto TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'delayed')),
  atraso_minutos INTEGER NOT NULL DEFAULT 0,
  ordem_no_ciclo INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gantt_ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gantt_ciclo_pecas ENABLE ROW LEVEL SECURITY;

-- RLS policies for gantt_ciclos
CREATE POLICY "Allow public read access on gantt_ciclos" ON public.gantt_ciclos FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on gantt_ciclos" ON public.gantt_ciclos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on gantt_ciclos" ON public.gantt_ciclos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on gantt_ciclos" ON public.gantt_ciclos FOR DELETE USING (true);

-- RLS policies for gantt_ciclo_pecas
CREATE POLICY "Allow public read access on gantt_ciclo_pecas" ON public.gantt_ciclo_pecas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on gantt_ciclo_pecas" ON public.gantt_ciclo_pecas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on gantt_ciclo_pecas" ON public.gantt_ciclo_pecas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on gantt_ciclo_pecas" ON public.gantt_ciclo_pecas FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_gantt_ciclos_updated_at
  BEFORE UPDATE ON public.gantt_ciclos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gantt_ciclo_pecas_updated_at
  BEFORE UPDATE ON public.gantt_ciclo_pecas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_gantt_ciclos_forma_id ON public.gantt_ciclos(forma_id);
CREATE INDEX idx_gantt_ciclos_inicio ON public.gantt_ciclos(inicio);
CREATE INDEX idx_gantt_ciclo_pecas_ciclo_id ON public.gantt_ciclo_pecas(ciclo_id);
CREATE INDEX idx_gantt_ciclo_pecas_production_item_id ON public.gantt_ciclo_pecas(production_item_id);