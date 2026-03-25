// ========================================
// Disjuntor Termomagnético (1P, 2P, 3P)
// Visual realista com switch mecânico animado
// ========================================

import { motion, AnimatePresence } from 'framer-motion';
import type { DINComponent } from '../../types/types';
import { useSimulationStore } from '../../store/simulation-store';

interface BreakerProps {
  component: DINComponent;
}

const stateColors = {
  ON: { bg: '#00E676', label: 'ON', glow: 'rgba(0,230,118,0.4)' },
  OFF: { bg: '#616161', label: 'OFF', glow: 'transparent' },
  TRIPPED: { bg: '#FF1744', label: 'TRIP', glow: 'rgba(255,23,68,0.4)' },
};

export function BreakerComponent({ component }: BreakerProps) {
  const { toggleComponent, resetComponent, selectComponent, isEnergized, selectedComponentId } = useSimulationStore();
  const { id, state, rating, poles, label, type } = component;
  const energized = isEnergized(id);
  const colors = stateColors[state];
  const isSelected = selectedComponentId === id;
  const isMain = type === 'mainBreaker';

  const handleClick = () => {
    if (state === 'TRIPPED') {
      resetComponent(id);
    } else {
      toggleComponent(id);
    }
  };

  const handleSelect = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    selectComponent(isSelected ? null : id);
  };

  const poleWidth = 28;
  const bodyWidth = poleWidth * poles + (poles - 1) * 4 + 16;
  const bodyHeight = isMain ? 110 : 96;

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer select-none"
      style={{ width: bodyWidth }}
      onClick={handleSelect}
      animate={state === 'TRIPPED' ? {
        x: [0, -3, 3, -2, 2, 0],
        transition: { duration: 0.5 }
      } : {}}
    >
      {/* Selection ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute -inset-2 rounded-lg border-2 border-energy-on z-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ boxShadow: '0 0 12px rgba(0,230,118,0.3)' }}
          />
        )}
      </AnimatePresence>

      {/* Top terminals */}
      <div className="flex gap-1 mb-1 relative z-10">
        {Array.from({ length: poles }).map((_, i) => (
          <div key={`top-${i}`} className="flex flex-col items-center">
            <div className="terminal-screw w-3 h-3" />
            {energized && (
              <motion.div
                className="w-0.5 h-2 mt-0.5"
                style={{ backgroundColor: i === 0 ? '#1a1a1a' : '#CC0000' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Component body */}
      <div
        className="component-body relative flex flex-col items-center justify-between py-2 px-1 z-10"
        style={{
          width: bodyWidth,
          height: bodyHeight,
          boxShadow: energized
            ? `0 2px 8px rgba(0,0,0,0.4), 0 0 16px ${colors.glow}`
            : '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Brand label */}
        <div className="text-[7px] font-mono text-gray-400 tracking-wider">
          {isMain ? 'QDC MASTER' : 'QDC'}
        </div>

        {/* Switch handle */}
        <motion.button
          className="switch-handle relative flex items-center justify-center"
          style={{
            width: Math.min(bodyWidth - 12, 40),
            height: 24,
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          animate={{
            y: state === 'ON' ? -4 : state === 'TRIPPED' ? 6 : 4,
            backgroundColor: state === 'ON' ? '#4CAF50' : state === 'TRIPPED' ? '#B71C1C' : '#555',
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <motion.div
            className="w-full h-0.5 rounded-full"
            style={{ backgroundColor: state === 'ON' ? '#69F0AE' : '#888' }}
          />
        </motion.button>

        {/* State indicator */}
        <motion.div
          className="flex items-center gap-1"
          animate={{ opacity: state === 'TRIPPED' ? [0.5, 1, 0.5] : 1 }}
          transition={{ duration: 0.8, repeat: state === 'TRIPPED' ? Infinity : 0 }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colors.bg }}
          />
          <span
            className="text-[8px] font-mono font-bold"
            style={{ color: colors.bg }}
          >
            {colors.label}
          </span>
        </motion.div>

        {/* Rating label */}
        <div className="text-[9px] font-mono text-white font-semibold">
          {rating}A
        </div>

        {/* Pole indicators */}
        <div className="flex gap-1">
          {Array.from({ length: poles }).map((_, i) => (
            <div
              key={`pole-${i}`}
              className="w-2 h-1 rounded-sm"
              style={{
                backgroundColor: energized ? colors.bg : '#444',
                opacity: energized ? 0.8 : 0.4,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom terminals */}
      <div className="flex gap-1 mt-1 relative z-10">
        {Array.from({ length: poles }).map((_, i) => (
          <div key={`bot-${i}`} className="flex flex-col items-center">
            {energized && (
              <motion.div
                className="w-0.5 h-2 mb-0.5"
                style={{ backgroundColor: i === 0 ? '#0066CC' : '#009933' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            )}
            <div className="terminal-screw w-3 h-3" />
          </div>
        ))}
      </div>

      {/* Label below */}
      <div className="mt-1 text-[8px] text-panel-muted font-medium text-center truncate w-full">
        {label}
      </div>
    </motion.div>
  );
}
