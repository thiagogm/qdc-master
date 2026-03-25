// ========================================
// NBR 5410 Calculation Engine
// ========================================

import type { CableTableEntry } from '../types/types';
import { BREAKER_RATINGS } from '../types/types';

// Tabela de condutores de cobre — NBR 5410
// Método de referência B1 (condutos fechados)
// PVC 70°C, cobre
export const CABLE_TABLE: CableTableEntry[] = [
  { crossSection: 1.5,  maxCurrent2Loaded: 17.5, maxCurrent3Loaded: 15.5 },
  { crossSection: 2.5,  maxCurrent2Loaded: 24,   maxCurrent3Loaded: 21 },
  { crossSection: 4,    maxCurrent2Loaded: 32,   maxCurrent3Loaded: 28 },
  { crossSection: 6,    maxCurrent2Loaded: 41,   maxCurrent3Loaded: 36 },
  { crossSection: 10,   maxCurrent2Loaded: 57,   maxCurrent3Loaded: 50 },
  { crossSection: 16,   maxCurrent2Loaded: 76,   maxCurrent3Loaded: 68 },
  { crossSection: 25,   maxCurrent2Loaded: 101,  maxCurrent3Loaded: 89 },
  { crossSection: 35,   maxCurrent2Loaded: 125,  maxCurrent3Loaded: 110 },
  { crossSection: 50,   maxCurrent2Loaded: 151,  maxCurrent3Loaded: 134 },
  { crossSection: 70,   maxCurrent2Loaded: 192,  maxCurrent3Loaded: 171 },
  { crossSection: 95,   maxCurrent2Loaded: 232,  maxCurrent3Loaded: 207 },
  { crossSection: 120,  maxCurrent2Loaded: 269,  maxCurrent3Loaded: 239 },
];

// Resistividade do cobre (Ω·mm²/m) a 70°C
const COPPER_RESISTIVITY = 0.0214;

/**
 * Calcula a corrente de projeto (Ib) monofásica
 * Ib = P / (V × cos φ)
 */
export function calculateDesignCurrent(
  powerWatts: number,
  voltage: number = 127,
  powerFactor: number = 0.92
): number {
  if (voltage === 0 || powerFactor === 0) return 0;
  return powerWatts / (voltage * powerFactor);
}

/**
 * Calcula a corrente de projeto (Ib) trifásica
 * Ib = P / (√3 × V × cos φ)
 */
export function calculateDesignCurrent3P(
  powerWatts: number,
  voltage: number = 220,
  powerFactor: number = 0.92
): number {
  if (voltage === 0 || powerFactor === 0) return 0;
  return powerWatts / (Math.sqrt(3) * voltage * powerFactor);
}

export function getComponentVoltage(poles: number): 127 | 220 {
  return poles >= 2 ? 220 : 127;
}

export function calculateComponentCurrent(
  powerWatts: number,
  poles: number,
  powerFactor: number = 0.92
): number {
  const voltage = getComponentVoltage(poles);
  return poles >= 3
    ? calculateDesignCurrent3P(powerWatts, voltage, powerFactor)
    : calculateDesignCurrent(powerWatts, voltage, powerFactor);
}

/**
 * Seleciona a seção do cabo (mm²) baseado na corrente
 * Aplica fator de agrupamento
 */
export function selectCableSize(
  current: number,
  loadedConductors: 2 | 3 = 2,
  groupingFactor: number = 1.0
): number {
  const correctedCurrent = current / groupingFactor;
  
  for (const entry of CABLE_TABLE) {
    const maxCurrent = loadedConductors === 2
      ? entry.maxCurrent2Loaded
      : entry.maxCurrent3Loaded;
    
    if (maxCurrent >= correctedCurrent) {
      return entry.crossSection;
    }
  }
  
  // Se exceder a tabela, retorna a maior bitola disponível
  return CABLE_TABLE[CABLE_TABLE.length - 1].crossSection;
}

