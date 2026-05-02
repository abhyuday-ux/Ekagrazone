
import React, { useState, useEffect } from 'react';
import { Timer, BarChart3, CalendarDays, Settings, BookOpen, Repeat, Home, Users, GraduationCap, Library, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export type MobileTab = 'dashboard' | 'timer' | 'timeline' | 'calendar' | 'exams' | 'settings' | 'journal' | 'habits' | 'social' | 'syllabus';

interface MobileNavProps {
  activeTab: MobileTab;
  setTab: (tab: MobileTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setTab }) => {
  const { accent } = useTheme();
  const [showMore, setShowMore] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'timeline', label: 'Stats', icon: BarChart3 },
    { id: 'timer', label: 'Focus', icon: Timer }, // center
    { id: 'calendar', label: 'Plan', icon: CalendarDays },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ] as const;

  const moreTabs = [
    { id: 'syllabus', label: 'Syllabus', icon: Library },
    { id: 'exams', label: 'Exams', icon: GraduationCap },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'habits', label: 'Habits', icon: Repeat },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'settings', label: 'Manage', icon: Settings },
  ] as const;

  useEffect(() => {
    const handleClickOutside = () => setShowMore(false);
    if (showMore) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 100);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMore]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
      {/* More drawer — slides up when open */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl shadow-black/50 grid grid-cols-4 gap-2"
          >
            {moreTabs.map(tab => (
              <button key={tab.id}
                onClick={() => { setTab(tab.id as MobileTab); setShowMore(false); }}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === tab.id ? `bg-${accent}-500/20 text-${accent}-300` : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <tab.icon size={20} />
                <span className="text-[9px] font-semibold whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating pill */}
      <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl shadow-black/40">
        {mainTabs.map((tab, i) => {
          const isActive = activeTab === tab.id;
          const isCenter = tab.id === 'timer';
          const Icon = tab.icon;
          
          if (isCenter) return (
            <button key={tab.id}
              onClick={() => { setTab(tab.id as MobileTab); setShowMore(false); }}
              className={`relative w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-300 mx-1 ${isActive ? `bg-${accent}-500 shadow-lg shadow-${accent}-500/40 scale-110` : `bg-${accent}-500/20 hover:bg-${accent}-500/30`}`}
            >
              <Icon size={22} className={isActive ? 'text-white' : `text-${accent}-400`} />
              {isActive && (
                <span className="text-[8px] font-bold text-white/80">
                  {tab.label}
                </span>
              )}
            </button>
          );
          
          if (tab.id === 'more') return (
            <button key="more"
              onClick={() => setShowMore(s => !s)}
              className={`relative w-12 h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all ${showMore ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <MoreHorizontal size={20} />
              <span className="text-[8px] font-semibold">More</span>
              {moreTabs.some(t => t.id === activeTab) && (
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-${accent}-400`} />
              )}
            </button>
          );

          return (
            <button key={tab.id}
              onClick={() => { setTab(tab.id as MobileTab); setShowMore(false); }}
              className={`relative w-12 h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="navPill"
                  className="absolute inset-0 rounded-full bg-white/10"
                  transition={{type:'spring', bounce:0.3}}
                />
              )}
              <Icon size={18} className="relative z-10" />
              <span className="text-[8px] font-semibold relative z-10 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
