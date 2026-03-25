// ========================================
// Simulation Store — Unit Tests
// ========================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from './simulation-store';

// Reset store before each test
beforeEach(() => {
  useSimulationStore.setState({
    components: [],
    selectedComponentId: null,
    mainBreakerOn: false,
    totalPowerW: 0,
    totalCurrentA: 0,
    uiFeedback: null,
  });
});

describe('addComponent', () => {
  it('adds a breaker1P with default values', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    
    const { components } = useSimulationStore.getState();
    expect(components).toHaveLength(1);
    expect(components[0].type).toBe('breaker1P');
    expect(components[0].rating).toBe(20);
    expect(components[0].loadWatts).toBe(1500);
    expect(components[0].state).toBe('OFF');
  });

  it('adds an IDR with sensitivity', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('idr');
    
    const { components } = useSimulationStore.getState();
    expect(components[0].type).toBe('idr');
    expect(components[0].sensitivity).toBe(30);
  });

  it('adds a DPS with dpsClass', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('dps');
    
    const { components } = useSimulationStore.getState();
    expect(components[0].type).toBe('dps');
    expect(components[0].dpsClass).toBe('II');
  });

  it('assigns sequential positions', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    addComponent('idr');
    addComponent('dps');
    
    const { components } = useSimulationStore.getState();
    expect(components[0].position).toBe(0);
    expect(components[1].position).toBe(1);
    expect(components[2].position).toBe(2);
  });
});

describe('removeComponent', () => {
  it('removes a component by id', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    addComponent('idr');
    
    const { components } = useSimulationStore.getState();
    const idToRemove = components[0].id;
    
    useSimulationStore.getState().removeComponent(idToRemove);
    
    const updated = useSimulationStore.getState().components;
    expect(updated).toHaveLength(1);
    expect(updated[0].type).toBe('idr');
  });

  it('clears selection if removed component was selected', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    
    const { components, selectComponent } = useSimulationStore.getState();
    selectComponent(components[0].id);
    
    expect(useSimulationStore.getState().selectedComponentId).toBe(components[0].id);
    
    useSimulationStore.getState().removeComponent(components[0].id);
    
    expect(useSimulationStore.getState().selectedComponentId).toBeNull();
  });
});

describe('toggleComponent', () => {
  it('toggles a breaker from OFF to ON', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    
    const { components, toggleComponent } = useSimulationStore.getState();
    toggleComponent(components[0].id);
    
    expect(useSimulationStore.getState().components[0].state).toBe('ON');
  });

  it('toggles a breaker from ON to OFF', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    
    const comp = useSimulationStore.getState().components[0];
    useSimulationStore.getState().toggleComponent(comp.id);
    expect(useSimulationStore.getState().components[0].state).toBe('ON');
    
    useSimulationStore.getState().toggleComponent(comp.id);
    expect(useSimulationStore.getState().components[0].state).toBe('OFF');
  });

  it('cannot toggle a TRIPPED component', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    
    const comp = useSimulationStore.getState().components[0];
    useSimulationStore.getState().tripComponent(comp.id);
    expect(useSimulationStore.getState().components[0].state).toBe('TRIPPED');
    
    useSimulationStore.getState().toggleComponent(comp.id);
    expect(useSimulationStore.getState().components[0].state).toBe('TRIPPED');
  });
});

describe('toggleMainBreaker', () => {
  it('toggles main breaker ON', () => {
    useSimulationStore.getState().toggleMainBreaker();
    expect(useSimulationStore.getState().mainBreakerOn).toBe(true);
  });

  it('turns OFF all components when main breaker goes OFF', () => {
    const { addComponent, toggleMainBreaker } = useSimulationStore.getState();
    addComponent('breaker1P');
    
    toggleMainBreaker(); // ON
    useSimulationStore.getState().toggleComponent(
      useSimulationStore.getState().components[0].id
    );
    
    expect(useSimulationStore.getState().components[0].state).toBe('ON');
    
    useSimulationStore.getState().toggleMainBreaker(); // OFF
    
    expect(useSimulationStore.getState().components[0].state).toBe('OFF');
    expect(useSimulationStore.getState().mainBreakerOn).toBe(false);
  });

  it('recalculates totals when main breaker toggles', () => {
    const { addComponent, toggleMainBreaker } = useSimulationStore.getState();
    addComponent('breaker1P');
    
    toggleMainBreaker(); // ON
    useSimulationStore.getState().toggleComponent(
      useSimulationStore.getState().components[0].id
    );
    
    expect(useSimulationStore.getState().totalPowerW).toBe(1500);
    
    useSimulationStore.getState().toggleMainBreaker(); // OFF
    expect(useSimulationStore.getState().totalPowerW).toBe(0);
  });
});

