// ========================================
// Zustand Store — Simulation State
// ========================================

import { create } from 'zustand';
import type { DINComponent, ComponentState, ComponentType } from '../types/types';
import { COMPONENT_INFO } from '../types/types';
import {
  calculateComponentCurrent,
  getComponentVoltage,
  selectCableSize,
  calculateVoltageDrop,
  getVoltageDropColor,
} from '../engine/nbr5410-engine';

let nextId = 1;
function generateId(): string {
  return `comp_${nextId++}`;
}

let nextFeedbackId = 1;

interface InteractionFeedback {
  id: number;
  tone: 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface SimulationStore {
  // State
  components: DINComponent[];
  selectedComponentId: string | null;
  mainBreakerOn: boolean;
  uiFeedback: InteractionFeedback | null;
  
  // Derived calculations
  totalPowerW: number;
  totalCurrentA: number;

  // Actions
  addComponent: (type: ComponentType, loadWatts?: number) => void;
  removeComponent: (id: string) => void;
  toggleComponent: (id: string) => void;
  tripComponent: (id: string) => void;
  resetComponent: (id: string) => void;
  testIDR: (id: string) => void;
  toggleMainBreaker: () => void;
  selectComponent: (id: string | null) => void;
  updateComponentLoad: (id: string, loadWatts: number) => void;
  updateComponentRating: (id: string, rating: number) => void;
  moveComponent: (fromIndex: number, toIndex: number) => void;
  pushFeedback: (feedback: Omit<InteractionFeedback, 'id'>) => void;
  clearFeedback: () => void;
  
  // Queries
  isEnergized: (id: string) => boolean;
  getComponentById: (id: string) => DINComponent | undefined;
  getDesignInfo: (id: string) => {
    designCurrent: number;
    cableSizeMm2: number;
    voltageDrop: number;
    voltageDropColor: 'green' | 'yellow' | 'red';
  } | null;
}

function recalcTotals(components: DINComponent[], mainBreakerOn: boolean) {
  let totalPowerW = 0;
  let totalCurrentA = 0;

  if (mainBreakerOn) {
    for (const comp of components) {
      if (comp.state === 'ON' && comp.type !== 'mainBreaker') {
        totalPowerW += comp.loadWatts;
        totalCurrentA += calculateComponentCurrent(comp.loadWatts, comp.poles);
      }
    }
  }

  return {
    totalPowerW: Math.round(totalPowerW),
    totalCurrentA: Math.round(totalCurrentA * 100) / 100,
  };
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  components: [],
  selectedComponentId: null,
  mainBreakerOn: false,
  totalPowerW: 0,
  totalCurrentA: 0,
  uiFeedback: null,

  pushFeedback: (feedback) => {
    set({
      uiFeedback: {
        ...feedback,
        id: nextFeedbackId++,
      },
    });
  },

  clearFeedback: () => {
    set({ uiFeedback: null });
  },

  addComponent: (type: ComponentType, loadWatts?: number) => {
    const info = COMPONENT_INFO[type];
    const nextPos = get().components.length;
    
    const defaultLoads: Partial<Record<ComponentType, number>> = {
      breaker1P: 1500,
      breaker2P: 4400,
      breaker3P: 7500,
      contactor: 5000,
    };

    const newComp: DINComponent = {
      id: generateId(),
      type,
      label: info.label,
      state: 'OFF' as ComponentState,
      rating: info.defaultRating,
      poles: info.defaultPoles,
      dinModules: info.dinModules,
      position: nextPos,
      loadWatts: loadWatts ?? defaultLoads[type] ?? 0,
      upstreamId: null,
      ...(type === 'idr' ? { sensitivity: 30 } : {}),
      ...(type === 'contactor' ? { coilVoltage: 220 } : {}),
      ...(type === 'dps' ? { dpsClass: 'II' as const } : {}),
    };

    set((state) => {
      const components = [...state.components, newComp];
      const totals = recalcTotals(components, state.mainBreakerOn);
      return { components, ...totals };
    });
  },

  removeComponent: (id: string) => {
    set((state) => {
      const components = state.components.filter(c => c.id !== id);
      const totals = recalcTotals(components, state.mainBreakerOn);
      return {
        components,
        ...totals,
        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
      };
    });
  },

  toggleComponent: (id: string) => {
    const state = get();
    const comp = state.components.find(c => c.id === id);
    if (!comp) return;

    // Interlocking: contactor cannot turn ON if main breaker is OFF
    if (comp.type === 'contactor' && !state.mainBreakerOn) {
      state.pushFeedback({
        tone: 'warning',
        title: 'Contator bloqueado',
        message: 'Energize o disjuntor geral antes de acionar o contator.',
      });
      return;
    }
    
    // Cannot toggle a tripped component - must reset first
    if (comp.state === 'TRIPPED') {
      state.pushFeedback({
        tone: 'warning',
        title: 'Modulo desarmado',
        message: 'Rearme o componente antes de tentar ligar novamente.',
      });
      return;
    }

    // Check if upstream IDR is tripped
    if (comp.type !== 'idr' && comp.type !== 'mainBreaker' && comp.type !== 'dps') {
      const idrComp = state.components.find(c => c.type === 'idr');
      if (idrComp && idrComp.state === 'TRIPPED') {
        state.pushFeedback({
          tone: 'warning',
          title: 'Circuito bloqueado',
          message: 'O IDR esta desarmado. Rearme o IDR para religar os componentes a jusante.',
        });
        return;
      }
    }

    const newState: ComponentState = comp.state === 'ON' ? 'OFF' : 'ON';

    set((s) => {
      const components = s.components.map(c =>
        c.id === id ? { ...c, state: newState } : c
      );
      const totals = recalcTotals(components, s.mainBreakerOn);
      return { components, ...totals };
    });
  },

  tripComponent: (id: string) => {
    set((state) => {
      const components = state.components.map(c =>
        c.id === id ? { ...c, state: 'TRIPPED' as ComponentState } : c
      );
      const totals = recalcTotals(components, state.mainBreakerOn);
      return { components, ...totals };
    });
  },

  resetComponent: (id: string) => {
    set((state) => {
      const components = state.components.map(c =>
        c.id === id ? { ...c, state: 'OFF' as ComponentState } : c
      );
      const totals = recalcTotals(components, state.mainBreakerOn);
      return { components, ...totals };
    });
  },

  testIDR: (id: string) => {
    set((state) => {
      // Trip the IDR and all downstream components
      const components = state.components.map(c => {
        if (c.id === id) {
          return { ...c, state: 'TRIPPED' as ComponentState };
        }
        // Trip all non-main-breaker, non-dps components (they're downstream of IDR)
        if (c.type !== 'mainBreaker' && c.type !== 'dps' && c.type !== 'idr') {
          return { ...c, state: 'TRIPPED' as ComponentState };
        }
        return c;
      });
      const totals = recalcTotals(components, state.mainBreakerOn);
      return { components, ...totals };
    });

    get().pushFeedback({
      tone: 'info',
      title: 'Teste de IDR executado',
      message: 'O IDR e os componentes a jusante foram desarmados para simular o teste.',
    });
  },

  toggleMainBreaker: () => {
    set((state) => {
      const newMainState = !state.mainBreakerOn;

      let components = state.components;
      if (!newMainState) {
        // Turn OFF all components when main breaker goes OFF
        components = components.map(c => ({
          ...c,
          state: 'OFF' as ComponentState,
        }));
      }

      const totals = recalcTotals(components, newMainState);
      return { components, mainBreakerOn: newMainState, ...totals };
    });
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponentId: id });
  },

  updateComponentLoad: (id: string, loadWatts: number) => {
    set((state) => {
      const components = state.components.map(c =>
        c.id === id ? { ...c, loadWatts } : c
      );
      const totals = recalcTotals(components, state.mainBreakerOn);
      return { components, ...totals };
    });

    // Overload simulation: auto-trip after 2s if current > rating
    const comp = get().components.find(c => c.id === id);
    if (comp && comp.state === 'ON' && comp.loadWatts > 0) {
      const current = calculateComponentCurrent(comp.loadWatts, comp.poles);
      if (current > comp.rating) {
        setTimeout(() => {
          const latest = get().components.find(c => c.id === id);
          if (latest && latest.state === 'ON') {
            get().tripComponent(id);
            get().pushFeedback({
              tone: 'error',
              title: 'Sobrecarga detectada',
              message: `${latest.label} excedeu ${latest.rating}A e foi desligado automaticamente.`,
            });
          }
        }, 2000);
      }
    }
  },

  updateComponentRating: (id: string, rating: number) => {
    set((state) => {
      const components = state.components.map(c =>
        c.id === id ? { ...c, rating } : c
      );
      return { components };
    });
  },

  moveComponent: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const components = [...state.components];
      if (fromIndex < 0 || fromIndex >= components.length) return state;
      if (toIndex < 0 || toIndex >= components.length) return state;
      const [moved] = components.splice(fromIndex, 1);
      components.splice(toIndex, 0, moved);
      // Update positions
      const updated = components.map((c, i) => ({ ...c, position: i }));
      return { components: updated };
    });
  },

  isEnergized: (id: string) => {
    const state = get();
    if (!state.mainBreakerOn) return false;
    const comp = state.components.find(c => c.id === id);
    if (!comp) return false;
    if (comp.state !== 'ON') return false;

    // Check if any IDR is tripped (blocks downstream)
    const idr = state.components.find(c => c.type === 'idr');
    if (idr && idr.state === 'TRIPPED' && comp.type !== 'mainBreaker' && comp.type !== 'dps') {
      return false;
    }

    return true;
  },

  getComponentById: (id: string) => {
    return get().components.find(c => c.id === id);
  },

  getDesignInfo: (id: string) => {
    const comp = get().components.find(c => c.id === id);
    if (!comp || comp.loadWatts === 0) return null;

    const voltage = getComponentVoltage(comp.poles);
    const designCurrent = calculateComponentCurrent(comp.loadWatts, comp.poles);
    const cableSizeMm2 = selectCableSize(designCurrent, comp.poles >= 3 ? 3 : 2);
    const voltageDrop = calculateVoltageDrop(designCurrent, 15, cableSizeMm2, voltage);
    const voltageDropColor = getVoltageDropColor(voltageDrop);

    return {
      designCurrent: Math.round(designCurrent * 100) / 100,
      cableSizeMm2,
      voltageDrop,
      voltageDropColor,
    };
  },
}));
