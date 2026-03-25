// ========================================
// NBR 5410 Engine — Unit Tests
// ========================================

import { describe, it, expect } from 'vitest';
import {
  calculateDesignCurrent,
  calculateDesignCurrent3P,
  selectCableSize,
  selectBreaker,
  calculateVoltageDrop,
  getVoltageDropColor,
  checkCableBreakerCoordination,
  suggestDimensioning,
  getCableCapacity,
} from './nbr5410-engine';

describe('calculateDesignCurrent', () => {
  it('calculates single-phase current for 1500W @127V', () => {
    const ib = calculateDesignCurrent(1500, 127, 0.92);
    // 1500 / (127 × 0.92) ≈ 12.84A
    expect(ib).toBeCloseTo(12.84, 1);
  });

  it('calculates current for 4400W @220V', () => {
    const ib = calculateDesignCurrent(4400, 220, 0.92);
    // 4400 / (220 × 0.92) ≈ 21.74A
    expect(ib).toBeCloseTo(21.74, 1);
  });

  it('returns 0 if voltage is 0', () => {
    expect(calculateDesignCurrent(1500, 0)).toBe(0);
  });

  it('returns 0 if power factor is 0', () => {
    expect(calculateDesignCurrent(1500, 127, 0)).toBe(0);
  });

  it('uses default voltage 127V and pf 0.92', () => {
    const ib = calculateDesignCurrent(1000);
    expect(ib).toBeCloseTo(1000 / (127 * 0.92), 2);
  });
});

describe('calculateDesignCurrent3P', () => {
  it('calculates three-phase current for 7500W @220V', () => {
    const ib = calculateDesignCurrent3P(7500, 220, 0.92);
    // 7500 / (√3 × 220 × 0.92) ≈ 21.39A
    expect(ib).toBeCloseTo(21.39, 1);
  });
});

describe('selectCableSize', () => {
  it('selects 1.5mm² for 12.84A (2 conductors)', () => {
    const cable = selectCableSize(12.84);
    expect(cable).toBe(1.5); // maxCurrent2Loaded = 17.5A
  });

  it('selects 2.5mm² for 18A (2 conductors)', () => {
    const cable = selectCableSize(18);
    expect(cable).toBe(2.5); // 17.5 < 18 ≤ 24
  });

  it('selects 4mm² for 25A (2 conductors)', () => {
    const cable = selectCableSize(25);
    expect(cable).toBe(4); // 24 < 25 ≤ 32
  });

  it('selects correct cable for 3 loaded conductors', () => {
    const cable = selectCableSize(16, 3);
    expect(cable).toBe(2.5); // 15.5 < 16 ≤ 21
  });

  it('applies grouping factor', () => {
    // 20A with grouping factor 0.7 → corrected = 28.57A
    const cable = selectCableSize(20, 2, 0.7);
    expect(cable).toBe(4); // 24 < 28.57 ≤ 32
  });

  it('returns largest cable when current exceeds table', () => {
    const cable = selectCableSize(500);
    expect(cable).toBe(120);
  });
});

describe('selectBreaker', () => {
  it('selects 16A breaker for 12.84A design current', () => {
    expect(selectBreaker(12.84)).toBe(16);
  });

  it('selects 25A breaker for 21A design current', () => {
    expect(selectBreaker(21)).toBe(25);
  });

  it('selects exact rating when current matches', () => {
    expect(selectBreaker(20)).toBe(20);
  });

  it('selects 6A for very small loads', () => {
    expect(selectBreaker(3)).toBe(6);
  });
});

describe('calculateVoltageDrop', () => {
  it('calculates voltage drop for a known circuit', () => {
    // 12.84A, 15m, 1.5mm², 127V
    // ΔV% = (2 × 0.0214 × 15 × 12.84) / (1.5 × 127) × 100
    const drop = calculateVoltageDrop(12.84, 15, 1.5, 127);
    expect(drop).toBeGreaterThan(0);
    expect(drop).toBeLessThan(10);
  });

  it('returns 0 for zero cable size', () => {
    expect(calculateVoltageDrop(10, 15, 0, 127)).toBe(0);
  });

  it('returns 0 for zero voltage', () => {
    expect(calculateVoltageDrop(10, 15, 2.5, 0)).toBe(0);
  });

  it('increases with longer cables', () => {
    const short = calculateVoltageDrop(10, 5, 2.5, 127);
    const long = calculateVoltageDrop(10, 30, 2.5, 127);
    expect(long).toBeGreaterThan(short);
  });

  it('decreases with larger cable cross-section', () => {
    const thin = calculateVoltageDrop(10, 15, 1.5, 127);
    const thick = calculateVoltageDrop(10, 15, 10, 127);
    expect(thick).toBeLessThan(thin);
  });
});

describe('getVoltageDropColor', () => {
  it('returns green for ≤2%', () => {
    expect(getVoltageDropColor(0)).toBe('green');
    expect(getVoltageDropColor(1.5)).toBe('green');
    expect(getVoltageDropColor(2)).toBe('green');
  });

  it('returns yellow for 2-4%', () => {
    expect(getVoltageDropColor(2.5)).toBe('yellow');
    expect(getVoltageDropColor(4)).toBe('yellow');
  });

  it('returns red for >4%', () => {
    expect(getVoltageDropColor(4.1)).toBe('red');
    expect(getVoltageDropColor(10)).toBe('red');
  });
});

describe('checkCableBreakerCoordination', () => {
  it('passes coordination: 16A breaker with 1.5mm² cable', () => {
    expect(checkCableBreakerCoordination(16, 1.5)).toBe(true);
  });

  it('fails coordination: 25A breaker with 1.5mm² cable', () => {
    expect(checkCableBreakerCoordination(25, 1.5)).toBe(false);
  });

  it('returns false for unknown cable size', () => {
    expect(checkCableBreakerCoordination(16, 999)).toBe(false);
  });
});

describe('getCableCapacity', () => {
  it('returns correct capacity for 2.5mm²', () => {
    const cap = getCableCapacity(2.5);
    expect(cap).toBe(24);
  });

  it('applies grouping factor', () => {
    const cap = getCableCapacity(2.5, 2, 0.7);
    expect(cap).toBeCloseTo(16.8, 1);
  });

  it('returns 0 for unknown cable', () => {
    expect(getCableCapacity(999)).toBe(0);
  });
});

describe('suggestDimensioning', () => {
  it('provides complete dimensioning for 1500W load', () => {
    const result = suggestDimensioning(1500, 127, 0.92, 15);
    expect(result.designCurrent).toBeCloseTo(12.84, 1);
    expect(result.breakerRating).toBe(16);
    expect(result.cableSizeMm2).toBe(1.5);
    expect(result.voltageDrop).toBeGreaterThan(0);
    // ~4.33% drop through 1.5mm² at 15m → red
    expect(result.voltageDropColor).toBe('red');
    expect(result.isCoordinated).toBe(true);
  });

  it('flags coordination issue for heavy load with small cable', () => {
    const result = suggestDimensioning(10000, 127, 0.92, 15);
    expect(result.breakerRating).toBeGreaterThan(0);
    expect(result.cableSizeMm2).toBeGreaterThan(0);
  });
});
