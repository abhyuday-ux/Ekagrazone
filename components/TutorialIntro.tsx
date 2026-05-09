import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { EkagraLogo } from './EkagraLogo';

interface TutorialIntroProps {
  displayName: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const TutorialIntro: React.FC<TutorialIntroProps> = ({ displayName, onComplete, onSkip }) => {
  const [scene, setScene] = useState(0);
  const TOTAL_SCENES = 6;
  const [timerSecs, setTimerSecs] = useState(1499);

  useEffect(() => {
    if (scene >= TOTAL_SCENES - 1) return;
    const durations = [4000, 6000, 6000, 6000, 5000, 0];
    const timer = setTimeout(() => {
      setScene(s => s + 1);
    }, durations[scene]);
    return () => clearTimeout(timer);
  }, [scene]);

  useEffect(() => {
    if (scene !== 1) return;
    const iv = setInterval(() => {
      setTimerSecs(s => (s > 0 ? s - 1 : 1499));
    }, 1000);
    return () => clearInterval(iv);
  }, [scene]);

  const timerDisplay = `${Math.floor(timerSecs / 60).toString().padStart(2, '0')}:${(timerSecs % 60).toString().padStart(2, '0')}`;

  const renderScene = () => {
    switch (scene) {
      case 0:
        return (
          <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 z-10 w-full max-w-md mx-auto">
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }} className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.4)]">
              <EkagraLogo className="w-20 h-20" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Welcome to</div>
              <h1 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">EkagraZone</h1>
              <div className="text-xl text-white font-bold">Hey {displayName}! 👋</div>
              <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Your personal focus command center. Let's take a quick tour.</p>
            </motion.div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6 z-10 w-full max-w-md mx-auto">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">🎯 Focus Timer</div>
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 mb-6 shadow-[0_0_40px_rgba(6,182,212,0.1)] w-full">
              <div className="text-center mb-4">
                <div className="flex gap-2 justify-center mb-6">
                  <div className="px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-bold">Pomodoro</div>
                  <div className="px-3 py-1 rounded-full bg-white/5 text-slate-400 text-xs">Break</div>
                  <div className="hidden sm:block px-3 py-1 rounded-full bg-white/5 text-slate-400 text-xs">Stopwatch</div>
                </div>
                <div className="text-6xl font-black font-mono text-cyan-400 mb-2 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]">{timerDisplay}</div>
                <div className="text-slate-500 text-xs uppercase tracking-widest">Deep Work · Physics</div>
                <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: ['0%', '65%'] }} transition={{ duration: 5, ease: 'linear' }} className="h-full bg-cyan-500 rounded-full" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Deep Focus Sessions</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Pomodoro, stopwatch, or custom timer. Zen mode for distraction-free studying.</p>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6 z-10 w-full max-w-md mx-auto">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">📚 Syllabus Tracker</div>
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 mb-6 w-full max-w-xs mx-auto">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-left">JEE Physics</div>
              {[
                { name: "Newton's Laws", status: 'done', delay: 0.2 },
                { name: 'Work & Energy', status: 'done', delay: 0.5 },
                { name: 'Rotational Motion', status: 'progress', delay: 0.8 },
                { name: 'Gravitation', status: 'revision', delay: 1.1 },
                { name: 'Thermodynamics', status: 'none', delay: 1.4 },
              ].map(ch => (
                <motion.div key={ch.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ch.delay }} className="flex items-center gap-2.5 py-2 border-b border-white/5 last:border-0">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] flex-shrink-0 ${ch.status === 'done' ? 'bg-emerald-500 text-white' : ch.status === 'progress' ? 'border-2 border-blue-500 bg-blue-500/20' : ch.status === 'revision' ? 'border-2 border-amber-500 bg-amber-500/20' : 'border-2 border-white/20'}`}>{ch.status === 'done' && '✓'}</div>
                  <span className={`text-xs ${ch.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{ch.name}</span>
                </motion.div>
              ))}
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Full JEE & NEET Syllabus</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Every chapter and topic pre-loaded. Track your progress topic by topic.</p>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6 z-10 w-full max-w-md mx-auto">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">👥 Study Rooms</div>
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 mb-6 w-full max-w-xs mx-auto flex flex-col items-center">
              <div className="text-[10px] font-mono text-slate-500 mb-3">Study Room · ZEN123</div>
              <div className="text-4xl font-mono font-bold text-cyan-400 text-center mb-3 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">18:42</div>
              <div className="w-full text-left">
                {[{ name: 'Abhyuday', color: '#06b6d4', delay: 0.2 }, { name: 'Rohan', color: '#8b5cf6', delay: 0.5 }, { name: 'Priya', color: '#10b981', delay: 0.8 }].map(m => (
                  <motion.div key={m.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: m.delay }} className="flex items-center gap-2 py-1.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white relative z-10 flex-shrink-0" style={{ background: m.color }}>{m.name[0]}</div>
                    <span className="text-xs text-slate-300 flex-1 truncate">{m.name}</span>
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-[9px] font-bold text-cyan-400">FOCUSING</motion.span>
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }} className="mt-3 bg-slate-800 rounded-xl p-2.5 border border-white/5 w-full text-left">
                <span className="text-xs text-slate-300">Rohan: Let's grind 💪</span>
              </motion.div>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Study With Friends</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Real-time study rooms with synced Pomodoro timer, live chat, and collaborative whiteboard.</p>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6 z-10 w-full max-w-md mx-auto">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">📊 Stats & Focus DNA</div>
            <div className="relative w-full max-w-xs mx-auto mb-6">
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 mb-3 text-left">
                <div className="text-[10px] text-slate-500 mb-2">Study Heatmap</div>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 84 }).map((_, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="aspect-square rounded-sm" style={{ background: Math.random() > 0.4 ? `rgba(6,182,212,${0.2 + Math.random() * 0.8})` : 'rgba(255,255,255,0.05)' }} />
                  ))}
                </div>
              </div>
              <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.5, type: 'spring' }} className="bg-slate-900/90 border border-purple-500/20 rounded-xl p-3 flex items-center gap-3 relative z-10 min-h-[64px]">
                <span className="text-2xl flex-shrink-0">🦉</span>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">Night Owl</div>
                  <div className="text-[10px] text-slate-500 truncate">Your Focus DNA</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-mono font-bold text-purple-400">156h</div>
                  <div className="text-[9px] text-slate-600">total</div>
                </div>
              </motion.div>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Discover Your Patterns</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Heatmaps, streaks, and your unique Focus DNA. Know exactly how you study.</p>
          </motion.div>
        );
      case 5:
        return (
          <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 z-10 w-full max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-2 mb-2 w-full max-w-[280px]">
              {[{ emoji: '⏱', label: 'Timer' }, { emoji: '📚', label: 'Syllabus' }, { emoji: '👥', label: 'Rooms' }, { emoji: '📊', label: 'Stats' }, { emoji: '🗺️', label: 'Planner' }, { emoji: '🧬', label: 'DNA' }].map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                  <div className="text-xl mb-1">{f.emoji}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{f.label}</div>
                </motion.div>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <h2 className="text-3xl font-black text-white mb-2">Everything you need.<br /><span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Nothing you don't.</span></h2>
              <p className="text-slate-400 text-sm mb-6">Your focus journey starts now.</p>
            </motion.div>
            <motion.button onClick={onComplete} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full max-w-xs mx-auto py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2">
              Let's get started 🚀
            </motion.button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-[500px] bg-cyan-900/10 blur-[100px] rounded-full" />
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className="absolute bg-white rounded-full opacity-0" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 3}px`, height: `${Math.random() * 3}px`, animation: `twinkle ${2 + Math.random() * 4}s infinite ${Math.random() * 4}s` }} />
        ))}
      </div>
      <style>{`@keyframes twinkle { 0%, 100% { opacity: 0; transform: scale(1); } 50% { opacity: ${0.2 + Math.random() * 0.3}; transform: scale(1.5); } }`}</style>
      
      {scene < TOTAL_SCENES - 1 && (
        <button onClick={onSkip} className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs hover:text-white hover:bg-white/10 transition-all">
          Skip <ChevronRight size={12} />
        </button>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === scene ? 'w-6 bg-cyan-400' : i < scene ? 'w-2 bg-white/40' : 'w-2 bg-white/10'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">{renderScene()}</AnimatePresence>
    </div>
  );
};