describe('current calculations by circuit type', () => {
  it('uses 220V for a 2P breaker total current', () => {
    const store = useSimulationStore.getState();
    store.addComponent('breaker2P');
    store.toggleMainBreaker();

    const breaker = useSimulationStore.getState().components[0];
    useSimulationStore.getState().toggleComponent(breaker.id);

    expect(useSimulationStore.getState().totalCurrentA).toBeCloseTo(21.74, 2);
  });

  it('uses three-phase current for a 3P breaker total current', () => {
    const store = useSimulationStore.getState();
    store.addComponent('breaker3P');
    store.toggleMainBreaker();

    const breaker = useSimulationStore.getState().components[0];
    useSimulationStore.getState().toggleComponent(breaker.id);

    expect(useSimulationStore.getState().totalCurrentA).toBeCloseTo(21.39, 2);
  });
});

describe('testIDR', () => {
  it('trips the IDR and downstream components', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('idr');
    addComponent('breaker1P');
    
    const store = useSimulationStore.getState();
    const idr = store.components.find(c => c.type === 'idr')!;
    
    // Turn on main and components
    store.toggleMainBreaker();
    useSimulationStore.getState().toggleComponent(idr.id);
    useSimulationStore.getState().toggleComponent(
      useSimulationStore.getState().components.find(c => c.type === 'breaker1P')!.id
    );
    
    // Test IDR
    useSimulationStore.getState().testIDR(idr.id);
    
    const updated = useSimulationStore.getState().components;
    expect(updated.find(c => c.type === 'idr')!.state).toBe('TRIPPED');
    expect(updated.find(c => c.type === 'breaker1P')!.state).toBe('TRIPPED');
  });
});

describe('contactor interlock', () => {
  it('cannot turn ON contactor when main breaker is OFF', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('contactor');
    
    const store = useSimulationStore.getState();
    const contactor = store.components[0];
    
    store.toggleComponent(contactor.id);
    
    expect(useSimulationStore.getState().components[0].state).toBe('OFF');
    expect(useSimulationStore.getState().uiFeedback?.title).toBe('Contator bloqueado');
  });

  it('can turn ON contactor when main breaker is ON', () => {
    const { addComponent, toggleMainBreaker } = useSimulationStore.getState();
    addComponent('contactor');
    toggleMainBreaker();
    
    const store = useSimulationStore.getState();
    store.toggleComponent(store.components[0].id);
    
    expect(useSimulationStore.getState().components[0].state).toBe('ON');
  });
});

describe('interaction feedback', () => {
  it('shows feedback when trying to toggle a tripped component', () => {
    const store = useSimulationStore.getState();
    store.addComponent('breaker1P');

    const breaker = useSimulationStore.getState().components[0];
    useSimulationStore.getState().tripComponent(breaker.id);
    useSimulationStore.getState().toggleComponent(breaker.id);

    expect(useSimulationStore.getState().uiFeedback?.title).toBe('Modulo desarmado');
  });

  it('shows feedback when an IDR blocks downstream components', () => {
    const store = useSimulationStore.getState();
    store.addComponent('idr');
    store.addComponent('breaker1P');
    store.toggleMainBreaker();

    const idr = useSimulationStore.getState().components.find((component) => component.type === 'idr')!;
    const breaker = useSimulationStore.getState().components.find((component) => component.type === 'breaker1P')!;

    useSimulationStore.getState().toggleComponent(idr.id);
    useSimulationStore.getState().testIDR(idr.id);
    useSimulationStore.getState().resetComponent(breaker.id);
    useSimulationStore.getState().toggleComponent(breaker.id);

    expect(useSimulationStore.getState().uiFeedback?.title).toBe('Circuito bloqueado');
  });
});

describe('moveComponent', () => {
  it('reorders components correctly', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    addComponent('idr');
    addComponent('dps');
    
    useSimulationStore.getState().moveComponent(0, 2);
    
    const { components } = useSimulationStore.getState();
    expect(components[0].type).toBe('idr');
    expect(components[1].type).toBe('dps');
    expect(components[2].type).toBe('breaker1P');
    // Positions updated
    expect(components[0].position).toBe(0);
    expect(components[1].position).toBe(1);
    expect(components[2].position).toBe(2);
  });

  it('handles invalid indices gracefully', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P');
    
    useSimulationStore.getState().moveComponent(-1, 0);
    expect(useSimulationStore.getState().components).toHaveLength(1);
    
    useSimulationStore.getState().moveComponent(0, 5);
    expect(useSimulationStore.getState().components).toHaveLength(1);
  });
});

describe('getDesignInfo', () => {
  it('returns design info for a component with load', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('breaker1P', 1500);
    
    const comp = useSimulationStore.getState().components[0];
    const info = useSimulationStore.getState().getDesignInfo(comp.id);
    
    expect(info).not.toBeNull();
    expect(info!.designCurrent).toBeGreaterThan(0);
    expect(info!.cableSizeMm2).toBeGreaterThan(0);
    expect(info!.voltageDrop).toBeGreaterThanOrEqual(0);
    expect(['green', 'yellow', 'red']).toContain(info!.voltageDropColor);
  });

  it('returns null for zero-load component', () => {
    const { addComponent } = useSimulationStore.getState();
    addComponent('dps');
    
    const comp = useSimulationStore.getState().components[0];
    const info = useSimulationStore.getState().getDesignInfo(comp.id);
    
    expect(info).toBeNull();
  });
});
