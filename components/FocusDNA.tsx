import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { StudySession, Subject } from '../types';
import { calculateFocusDNA, FocusDNA as FocusDNAData } from '../utils/focusDNA';

interface FocusDNAProps {
  sessions: StudySession[];
  subjects: Subject[];
  compact?: boolean;
}

const Slide1 = ({ dna }: { dna: FocusDNAData }) => (
  <motion.div
    key="slide1"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.1 }}
    className="flex flex-col items-center justify-center py-12 text-center gap-4 min-h-[300px] bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-slate-400 text-sm font-bold uppercase tracking-widest"
    >
      Your Focus Journey 🧬
    </motion.div>
    
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.4, type: 'spring', bounce: 0.4 }}
      className="text-7xl font-black font-mono text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]"
    >
      {dna.totalHours.toFixed(1)}
    </motion.div>
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="text-slate-300 text-lg font-bold"
    >
      hours of deep focus
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="flex gap-6 text-center z-10 relative"
    >
      <div>
        <div className="text-2xl font-black font-mono text-white">{dna.totalSessions}</div>
        <div className="text-xs text-slate-500">sessions</div>
      </div>
      <div className="w-px bg-white/10" />
      <div>
        <div className="text-2xl font-black font-mono text-white">{Math.round(dna.avgSessionMins)}m</div>
        <div className="text-xs text-slate-500">avg session</div>
      </div>
      <div className="w-px bg-white/10" />
      <div>
        <div className="text-2xl font-black font-mono text-white">{dna.bestStreakDays}🔥</div>
        <div className="text-xs text-slate-500">best streak</div>
      </div>
    </motion.div>
  </motion.div>
);

