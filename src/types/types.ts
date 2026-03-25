// ========================
// QDC Master - Core Types
// ========================

export type ComponentState = 'ON' | 'OFF' | 'TRIPPED';

export type ComponentType =
  | 'mainBreaker'
  | 'breaker1P'
  | 'breaker2P'
  | 'breaker3P'
  | 'contactor'
  | 'idr'
  | 'dps';

export type WireColor = 'neutral' | 'ground' | 'phaseR' | 'phaseS' | 'phaseT';

export interface DINComponent {
  id: string;
  type: ComponentType;
  label: string;
  state: ComponentState;
  rating: number;           // Corrente nominal (A)
  poles: number;             // 1, 2, 3, or 4 poles
  dinModules: number;        // Módulos DIN ocupados
  position: number;          // Posição no trilho (slot index)
  loadWatts: number;         // Carga conectada (W)
  upstreamId: string | null; // Componente upstream (hierarquia)
  
  // IDR specific
  sensitivity?: number;     // mA (30, 100, 300)

  // Contactor specific
  coilVoltage?: number;     // Tensão da bobina (V)

  // DPS specific  
  dpsClass?: 'I' | 'II' | 'III';
}

export interface Circuit {
  id: string;
  name: string;
  breakerId: string;
  loadWatts: number;
  voltage: number;
  powerFactor: number;
  cableLength: number;       // metros
  designCurrent: number;     // Ib (A) calculada
  cableSizeMm2: number;      // mm² recomendada
  voltageDrop: number;       // % queda de tensão
}

export interface Wire {
  id: string;
  fromId: string;
  toId: string;
  color: WireColor;
  energized: boolean;
  current: number;           // Corrente fluindo (A)
}

// NBR 5410 Cable table entry
export interface CableTableEntry {
  crossSection: number;      // mm²
  maxCurrent2Loaded: number; // Capacidade com 2 condutores carregados
  maxCurrent3Loaded: number; // Capacidade com 3 condutores carregados
}

// Standard breaker ratings
export const BREAKER_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100] as const;

// Component type display info
export const COMPONENT_INFO: Record<ComponentType, {
  label: string;
  shortLabel: string;
  defaultRating: number;
  defaultPoles: number;
  dinModules: number;
  color: string;
}> = {
  mainBreaker: {
    label: 'Disjuntor Geral',
    shortLabel: 'DG',
    defaultRating: 63,
    defaultPoles: 2,
    dinModules: 2,
    color: '#FF6B35',
  },
  breaker1P: {
    label: 'Disjuntor 1P',
    shortLabel: '1P',
    defaultRating: 20,
    defaultPoles: 1,
    dinModules: 1,
    color: '#00E676',
  },
  breaker2P: {
    label: 'Disjuntor 2P',
    shortLabel: '2P',
    defaultRating: 25,
    defaultPoles: 2,
    dinModules: 2,
    color: '#448AFF',
  },
  breaker3P: {
    label: 'Disjuntor 3P',
    shortLabel: '3P',
    defaultRating: 32,
    defaultPoles: 3,
    dinModules: 3,
    color: '#E040FB',
  },
  contactor: {
    label: 'Contator',
    shortLabel: 'CT',
    defaultRating: 25,
    defaultPoles: 3,
    dinModules: 3,
    color: '#FFD600',
  },
  idr: {
    label: 'IDR',
    shortLabel: 'IDR',
    defaultRating: 40,
    defaultPoles: 2,
    dinModules: 2,
    color: '#00BCD4',
  },
  dps: {
    label: 'DPS',
    shortLabel: 'DPS',
    defaultRating: 40,
    defaultPoles: 1,
    dinModules: 1,
    color: '#FF9100',
  },
};