/**
 * Seleciona o disjuntor recomendado baseado na corrente de projeto
 * In >= Ib (corrente nominal >= corrente de projeto)
 */
export function selectBreaker(designCurrent: number): number {
  for (const rating of BREAKER_RATINGS) {
    if (rating >= designCurrent) {
      return rating;
    }
  }
  return BREAKER_RATINGS[BREAKER_RATINGS.length - 1];
}

/**
 * Verifica coordenação cabo × disjuntor
 * A corrente nominal do disjuntor deve ser <= capacidade do cabo
 */
export function checkCableBreakerCoordination(
  breakerRating: number,
  cableSizeMm2: number,
  loadedConductors: 2 | 3 = 2
): boolean {
  const cable = CABLE_TABLE.find(c => c.crossSection === cableSizeMm2);
  if (!cable) return false;
  
  const maxCurrent = loadedConductors === 2
    ? cable.maxCurrent2Loaded
    : cable.maxCurrent3Loaded;
  
  return breakerRating <= maxCurrent;
}

/**
 * Calcula a queda de tensão (%) em um circuito
 * ΔV% = (2 × ρ × L × Ib) / (S × V) × 100
 * Para circuitos monofásicos
 */
export function calculateVoltageDrop(
  current: number,
  cableLengthMeters: number,
  cableSizeMm2: number,
  voltage: number = 127
): number {
  if (cableSizeMm2 === 0 || voltage === 0) return 0;
  
  const drop = (2 * COPPER_RESISTIVITY * cableLengthMeters * current) / (cableSizeMm2 * voltage) * 100;
  return Math.round(drop * 100) / 100;
}

/**
 * Retorna a cor de indicação da queda de tensão
 */
export function getVoltageDropColor(dropPercent: number): 'green' | 'yellow' | 'red' {
  if (dropPercent <= 2) return 'green';    // Aceitável (ramais)
  if (dropPercent <= 4) return 'yellow';   // Limite (circuitos terminais)
  return 'red';                             // Acima do permitido
}

/**
 * Calcula a capacidade máxima de corrente para um dado cabo
 */
export function getCableCapacity(
  cableSizeMm2: number,
  loadedConductors: 2 | 3 = 2,
  groupingFactor: number = 1.0
): number {
  const cable = CABLE_TABLE.find(c => c.crossSection === cableSizeMm2);
  if (!cable) return 0;
  
  const baseCurrent = loadedConductors === 2
    ? cable.maxCurrent2Loaded
    : cable.maxCurrent3Loaded;
  
  return baseCurrent * groupingFactor;
}

/**
 * Sugere o dimensionamento completo para uma carga
 */
export function suggestDimensioning(
  loadWatts: number,
  voltage: number = 127,
  powerFactor: number = 0.92,
  cableLengthMeters: number = 15,
  loadedConductors: 2 | 3 = 2,
  groupingFactor: number = 1.0
): {
  designCurrent: number;
  breakerRating: number;
  cableSizeMm2: number;
  voltageDrop: number;
  voltageDropColor: 'green' | 'yellow' | 'red';
  isCoordinated: boolean;
} {
  const designCurrent = calculateDesignCurrent(loadWatts, voltage, powerFactor);
  const breakerRating = selectBreaker(designCurrent);
  const cableSizeMm2 = selectCableSize(designCurrent, loadedConductors, groupingFactor);
  const voltageDrop = calculateVoltageDrop(designCurrent, cableLengthMeters, cableSizeMm2, voltage);
  const voltageDropColor = getVoltageDropColor(voltageDrop);
  const isCoordinated = checkCableBreakerCoordination(breakerRating, cableSizeMm2, loadedConductors);

  return {
    designCurrent: Math.round(designCurrent * 100) / 100,
    breakerRating,
    cableSizeMm2,
    voltageDrop,
    voltageDropColor,
    isCoordinated,
  };
}