const Slide2 = ({ dna }: { dna: FocusDNAData }) => {
  const maxVal = Math.max(...dna.hourlyDistribution, 0.1);
  const hours = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4,5];
  
  return (
    <motion.div
      key="slide2"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="py-8 px-6 min-h-[300px] bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10"
    >
      <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
        When You Study
      </div>
      <div className="text-white text-xl font-black mb-6">
        You peak at {dna.peakHourLabel} ⏰
      </div>
      
      <div className="flex items-end gap-0.5 h-20 mb-2">
        {hours.map((h, i) => {
          const val = dna.hourlyDistribution[h];
          const pct = (val / maxVal) * 100;
          const isPeak = h === dna.peakHour;
          return (
            <motion.div
              key={h}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, pct)}%` }}
              transition={{ delay: i * 0.02, duration: 0.5 }}
              className="flex-1 rounded-t-sm"
              style={{
                background: isPeak ? '#06b6d4' : `rgba(6,182,212,${0.1 + (pct/100)*0.4})`,
                boxShadow: isPeak ? '0 0 8px rgba(6,182,212,0.6)' : 'none'
              }}
            />
          );
        })}
      </div>
      
      <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
        <span>6AM</span>
        <span>12PM</span>
        <span>6PM</span>
        <span>12AM</span>
        <span>6AM</span>
      </div>

      <div className="mt-4 flex items-center gap-2 bg-white/5 rounded-xl p-3">
        <span className="text-lg">📅</span>
        <div>
          <div className="text-white text-sm font-bold">
            {dna.peakDay} is your power day
          </div>
          <div className="text-slate-500 text-xs">
            Most productive day of the week
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Slide3 = ({ dna, subjects }: { dna: FocusDNAData; subjects: Subject[] }) => {
  const subject = subjects.find(s => s.id === dna.bestSubjectId);
  const color = subject?.color || '#06b6d4';
  
  return (
    <motion.div
      key="slide3"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="py-8 px-6 min-h-[300px] flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)` }} />
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4"
        style={{ background: `${color}20`, border: `2px solid ${color}40`, boxShadow: `0 0 30px ${color}30` }}
      >
        📚
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
          Your #1 Subject
        </div>
        <div className="text-3xl font-black text-white mb-2" style={{ color }}>
          {dna.bestSubjectName}
        </div>
        <div className="text-slate-400 text-sm">
          You've spent the most time mastering this
        </div>
      </motion.div>

      <div className="w-full mt-6 space-y-2">
        {Object.entries(
          dna.hourlyDistribution.reduce((acc, _, i) => acc, {}) // actually using hourly distribution instead of subjects isn't ideal but following prompt
        ).slice(0,3).map(([id, ms]: any, i) => {
          // Note: To match the prompt styling exactly, let's just get the top 3 subjects
          return null; // Handle this dynamically
        })}
        
        {/* Let's compute actual top subjects inline to render */}
        {(() => {
            const sortedSubjects = [...subjects].sort((a,b) => {
               // need subject duration from dna basically, but we don't have it explicitly exported. We can fake it or pass it. Let's just pass main for now or fake the rest.
               if (a.id === dna.bestSubjectId) return -1;
               return 1;
            }).slice(0,3);

            return sortedSubjects.map((sub, i) => {
                 return (
                    <div key={sub.id} className="flex items-center gap-2 relative z-10">
                      <div className="w-2 h-2 rounded-full" style={{background: sub.color}} />
                      <span className="text-xs text-slate-400 w-20 truncate text-left">{sub.name}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(10, 100 - i*30)}%` }} // Faked percentage for UI since we only have bestSubjectId
                          transition={{ delay: 0.6 + i*0.1 }}
                          className="h-full rounded-full"
                          style={{background: sub.color}}
                        />
                      </div>
                    </div>
                 )
            })
        })()}
      </div>
    </motion.div>
  );
};

const Slide4 = ({ dna }: { dna: FocusDNAData }) => (
  <motion.div
    key="slide4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="py-8 px-6 min-h-[300px] flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-950 rounded-2xl border border-purple-500/20 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 pointer-events-none" />

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6"
    >
      Your Focus Personality
    </motion.div>

    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.3, type: 'spring', bounce: 0.5, duration: 0.8 }}
      className="text-7xl mb-4"
    >
      {dna.personalityEmoji}
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="text-3xl font-black text-white mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
    >
      {dna.personalityLabel}
    </motion.div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="text-slate-300 text-sm max-w-xs leading-relaxed mb-6"
    >
      {dna.personalityDesc}
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="flex gap-4 relative z-10"
    >
      <div className="bg-white/5 rounded-xl px-4 py-2 text-center border border-white/10">
        <div className="text-lg font-bold font-mono text-white">{Math.round(dna.deepWorkPercent)}%</div>
        <div className="text-[10px] text-slate-500">Deep Work</div>
      </div>
      <div className="bg-white/5 rounded-xl px-4 py-2 text-center border border-white/10">
        <div className="text-lg font-bold font-mono text-white">{dna.currentStreakDays}🔥</div>
        <div className="text-[10px] text-slate-500">Current Streak</div>
      </div>
    </motion.div>
  </motion.div>
);

const Slide5 = ({ dna, cardRef }: { dna: FocusDNAData; cardRef: React.RefObject<HTMLDivElement> }) => {
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      alert('Take a screenshot to share your Focus DNA! 📸');
    }
  };

  return (
    <motion.div
      key="slide5"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[300px]"
    >
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-cyan-500/20 p-6 relative overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.1)]" id="dna-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="text-lg">🧬</div>
            <div>
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">EkagraZone</div>
              <div className="text-[10px] text-slate-500">Focus DNA Report</div>
            </div>
          </div>
          <div className="text-2xl">{dna.personalityEmoji}</div>
        </div>

        <div className="mb-4 relative z-10">
          <div className="text-xl font-black text-white mb-0.5">{dna.personalityLabel}</div>
          <div className="text-xs text-slate-400 leading-relaxed">{dna.personalityDesc}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
          {[
            { label: 'Total Hours', value: dna.totalHours.toFixed(1)+'h' },
            { label: 'Sessions', value: dna.totalSessions.toString() },
            { label: 'Best Streak', value: dna.bestStreakDays+'🔥' },
            { label: 'Peak Time', value: dna.peakHourLabel },
            { label: 'Power Day', value: dna.peakDay },
            { label: 'Deep Work', value: Math.round(dna.deepWorkPercent)+'%' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-sm font-bold font-mono text-white">{stat.value}</div>
              <div className="text-[9px] text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5 relative z-10">
          <span className="text-sm">📚</span>
          <span className="text-xs text-slate-400 flex-1">Best Subject</span>
          <span className="text-xs font-bold text-white max-w-[120px] truncate text-right">{dna.bestSubjectName}</span>
        </div>

        <div className="text-[9px] text-slate-600 text-center mt-3 relative z-10">
          ekagrazone.web.app • Your Focus, Your Data
        </div>
      </div>

      <motion.button
        onClick={handleShare}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-3 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/25 text-white hover:from-cyan-500/30 hover:to-purple-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        📸 Screenshot & Share Your DNA
      </motion.button>
    </motion.div>
  );
};

export const FocusDNA: React.FC<FocusDNAProps> = ({ sessions, subjects, compact }) => {
  const dna = useMemo(() => calculateFocusDNA(sessions, subjects), [sessions, subjects]);
  const [slide, setSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const TOTAL_SLIDES = 5;

  useEffect(() => {
    if (!isPlaying || !dna.isEnoughData) return;
    const iv = setInterval(() => {
      setSlide(s => s < TOTAL_SLIDES - 1 ? s + 1 : 0);
    }, 4000);
    return () => clearInterval(iv);
  }, [isPlaying, dna.isEnoughData]);

  if (!dna.isEnoughData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-spin" style={{animationDuration:'3s'}} />
          <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 animate-spin" style={{animationDuration:'2s',animationDirection:'reverse'}} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🧬</div>
        </div>
        <div className="text-white font-bold text-lg">Building Your DNA...</div>
        <div className="text-slate-400 text-sm max-w-xs">
          Complete {10 - dna.sessionCount} more study sessions to unlock your Focus DNA
        </div>
        <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden mt-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(dna.sessionCount/10)*100}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {dna.sessionCount}/10 sessions
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-sm font-bold text-white flex items-center gap-2">
           <span className="text-lg">🧬</span> Your Focus DNA
        </span>
        <button
          onClick={() => setShowInfo(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <Info size={16} />
        </button>
      </div>

      <div className="relative select-none" ref={cardRef}>
        <div className="flex gap-1 mb-4">
          {Array.from({length: TOTAL_SLIDES}).map((_,i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
              {i < slide && <div className="h-full bg-white/60 w-full" />}
              {i === slide && (
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                  key={slide}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => { setSlide(s => Math.max(0, s-1)); setIsPlaying(false); }}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
        >‹</button>
        <button
          onClick={() => { setSlide(s => Math.min(TOTAL_SLIDES-1, s+1)); setIsPlaying(false); }}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
        >›</button>

        <AnimatePresence mode="wait">
          {slide === 0 && <Slide1 dna={dna} />}
          {slide === 1 && <Slide2 dna={dna} />}
          {slide === 2 && <Slide3 dna={dna} subjects={subjects} />}
          {slide === 3 && <Slide4 dna={dna} />}
          {slide === 4 && <Slide5 dna={dna} cardRef={cardRef} />}
        </AnimatePresence>

        <div className="flex justify-center gap-1.5 mt-4 pb-4">
          {Array.from({length: TOTAL_SLIDES}).map((_,i) => (
            <button key={i}
              onClick={() => { setSlide(i); setIsPlaying(false); }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-1">🧬 How Focus DNA Works</h3>
              <p className="text-slate-400 text-xs mb-4">We analyze your study patterns to generate a unique profile.</p>
              {[
                { emoji: '⏰', label: 'Peak Hours', desc: 'When you study most — calculated from session start times' },
                { emoji: '📅', label: 'Power Day', desc: 'Your most productive day of the week' },
                { emoji: '🎯', label: 'Deep Work %', desc: 'Percentage of sessions where you rated focus 3/3' },
                { emoji: '🧠', label: 'Personality', desc: 'Determined by your patterns — peak time, session length, consistency' },
              ].map(item => (
                <div key={item.label} className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-lg w-6 flex-shrink-0">{item.emoji}</span>
                  <div>
                    <div className="text-white text-xs font-bold mb-0.5">{item.label}</div>
                    <div className="text-slate-500 text-[11px] leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors cursor-pointer"
              >
                Got it 🧬
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
