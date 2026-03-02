
import React, { useMemo, useState } from 'react';
import { StudySession, getLocalDateString } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface YearlyHeatmapProps {
  sessions: StudySession[];
}

export const YearlyHeatmap: React.FC<YearlyHeatmapProps> = ({ sessions }) => {
  const { accent } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Group sessions by date
  const sessionMap = useMemo(() => {
      const map: Record<string, number> = {};
      sessions.forEach(s => {
          map[s.dateString] = (map[s.dateString] || 0) + s.durationMs;
      });
      return map;
  }, [sessions]);

  // 2. Generate Months Data
  const monthsData = useMemo(() => {
      const months = [];
      const today = new Date();
      
      // We'll show the last 12 months
      for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthName = monthDate.toLocaleString('default', { month: 'long' });
          const year = monthDate.getFullYear();
          
          // Get all days in this month
          const daysInMonth = new Date(year, monthDate.getMonth() + 1, 0).getDate();
          const days = [];
          
          for (let d = 1; d <= daysInMonth; d++) {
              const date = new Date(year, monthDate.getMonth(), d);
              days.push(date);
          }
          
          months.push({ name: monthName, year, days });
      }
      return months;
  }, []);

  const getIntensity = (ms: number) => {
      const hours = ms / 3600000;
      if (hours === 0) return 0;
      if (hours < 2) return 1;
      if (hours < 5) return 2;
      return 3;
  };

  const getLevelColor = (level: number) => {
      if (level === 0) return 'bg-slate-800/30';
      if (level === 1) return `bg-${accent}-500/30`;
      if (level === 2) return `bg-${accent}-500/60`;
      return `bg-${accent}-500`;
  };

  // On mobile, if not expanded, only show the current month (the last one)
  // On desktop, we want to show all months regardless of the toggle state
  const visibleMonths = monthsData.map((month, index) => {
      const isLastMonth = index === monthsData.length - 1;
      return {
          ...month,
          // This month should be hidden on mobile if not expanded and not the last month
          isHiddenMobile: !isExpanded && !isLastMonth
      };
  });

  return (
    <div className="flex flex-col gap-6 w-full">
        {/* Mobile Toggle Header - Hidden on Desktop */}
        <div className="flex justify-between items-center md:hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">History</h3>
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-1.5 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-all border border-white/5`}
            >
                {isExpanded ? (
                    <>Show Less <ChevronUp size={14} /></>
                ) : (
                    <>Full Year <ChevronDown size={14} /></>
                )}
            </button>
        </div>

        {/* Desktop Header - Hidden on Mobile */}
        <div className="hidden md:flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Annual Consistency
            </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleMonths.map((month, mIndex) => (
                <motion.div 
                    key={`${month.name}-${month.year}`}
                    initial={month.isHiddenMobile ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
                    animate={month.isHiddenMobile ? { 
                        opacity: 0, 
                        height: 0,
                        display: 'none',
                        transition: { display: { delay: 0.2 } }
                    } : { 
                        opacity: 1, 
                        height: 'auto',
                        display: 'flex'
                    }}
                    // On desktop (md:), we override the display:none with md:flex
                    className={`bg-white/5 border border-white/5 rounded-2xl p-4 flex-col gap-3 md:!flex md:!opacity-100 md:!h-auto ${month.isHiddenMobile ? 'hidden' : 'flex'}`}
                >
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white">{month.name}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">{month.year}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                        {month.days.map((date) => {
                            const dateStr = getLocalDateString(date);
                            const ms = sessionMap[dateStr] || 0;
                            const level = getIntensity(ms);
                            const hours = (ms / 3600000).toFixed(1);
                            const isFuture = date > new Date();

                            return (
                                <div 
                                    key={dateStr}
                                    className={`
                                        w-3.5 h-3.5 rounded-[3px] relative group/cell transition-all duration-300
                                        ${isFuture ? 'bg-slate-800/10' : getLevelColor(level)}
                                    `}
                                >
                                     {/* Tooltip */}
                                     {!isFuture && (
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50 min-w-[max-content] bg-slate-900 border border-white/10 px-2 py-1 rounded-md shadow-2xl text-center pointer-events-none transform scale-100 origin-bottom">
                                            <div className="text-[10px] font-bold text-white whitespace-nowrap">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</div>
                                            <div className={`text-[9px] text-${accent}-400 font-mono font-bold`}>{ms ? `${hours}h focused` : 'No focus'}</div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                                        </div>
                                     )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-medium pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-[2px] bg-slate-800/30" />
                    <div className={`w-3 h-3 rounded-[2px] bg-${accent}-500/30`} />
                    <div className={`w-3 h-3 rounded-[2px] bg-${accent}-500/60`} />
                    <div className={`w-3 h-3 rounded-[2px] bg-${accent}-500`} />
                </div>
                <span>More</span>
            </div>
        </div>
    </div>
  );
};
