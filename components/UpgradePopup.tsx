import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, ArrowRight } from 'lucide-react';

interface UpgradePopupProps {
  onClose: () => void;
  onUpgrade: () => void;
}

export const UpgradePopup: React.FC<UpgradePopupProps> = ({ onClose, onUpgrade }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden relative shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="p-6 pt-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 mb-4 border border-cyan-500/30">
            <Sparkles size={24} />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            You're exploring EkagraZone! 🎉
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Unlock everything with Pro
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: '📚', label: 'Syllabus' },
              { icon: '👥', label: 'Study Rooms' },
              { icon: '🗺️', label: 'Planner' },
              { icon: '📖', label: 'Journal' },
              { icon: '👫', label: 'Social' },
              { icon: '☁️', label: 'Sync' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-2.5 border border-white/5">
                <span className="text-lg">{feature.icon}</span>
                <span className="text-xs font-medium text-slate-300">{feature.label}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-950/50 border border-cyan-500/20 mb-6">
            <div className="text-2xl font-black text-white mb-1">₹149</div>
            <div className="text-xs text-cyan-400 font-medium">One time, lifetime access</div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full py-3.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Unlock Now <ArrowRight size={16} />
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-slate-500 text-xs font-medium hover:text-slate-300 transition-colors cursor-pointer"
            >
              I'll stick with free
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
