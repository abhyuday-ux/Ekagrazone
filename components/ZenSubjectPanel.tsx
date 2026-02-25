import React, { useState } from 'react';
import { Subject, isHexColor } from '../types';
import { ChevronRight, ChevronLeft, BookOpen, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ZenSubjectPanelProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubject: (id: string) => void;
  isTimerRunning: boolean;
  className?: string;
}

export const ZenSubjectPanel: React.FC<ZenSubjectPanelProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  isTimerRunning,
  className = "relative z-50 mb-4 flex justify-center"
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed in the timer panel
  
  const activeSubjects = subjects.filter(s => !s.isArchived);
  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const isHex = isHexColor(currentSubject.color);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.button
            key="collapsed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsCollapsed(false)}
            className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 shadow-xl hover:bg-white/20 transition-all flex items-center gap-3 group"
          >
            <div 
              className={`w-2 h-2 rounded-full ${!isHex ? currentSubject.color : ''} shadow-[0_0_8px_currentColor]`}
              style={isHex ? { backgroundColor: currentSubject.color, boxShadow: `0 0 8px ${currentSubject.color}` } : {}}
            />
            <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">
              {currentSubject.name}
            </span>
            <BookOpen size={14} className="text-white/40 group-hover:text-white transition-colors" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl w-64 max-h-[300px] flex flex-col absolute bottom-full mb-4"
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={14} /> Subjects
              </span>
              <button 
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
                title="Minimize"
              >
                <Minimize2 size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {activeSubjects.map(subject => {
                const isSelected = subject.id === selectedSubjectId;
                const subIsHex = isHexColor(subject.color);
                
                return (
                  <button
                    key={subject.id}
                    onClick={() => onSelectSubject(subject.id)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group relative overflow-hidden
                      ${isSelected ? 'bg-white/10 border border-white/10 shadow-lg' : 'hover:bg-white/5 border border-transparent'}
                    `}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="active-subject-glow"
                        className={`absolute inset-0 opacity-20 ${!subIsHex ? subject.color.replace('text-', 'bg-') : ''}`}
                        style={subIsHex ? { backgroundColor: subject.color } : {}}
                      />
                    )}
                    
                    <div 
                      className={`
                        w-2 h-8 rounded-full flex-none transition-all shadow-[0_0_8px_currentColor]
                        ${!subIsHex ? subject.color : ''}
                      `}
                      style={subIsHex ? { backgroundColor: subject.color, boxShadow: `0 0 8px ${subject.color}` } : {}}
                    />
                    
                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      {subject.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
