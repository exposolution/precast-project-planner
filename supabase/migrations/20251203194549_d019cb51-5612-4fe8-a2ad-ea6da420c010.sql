-- Create enum for priority
CREATE TYPE public.priority_level AS ENUM ('critical', 'high', 'medium', 'low');

-- Create enum for obra status
CREATE TYPE public.obra_status AS ENUM ('active', 'paused', 'completed');

-- Create enum for forma status
CREATE TYPE public.forma_status AS ENUM ('available', 'in-use', 'maintenance');

-- Create enum for production item status
CREATE TYPE public.production_item_status AS ENUM ('pending', 'in-progress', 'completed', 'delayed');

-- Create obras table
CREATE TABLE public.obras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  priority priority_level NOT NULL DEFAULT 'medium',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  status obra_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create formas table
CREATE TABLE public.formas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  length_cm NUMERIC NOT NULL,
  width_cm NUMERIC NOT NULL,
  height_cm NUMERIC NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  status forma_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create production_items table
CREATE TABLE public.production_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  forma_id UUID NOT NULL REFERENCES public.formas(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  produced INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  status production_item_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_items ENABLE ROW LEVEL SECURITY;

-- Create public read policies (for now, without auth)
CREATE POLICY "Allow public read access on obras" ON public.obras FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on obras" ON public.obras FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on obras" ON public.obras FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on obras" ON public.obras FOR DELETE USING (true);

CREATE POLICY "Allow public read access on formas" ON public.formas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on formas" ON public.formas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on formas" ON public.formas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on formas" ON public.formas FOR DELETE USING (true);

CREATE POLICY "Allow public read access on production_items" ON public.production_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on production_items" ON public.production_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on production_items" ON public.production_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on production_items" ON public.production_items FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON public.obras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formas_updated_at
  BEFORE UPDATE ON public.formas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_production_items_updated_at
  BEFORE UPDATE ON public.production_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();