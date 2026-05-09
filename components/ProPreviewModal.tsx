import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Zap } from 'lucide-react';

export type MobileTab = 'dashboard' | 'timer' | 'timeline' | 'settings' | 'syllabus' | 'journal' | 'habits' | 'social' | 'calendar' | 'exams';

interface ProPreviewModalProps {
  tab: MobileTab;
  onClose: () => void;
  onUpgrade: () => void;
}

const getTabLabel = (tab: MobileTab): string => {
  const labels: Record<string, string> = {
    syllabus: 'Syllabus Tracker',
    journal: 'Daily Journal',
    habits: 'Habit Forge',
    social: 'Social Arena',
    calendar: 'Smart Planner',
    exams: 'Exam Tracker',
  };
  return labels[tab] || 'Pro Feature';
};

export const ProPreviewModal: React.FC<ProPreviewModalProps> = ({
  tab,
  onClose,
  onUpgrade
}) => {
  const [scene, setScene] = useState(0);
  const scenes = 5;

  useEffect(() => {
    const iv = setInterval(() => {
      setScene(s => (s + 1) % scenes);
    }, 3000);
    return () => clearInterval(iv);
  }, [scenes]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.1,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/8 blur-[100px] rounded-full pointer-events-none" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
      >
        <X size={18} />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {Array.from({ length: scenes }).map((_, i) => (
          <button
            key={i}
            onClick={() => setScene(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === scene ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10 relative">
        <AnimatePresence mode="wait">
          {scene === 0 && (
            <motion.div
              key="scene0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="w-20 h-20 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.2)]"
              >
                <Lock size={36} className="text-cyan-400" />
              </motion.div>

              <div>
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">
                  Pro Feature
                </div>
                <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                  {getTabLabel(tab)}
                </h2>
                <p className="text-slate-400 text-sm max-w-xs">
                  Unlock this and every other Pro feature with a one-time payment.
                </p>
              </div>
            </motion.div>
          )}

          {scene === 1 && (
            <motion.div
              key="scene1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-sm"
            >
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">
                What you're missing
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-3">
                {['Physics', 'Chemistry', 'Mathematics'].map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: ['#06b6d4', '#a78bfa', '#f97316'][i] }}
                    />
                    <div className="text-xs text-slate-300 w-24 text-left truncate">{s}</div>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: ['65%', '73%', '48%'][i] }}
                        transition={{ duration: 1.5, delay: i * 0.2, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: ['#06b6d4', '#a78bfa', '#f97316'][i] }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 w-8 text-right">
                      {['65%', '73%', '48%'][i]}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: 'Streak', value: '12🔥' },
                    { label: 'Topics', value: '48✓' },
                    { label: 'Hours', value: '156h' },
                  ].map(stat => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white/5 rounded-xl p-2 text-center"
                    >
                      <div className="text-sm font-bold text-white">{stat.value}</div>
                      <div className="text-[9px] text-slate-500">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {scene === 2 && (
            <motion.div
              key="scene2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-sm"
            >
              <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">
                Study together
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <div className="text-xs text-slate-500 mb-3 font-mono">Study Room · ZEN123</div>
                <div className="text-3xl font-mono font-bold text-cyan-400 text-center mb-3 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  24:59
                </div>
                {['Abhyuday', 'Rohan', 'Priya'].map((name, i) => (
                  <div key={name} className="flex items-center gap-2 py-1.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: ['#06b6d4', '#8b5cf6', '#10b981'][i] }}
                    >
                      {name[0]}
                    </div>
                    <span className="text-xs text-slate-300 flex-1">{name}</span>
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      className="text-[9px] font-bold text-cyan-400"
                    >
                      FOCUSING
                    </motion.div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {scene === 3 && (
            <motion.div
              key="scene3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Join the community
              </div>
              <div className="flex -space-x-3">
                {['#06b6d4', '#8b5cf6', '#f97316', '#10b981', '#f43f5e'].map((color, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-10 h-10 rounded-full border-2 border-slate-950 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: color }}
                  >
                    {['R', 'P', 'A', 'S', 'M'][i]}
                  </motion.div>
                ))}
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">500+ Students</div>
                <div className="text-slate-400 text-sm">already unlocked their peak performance</div>
              </div>
              <div className="flex gap-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                    className="text-amber-400 text-xl"
                  >
                    ⭐
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {scene === 4 && (
            <motion.div
              key="scene4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm"
            >
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 text-center">
                Everything unlocked
              </div>
              <div className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-5 mb-4 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                {[
                  '📚 Full JEE & NEET Syllabus',
                  '👥 Study Rooms + Whiteboard',
                  '🗺️ Smart Study Planner',
                  '📖 Journal & Habits',
                  '👫 Social & Friends',
                  '☁️ Cloud Sync',
                  '♾️ Lifetime Access',
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2 py-1.5 text-sm text-slate-200"
                  >
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 p-6 pb-8 space-y-3 z-10 relative">
        <motion.button
          onClick={onUpgrade}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap size={20} />
          Unlock Your Flow State
          <span className="text-sm font-normal opacity-80 ml-1">₹149</span>
        </motion.button>

        <button
          onClick={onClose}
          className="w-full py-2 text-slate-500 text-sm hover:text-slate-300 transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </motion.div>
  );
};
