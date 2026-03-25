import { motion } from 'framer-motion';
import type { CanvasScene } from '../canvas/canvas-layout';

interface WireRendererProps {
  scene: CanvasScene;
  mainBreakerOn: boolean;
}

const WIRE_COLORS = {
  phase: '#1a1a1a',
  neutral: '#0066CC',
  ground: '#009933',
};

export function WireRenderer({ scene, mainBreakerOn }: WireRendererProps) {
  if (scene.componentLayouts.length === 0) return null;

  const wireElements = scene.componentLayouts.map((layout, index) => {
    const { component, bottomY } = layout;
    const energized = mainBreakerOn && component.state === 'ON';
    const isDps = component.type === 'dps';
    const isIdr = component.type === 'idr';
    const poles = component.poles || 1;
    const wires = [];

    for (let poleIndex = 0; poleIndex < poles; poleIndex += 1) {
      const terminalX = layout.getTerminalX(poleIndex);
      const isNeutralPole = isIdr && poleIndex === poles - 1;

      if (isDps) {
        const phasePath = `M ${terminalX} ${scene.phaseBusbarY} L ${terminalX} ${scene.componentsTopY}`;
        const earthY = bottomY + 20 + index * 5;
        const earthPath = `M ${terminalX} ${bottomY} L ${terminalX} ${earthY} L ${scene.earthBarX} ${earthY}`;

        wires.push(
          <motion.path key={`dps-in-${poleIndex}`} d={phasePath} stroke={WIRE_COLORS.phase} strokeWidth={4} />,
        );

        if (mainBreakerOn) {
          wires.push(
            <motion.path
              key={`dps-glow-${poleIndex}`}
              d={phasePath}
              stroke="#00E676"
              strokeWidth={2}
              filter="url(#energy-glow-wire)"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
            />,
          );
        }

        wires.push(
          <motion.path
            key={`dps-out-${poleIndex}`}
            d={earthPath}
            stroke={WIRE_COLORS.ground}
            strokeWidth={3}
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />,
        );

        continue;
      }

      if (isNeutralPole) {
        const neutralBarY = scene.phaseBusbarY - 15 - index * 5;
        const neutralIn = `M ${scene.neutralBarX} ${neutralBarY} L ${terminalX} ${neutralBarY} L ${terminalX} ${scene.componentsTopY}`;
        const neutralOut = `M ${terminalX} ${bottomY} L ${terminalX} 1500`;

        wires.push(
          <motion.path
            key={`n-in-${poleIndex}`}
            d={neutralIn}
            stroke={WIRE_COLORS.neutral}
            strokeWidth={3}
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />,
        );

        wires.push(
          <motion.path
            key={`n-out-${poleIndex}`}
            d={neutralOut}
            stroke={WIRE_COLORS.neutral}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />,
        );

        if (energized) {
          wires.push(
            <motion.path
              key={`n-out-glow-${poleIndex}`}
              d={neutralOut}
              stroke="#448AFF"
              strokeWidth={1.5}
              fill="none"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />,
          );
        }

        continue;
      }

      const phaseIn = `M ${terminalX} ${scene.phaseBusbarY} L ${terminalX} ${scene.componentsTopY}`;
      const phaseOut = `M ${terminalX} ${bottomY} L ${terminalX} 1500`;

      wires.push(
        <motion.path
          key={`p-in-${poleIndex}`}
          d={phaseIn}
          stroke={WIRE_COLORS.phase}
          strokeWidth={4}
          strokeLinecap="round"
        />,
      );

      if (mainBreakerOn) {
        wires.push(
          <motion.path
            key={`p-in-glow-${poleIndex}`}
            d={phaseIn}
            stroke="#00E676"
            strokeWidth={2}
            filter="url(#energy-glow-wire)"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
          />,
        );
      }

      wires.push(
        <motion.path
          key={`p-out-${poleIndex}`}
          d={phaseOut}
          stroke={WIRE_COLORS.phase}
          strokeWidth={4}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />,
      );

      if (energized) {
        wires.push(
          <motion.path
            key={`p-out-glow-${poleIndex}`}
            d={phaseOut}
            stroke="#00E676"
            strokeWidth={2}
            filter="url(#energy-glow-wire)"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
          />,
        );
      }
    }

    return <g key={component.id}>{wires}</g>;
  });

  return (
    <svg
      width="100%"
      height="100%"
      className="absolute left-0 top-0 z-0 pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="energy-glow-wire">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="copper-bus" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B6914" />
          <stop offset="50%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>

      <rect
        x={scene.earthBarX - 8}
        y={scene.componentsBottomY + 20}
        width={16}
        height={120}
        rx={4}
        fill="#009933"
        stroke="#004d1a"
        strokeWidth={2}
      />
      {Array.from({ length: 6 }).map((_, index) => (
        <circle
          key={`e-${index}`}
          cx={scene.earthBarX}
          cy={scene.componentsBottomY + 30 + index * 18}
          r={3}
          fill="#ccc"
          stroke="#666"
        />
      ))}
      <text
        x={scene.earthBarX}
        y={scene.componentsBottomY + 12}
        fontSize="12"
        fill="white"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        PE
      </text>
      <path
        d={`M ${scene.earthBarX + 4} ${scene.componentsBottomY + 135} L ${scene.earthBarX + 4} 1500`}
        stroke={WIRE_COLORS.ground}
        strokeWidth={4}
      />

      <rect
        x={scene.neutralBarX - 8}
        y={scene.componentsBottomY + 20}
        width={16}
        height={120}
        rx={4}
        fill="#0066CC"
        stroke="#003366"
        strokeWidth={2}
      />
      {Array.from({ length: 6 }).map((_, index) => (
        <circle
          key={`n-${index}`}
          cx={scene.neutralBarX}
          cy={scene.componentsBottomY + 30 + index * 18}
          r={3}
          fill="#ccc"
          stroke="#666"
        />
      ))}
      <text
        x={scene.neutralBarX}
        y={scene.componentsBottomY + 12}
        fontSize="12"
        fill="white"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        N
      </text>
      <path
        d={`M ${scene.neutralBarX - 4} ${scene.componentsBottomY + 135} L ${scene.neutralBarX - 4} 1500`}
        stroke={WIRE_COLORS.neutral}
        strokeWidth={4}
      />

      <path
        d={`M ${scene.mainBreakerCenterX} ${scene.streetInputY} L ${scene.mainBreakerCenterX} ${scene.phaseBusbarY}`}
        stroke={WIRE_COLORS.phase}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {mainBreakerOn && (
        <motion.path
          d={`M ${scene.mainBreakerCenterX} ${scene.streetInputY} L ${scene.mainBreakerCenterX} ${scene.phaseBusbarY}`}
          stroke="#00E676"
          strokeWidth={3}
          filter="url(#energy-glow-wire)"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <path
        d={`M ${scene.mainBreakerCenterX - 4} ${scene.phaseBusbarY} L ${scene.lastPhaseX + 4} ${scene.phaseBusbarY}`}
        fill="none"
        stroke="url(#copper-bus)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-lg"
      />
      {mainBreakerOn && (
        <motion.path
          d={`M ${scene.mainBreakerCenterX} ${scene.phaseBusbarY} L ${scene.lastPhaseX} ${scene.phaseBusbarY}`}
          fill="none"
          stroke="#00E676"
          strokeWidth={3}
          strokeLinecap="round"
          filter="url(#energy-glow-wire)"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {wireElements}
    </svg>
  );
}
