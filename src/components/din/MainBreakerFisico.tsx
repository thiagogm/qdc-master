import { motion } from 'framer-motion';
import { Power } from 'lucide-react';

interface MainBreakerFisicoProps {
  isOn: boolean;
  onToggle: () => void;
}

export function MainBreakerFisico({ isOn, onToggle }: MainBreakerFisicoProps) {
  return (
    <div className="relative flex flex-col items-center w-[80px] h-[130px] bg-gradient-to-b from-[#2a2d3a] to-[#1f222e] rounded-lg border-[3px] border-[#3a3d4a] shadow-[0_10px_30px_rgba(0,0,0,0.8)] shrink-0 z-20 overflow-visible mt-2">
      {/* Top Terminals (Grid) */}
      <div className="absolute -top-3 w-12 h-4 bg-gradient-to-b from-gray-400 to-gray-500 rounded-sm border border-gray-600 flex justify-evenly items-center shadow-inner">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
        <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
      </div>

      <div className="w-full text-center mt-3 bg-black/20 py-1 border-y border-white/5">
        <span className="text-[10px] font-mono text-gray-300 font-bold tracking-widest block">GERAL</span>
      </div>

      {/* Switch Mechanism */}
      <motion.button
        className="w-14 h-16 mt-2 rounded bg-gradient-to-b from-[#1a1c23] to-[#12141a] shadow-inner flex flex-col relative border border-black group"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute inset-x-1 h-8 rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center border border-white/10"
          animate={{
            y: isOn ? 2 : 28,
            backgroundColor: isOn ? '#00E676' : '#FF1744',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Power size={14} className={isOn ? 'text-green-900' : 'text-red-950'} strokeWidth={3} />
        </motion.div>
      </motion.button>
      
      <div className="text-[9px] font-mono text-gray-400 mt-auto mb-2 bg-black/40 px-2 rounded">63A - Bivolt</div>
      
      {/* Bottom Terminal (Busbar connect) */}
      <div className="absolute -bottom-3 w-12 h-4 bg-gradient-to-b from-[#D4A574] to-[#B48560] rounded-sm border border-[#8B6914] flex justify-center items-center shadow-lg">
        <div className="w-2 h-2 rounded-full bg-black/30" />
      </div>
    </div>
  );
}
