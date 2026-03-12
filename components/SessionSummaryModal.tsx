
import React, { useState } from 'react';
import { StudySession, Subject, isHexColor } from '../types';
import { Clock, BookOpen, Save, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionSummaryModalProps {
  session: StudySession;
  subjects: Subject[];
  onSave: (updatedSession: StudySession) => void;
  onCancel: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  subjects,
  onSave,
  onCancel
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(session.subjectId);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusScore, setFocusScore] = useState<1 | 2 | 3>(2);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const activeSubjects = subjects.filter(s => !s.isArchived);

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${totalMinutes}m ${seconds}s`;
  };

  const handleSave = () => {
    onSave({
      ...session,
      subjectId: selectedSubjectId,
      focusScore
    });
    window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: "Session saved. Great work!", state: "Happy" } }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Session Summary</h2>
            <p className="text-slate-400 text-sm mt-1">Review your focus session before saving.</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Time Card */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Time</p>
              <p className="text-2xl font-mono font-bold text-white">{formatDuration(session.durationMs)}</p>
            </div>
          </div>

          {/* Subject Picker Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Subject</label>
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${isHexColor(currentSubject.color) ? '' : currentSubject.color}`}
                    style={isHexColor(currentSubject.color) ? { backgroundColor: currentSubject.color } : {}}
                  />
                  <span className="font-semibold text-white">{currentSubject.name}</span>
                </div>
                <ChevronDown size={18} className={`text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                  >
                    {activeSubjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => {
                          setSelectedSubjectId(subject.id);
                          setShowDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left ${selectedSubjectId === subject.id ? 'bg-white/10' : ''}`}
                      >
                        <div 
                          className={`w-2 h-2 rounded-full ${isHexColor(subject.color) ? '' : subject.color}`}
                          style={isHexColor(subject.color) ? { backgroundColor: subject.color } : {}}
                        />
                        <span className={`text-sm font-medium ${selectedSubjectId === subject.id ? 'text-white' : 'text-slate-400'}`}>
                          {subject.name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* Focus Reflection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">How was your focus?</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { score: 1, emoji: '😫', label: 'Struggled' },
                { score: 2, emoji: '😐', label: 'Okay' },
                { score: 3, emoji: '🔥', label: 'Deep Work' }
              ].map((item) => (
                <button
                  key={item.score}
                  onClick={() => setFocusScore(item.score as 1 | 2 | 3)}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all
                    ${focusScore === item.score 
                      ? 'bg-white/10 border-white/20 shadow-lg scale-105' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 opacity-60 hover:opacity-100'}
                  `}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className={`text-[10px] font-bold uppercase ${focusScore === item.score ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="mt-10 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all border border-white/5"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Session
          </button>
        </div>
      </motion.div>
    </div>
  );
};
