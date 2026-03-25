// ========================================
// IDR — Interruptor Diferencial Residual
// Com botão "Test" funcional
// ========================================

import { motion, AnimatePresence } from 'framer-motion';
import type { DINComponent } from '../../types/types';
import { useSimulationStore } from '../../store/simulation-store';

interface IDRProps {
  component: DINComponent;
}

export function IDRComponent({ component }: IDRProps) {
  const { toggleComponent, resetComponent, testIDR, selectComponent, isEnergized, selectedComponentId } = useSimulationStore();
  const { id, state, rating, sensitivity, label } = component;
  const energized = isEnergized(id);
  const isSelected = selectedComponentId === id;

  const handleToggle = () => {
    if (state === 'TRIPPED') {
      resetComponent(id);
    } else {
      toggleComponent(id);
    }
  };

  const handleTest = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (state === 'ON') {
      testIDR(id);
    }
  };

  const bodyWidth = 56;
  const bodyHeight = 110;

  const stateColor = state === 'ON' ? '#00BCD4' : state === 'TRIPPED' ? '#FF1744' : '#616161';

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer select-none"
      style={{ width: bodyWidth }}
      onClick={(e) => { e.stopPropagation(); selectComponent(isSelected ? null : id); }}
      animate={state === 'TRIPPED' ? {
        x: [0, -4, 4, -3, 3, -1, 1, 0],
        transition: { duration: 0.6 }
      } : {}}
    >
      {/* Selection ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute -inset-2 rounded-lg border-2 border-cyan-400 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ boxShadow: '0 0 12px rgba(0,188,212,0.3)' }}
          />
        )}
      </AnimatePresence>

      {/* Top terminals */}
      <div className="flex gap-2 mb-1 z-10">
        <div className="terminal-screw w-3 h-3" />
        <div className="terminal-screw w-3 h-3" />
      </div>

      {/* IDR body */}
      <div
        className="component-body relative flex flex-col items-center justify-between py-1.5 px-1 z-10"
        style={{
          width: bodyWidth,
          height: bodyHeight,
          background: 'linear-gradient(180deg, #3D4A5A 0%, #2D3A4A 50%, #1D2A3A 100%)',
          boxShadow: energized
            ? `0 2px 8px rgba(0,0,0,0.4), 0 0 16px rgba(0,188,212,0.4)`
            : '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Brand */}
        <div className="text-[7px] font-mono text-cyan-300/60 tracking-wider">IDR</div>

        {/* Sensitivity label */}
        <div className="text-[8px] font-mono text-cyan-200/80 font-semibold">
          {sensitivity || 30}mA
        </div>

        {/* Switch */}
        <motion.button
          className="switch-handle flex items-center justify-center"
          style={{ width: 32, height: 20 }}
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          animate={{
            y: state === 'ON' ? -4 : state === 'TRIPPED' ? 6 : 4,
            backgroundColor: state === 'ON' ? '#00BCD4' : state === 'TRIPPED' ? '#B71C1C' : '#555',
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="w-3 h-0.5 rounded-full"
            style={{ backgroundColor: state === 'ON' ? '#80DEEA' : '#888' }}
          />
        </motion.button>

        {/* Test button */}
        <motion.button
          className="rounded-full flex items-center justify-center text-[7px] font-mono font-bold"
          style={{
            width: 24,
            height: 24,
            backgroundColor: state === 'ON' ? '#FFD600' : '#444',
            color: state === 'ON' ? '#000' : '#666',
            boxShadow: state === 'ON' ? '0 1px 4px rgba(255,214,0,0.3)' : 'none',
          }}
          onClick={handleTest}
          whileTap={state === 'ON' ? { scale: 0.85 } : {}}
          whileHover={state === 'ON' ? { scale: 1.05 } : {}}
        >
          T
        </motion.button>

        {/* State indicator */}
        <motion.div
          className="flex items-center gap-1"
          animate={{ opacity: state === 'TRIPPED' ? [0.5, 1, 0.5] : 1 }}
          transition={{ duration: 0.8, repeat: state === 'TRIPPED' ? Infinity : 0 }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stateColor }} />
          <span className="text-[7px] font-mono font-bold" style={{ color: stateColor }}>
            {state === 'TRIPPED' ? 'TRIP' : state}
          </span>
        </motion.div>

        {/* Rating */}
        <div className="text-[9px] font-mono text-white font-semibold">{rating}A</div>
      </div>

      {/* Bottom terminals */}
      <div className="flex gap-2 mt-1 z-10">
        <div className="terminal-screw w-3 h-3" />
        <div className="terminal-screw w-3 h-3" />
      </div>

      <div className="mt-1 text-[8px] text-panel-muted font-medium text-center truncate w-full">
        {label}
      </div>
    </motion.div>
  );
}
