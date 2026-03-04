import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DailyTimeline } from './DailyTimeline';
import { StudySession, Subject } from '../types';

interface MobileDrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  todaySessions: StudySession[];
  subjects: Subject[];
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isDrawerOpen,
  setIsDrawerOpen,
  todaySessions,
  subjects
}) => {
  return (
    <div className={`fixed bottom-16 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300 ease-out z-40 flex flex-col ${isDrawerOpen ? 'h-[70vh]' : 'h-12'}`}>
       <button 
         onClick={() => setIsDrawerOpen(!isDrawerOpen)}
         className="w-full flex justify-center items-center h-12 flex-none text-slate-400 hover:text-white"
       >
         {isDrawerOpen ? <ChevronDown size={20} /> : <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><ChevronUp size={16} /> Timeline</div>}
       </button>
       <div className="flex-1 overflow-y-auto px-4 pb-4">
          <DailyTimeline sessions={todaySessions} subjects={subjects} className="h-full min-h-[500px]" />
       </div>
    </div>
  );
};
