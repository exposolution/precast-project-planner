export type Priority = 'critical' | 'high' | 'medium' | 'low';

// New type for urgency
export type Urgency = 'passa_frente' | 'normal' | 'vai_fim_fila' | `atras_de_forma:${string}`;

export interface Obra {
  id: string;
  name: string;
  code: string;
  priority: Priority;
  urgency: Urgency; // New field
  deadline: Date;
  location: string;
  status: 'active' | 'paused' | 'completed';
}

export interface Forma {
  id: string;
  name: string;
  code: string;
  dimensions: { // Updated to reflect max dimensions
    altura_max: number;
    base_max: number;
    comprimento_max: number;
  };
  capacity: number; // peças por dia
  setupMinutes: number; // New field
  status: 'available' | 'in-use' | 'maintenance';
}

export interface ProductionItem { // This represents a "peça" request
  id: string;
  obraId: string;
  formaId: string | null; // Forma might not be assigned yet
  quantity: number; // Total quantity of this specific piece type needed
  produced: number;
  startDate: Date;
  endDate: Date;
  priority: Priority;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  notes?: string;
  // New fields for piece dimensions and time
  altura: number;
  base: number;
  comprimento: number;
  tempoUnitarioMinutos: number;
}

// New type for a scheduled batch (lote)
export interface Lote {
  id: string; // Unique ID for the lote (can be generated)
  originalItemId: string; // Reference to the original ProductionItem
  obraId: string;
  formaId: string;
  altura: number;
  base: number;
  comprimento: number;
  quantity: number; // Quantity of pieces in this specific lote
  tempoUnitarioMinutos: number;
  startDate: Date;
  endDate: Date;
  setupApplied: boolean;
  priority: Priority; // Inherited from ProductionItem
  urgency: Urgency; // Inherited from Obra
  obraCode: string; // For display in Gantt
  formaCode: string; // For display in Gantt
}

export interface ProductionQueue {
  items: ProductionItem[];
  lastUpdated: Date;
}