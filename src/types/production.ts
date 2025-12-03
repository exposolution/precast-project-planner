export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Obra {
  id: string;
  name: string;
  code: string;
  priority: Priority;
  deadline: Date;
  location: string;
  status: 'active' | 'paused' | 'completed';
}

export interface Forma {
  id: string;
  name: string;
  code: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  capacity: number; // peças por dia
  status: 'available' | 'in-use' | 'maintenance';
}

export interface ProductionItem {
  id: string;
  obraId: string;
  formaId: string;
  quantity: number;
  produced: number;
  startDate: Date;
  endDate: Date;
  priority: Priority;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  notes?: string;
}

export interface ProductionQueue {
  items: ProductionItem[];
  lastUpdated: Date;
}
