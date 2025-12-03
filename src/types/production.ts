export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Obra {
  id: string;
  name: string;
  code: string;
  priority: Priority;
  deadline: Date;
  location: string;
  status: 'active' | 'paused' | 'completed';
  urgencia: 'passa_frente' | 'normal' | 'vai_fim_fila' | `atrás_de_forma:${string}`; // New field for scheduling
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
  setup_minutes: number; // Added for scheduling
}

export interface ProductionItem {
  id: string;
  obraId: string;
  formaId: string; // This will be the initially assigned forma, the scheduler might re-evaluate
  quantity: number;
  produced: number;
  startDate: Date;
  endDate: Date;
  priority: Priority;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  notes?: string;
  // New fields for piece dimensions and production time, required by the scheduler
  pieceHeight: number;
  pieceWidth: number;
  pieceLength: number;
  unitProductionTimeMinutes: number;
}

export interface ProductionQueue {
  items: ProductionItem[];
  lastUpdated: Date;
}

// New type for the output of the scheduling algorithm
export interface ScheduledLote {
  id: string;
  obraId: string;
  grupoChave: [number, number]; // [pieceHeight, pieceWidth]
  formaId: string;
  quantity: number;
  totalTimeMinutes: number;
  setupApplied: boolean;
  start: Date;
  end: Date;
}