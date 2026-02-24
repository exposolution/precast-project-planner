
-- Tabela de obras
CREATE TABLE public.obras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  urgencia TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de formas
CREATE TABLE public.formas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  length_cm NUMERIC NOT NULL DEFAULT 0,
  width_cm NUMERIC NOT NULL DEFAULT 0,
  height_cm NUMERIC NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available',
  setup_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de produção
CREATE TABLE public.production_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  forma_id UUID REFERENCES public.formas(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  produced INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  piece_height NUMERIC NOT NULL DEFAULT 0,
  piece_width NUMERIC NOT NULL DEFAULT 0,
  piece_length NUMERIC NOT NULL DEFAULT 0,
  unit_production_time_minutes NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de lotes Gantt
CREATE TABLE public.gantt_lotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  forma_id UUID REFERENCES public.formas(id) ON DELETE CASCADE NOT NULL,
  grupo_altura_cm NUMERIC NOT NULL DEFAULT 0,
  grupo_base_cm NUMERIC NOT NULL DEFAULT 0,
  quantidade INTEGER NOT NULL DEFAULT 0,
  tempo_producao_min NUMERIC NOT NULL DEFAULT 0,
  setup_aplicado BOOLEAN NOT NULL DEFAULT false,
  setup_minutos NUMERIC NOT NULL DEFAULT 0,
  inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fim TIMESTAMP WITH TIME ZONE NOT NULL,
  ordem_fila INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies (acesso público, sem login)
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gantt_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to obras" ON public.obras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to formas" ON public.formas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to production_items" ON public.production_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to gantt_lotes" ON public.gantt_lotes FOR ALL USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_formas_updated_at BEFORE UPDATE ON public.formas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_production_items_updated_at BEFORE UPDATE ON public.production_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
