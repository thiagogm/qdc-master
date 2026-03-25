// ========================================
// DPS — Dispositivo de Proteção contra Surtos
// ========================================

import { motion, AnimatePresence } from 'framer-motion';
import type { DINComponent } from '../../types/types';
import { useSimulationStore } from '../../store/simulation-store';

interface DPSProps {
  component: DINComponent;
}

export function DPSComponent({ component }: DPSProps) {
  const { toggleComponent, selectComponent, isEnergized, selectedComponentId } = useSimulationStore();
  const { id, state, rating, dpsClass, label } = component;
  const energized = isEnergized(id);
  const isSelected = selectedComponentId === id;

  const bodyWidth = 32;
  const bodyHeight = 96;

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer select-none"
      style={{ width: bodyWidth }}
      onClick={(e) => { e.stopPropagation(); selectComponent(isSelected ? null : id); }}
    >
      {/* Selection ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute -inset-2 rounded-lg border-2 border-orange-400 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Top terminal */}
      <div className="mb-1 z-10">
        <div className="terminal-screw w-3 h-3 mx-auto" />
      </div>

      {/* DPS body */}
      <div
        className="component-body relative flex flex-col items-center justify-between py-2 px-1 z-10"
        style={{
          width: bodyWidth,
          height: bodyHeight,
          background: 'linear-gradient(180deg, #5A4A2A 0%, #4A3A1A 50%, #3A2A0A 100%)',
          boxShadow: energized
            ? '0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(255,145,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-[6px] font-mono text-orange-300/60 tracking-wider">DPS</div>

        {/* Status window */}
        <motion.div
          className="w-4 h-4 rounded-sm flex items-center justify-center"
          style={{
            backgroundColor: energized ? '#00E676' : state === 'TRIPPED' ? '#FF1744' : '#333',
          }}
          animate={energized ? { opacity: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Lightning icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" className="my-1">
          <path
            d="M8 1L3 8h4l-1 5 5-7H7l1-5z"
            fill={energized ? '#FF9100' : '#666'}
            stroke="none"
          />
        </svg>

        <div className="text-[7px] font-mono text-orange-200/80">
          {dpsClass || 'II'}
        </div>

        <div className="text-[8px] font-mono text-white font-semibold">{rating}kA</div>

        <motion.button
          className="w-full h-3 rounded-sm"
          style={{
            backgroundColor: state === 'ON' ? '#FF9100' : '#444',
          }}
          onClick={(e) => { e.stopPropagation(); toggleComponent(id); }}
          whileTap={{ scale: 0.95 }}
        />
      </div>

      {/* Bottom terminal */}
      <div className="mt-1 z-10">
        <div className="terminal-screw w-3 h-3 mx-auto" />
      </div>

      <div className="mt-1 text-[8px] text-panel-muted font-medium text-center truncate w-full">
        {label}
      </div>
    </motion.div>
  );
}
