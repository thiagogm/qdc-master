// ========================================
// Contator de Potência
// Bobina eletromagnética com ativação condicional
// ========================================

import { motion, AnimatePresence } from 'framer-motion';
import type { DINComponent } from '../../types/types';
import { useSimulationStore } from '../../store/simulation-store';

interface ContactorProps {
  component: DINComponent;
}

const stateColors = {
  ON: { bg: '#FFD600', label: 'ENER.', glow: 'rgba(255,214,0,0.4)' },
  OFF: { bg: '#616161', label: 'DES.', glow: 'transparent' },
  TRIPPED: { bg: '#FF1744', label: 'TRIP', glow: 'rgba(255,23,68,0.4)' },
};

export function ContactorComponent({ component }: ContactorProps) {
  const { toggleComponent, resetComponent, selectComponent, isEnergized, mainBreakerOn, selectedComponentId } = useSimulationStore();
  const { id, state, rating, poles, label } = component;
  const energized = isEnergized(id);
  const colors = stateColors[state];
  const isSelected = selectedComponentId === id;
  const canActivate = mainBreakerOn;

  const handleClick = () => {
    if (state === 'TRIPPED') {
      resetComponent(id);
    } else {
      toggleComponent(id);
    }
  };

  const bodyWidth = 76;
  const bodyHeight = 110;

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer select-none"
      style={{ width: bodyWidth }}
      onClick={(e) => { e.stopPropagation(); selectComponent(isSelected ? null : id); }}
      animate={state === 'TRIPPED' ? {
        x: [0, -3, 3, -2, 2, 0],
        transition: { duration: 0.5 }
      } : {}}
    >
      {/* Selection ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute -inset-2 rounded-lg border-2 border-yellow-400 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ boxShadow: '0 0 12px rgba(255,214,0,0.3)' }}
          />
        )}
      </AnimatePresence>

      {/* Top terminals */}
      <div className="flex gap-2 mb-1 z-10">
        {Array.from({ length: poles }).map((_, i) => (
          <div key={`top-${i}`} className="flex flex-col items-center">
            <div className="terminal-screw w-3 h-3" />
          </div>
        ))}
      </div>

      {/* Contactor body */}
      <div
        className="component-body relative flex flex-col items-center justify-between py-2 px-2 z-10"
        style={{
          width: bodyWidth,
          height: bodyHeight,
          background: 'linear-gradient(180deg, #4A4A4A 0%, #3A3A3A 30%, #2A2A2A 100%)',
          boxShadow: energized
            ? `0 2px 8px rgba(0,0,0,0.4), 0 0 16px ${colors.glow}`
            : '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Brand */}
        <div className="text-[7px] font-mono text-gray-400 tracking-wider">CONTATOR</div>

        {/* Coil indicator */}
        <div className="relative w-8 h-8 flex items-center justify-center my-1">
          {/* Coil symbol */}
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle
              cx="14" cy="14" r="10"
              fill="none"
              stroke={energized ? '#FFD600' : '#555'}
              strokeWidth="2"
            />
            <text x="14" y="18" textAnchor="middle" fontSize="10" fill={energized ? '#FFD600' : '#888'} fontFamily="monospace">A</text>
          </svg>
          {/* Glow effect */}
          <AnimatePresence>
            {energized && (
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ background: 'radial-gradient(circle, rgba(255,214,0,0.3) 0%, transparent 70%)' }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Switch button */}
        <motion.button
          className="switch-handle flex items-center justify-center relative overflow-hidden"
          style={{ width: 36, height: 20 }}
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          animate={{
            backgroundColor: energized ? '#FFD600' : !canActivate ? '#333' : '#555',
            y: state === 'ON' ? -2 : 2,
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="w-4 h-0.5 rounded-full"
            style={{ backgroundColor: energized ? '#8B6914' : '#777' }}
          />
        </motion.button>

        {/* Status */}
        <div className="flex items-center gap-1 mt-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.bg }} />
          <span className="text-[8px] font-mono font-bold" style={{ color: colors.bg }}>
            {colors.label}
          </span>
        </div>

        {/* Rating */}
        <div className="text-[9px] font-mono text-white font-semibold">{rating}A</div>

        {/* Interlock warning */}
        {!canActivate && state === 'OFF' && (
          <motion.div
            className="text-[6px] text-orange-400 font-mono"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🔒 BLOQ.
          </motion.div>
        )}
      </div>

      {/* Bottom terminals */}
      <div className="flex gap-2 mt-1 z-10">
        {Array.from({ length: poles }).map((_, i) => (
          <div key={`bot-${i}`} className="terminal-screw w-3 h-3" />
        ))}
      </div>

      <div className="mt-1 text-[8px] text-panel-muted font-medium text-center truncate w-full">
        {label}
      </div>
    </motion.div>
  );
}
