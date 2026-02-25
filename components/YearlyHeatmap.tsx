
import React, { useMemo } from 'react';
import { StudySession } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

interface YearlyHeatmapProps {
  sessions: StudySession[];
}

export const YearlyHeatmap: React.FC<YearlyHeatmapProps> = ({ sessions }) => {
  const { accent } = useTheme();

  // 1. Group sessions by date
  const sessionMap = useMemo(() => {
      const map: Record<string, number> = {};
      sessions.forEach(s => {
          map[s.dateString] = (map[s.dateString] || 0) + s.durationMs;
      });
      return map;
  }, [sessions]);

  // 2. Generate Days for the last 365 days
  const weeks = useMemo(() => {
      const result = [];
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - 364); // Last 365 days
      
      // Adjust to start on the nearest Sunday to keep the grid aligned
      const startDay = startDate.getDay();
      startDate.setDate(startDate.getDate() - startDay);

      let currentDay = new Date(startDate);
      
      // We want roughly 53 weeks
      for (let w = 0; w < 53; w++) {
          const week = [];
          for (let d = 0; d < 7; d++) {
              week.push(new Date(currentDay));
              currentDay.setDate(currentDay.getDate() + 1);
          }
          result.push(week);
      }
      return result;
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

  return (
    <div className="min-w-[800px] py-2">
        <div className="flex gap-1">
            {/* Day Labels */}
            <div className="flex flex-col gap-1 pr-2 pt-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={day} className="h-3 text-[9px] text-slate-600 font-bold flex items-center">
                        {i % 2 === 0 ? day : ''}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
                {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1">
                        {/* Month Label (only show if it's the first week of the month) */}
                        <div className="h-5 text-[9px] text-slate-500 font-bold">
                            {wIndex > 0 && week[0].getMonth() !== weeks[wIndex-1][0].getMonth() ? 
                                week[0].toLocaleString('default', { month: 'short' }) : 
                                wIndex === 0 ? week[0].toLocaleString('default', { month: 'short' }) : ''
                            }
                        </div>
                        {week.map((date, dIndex) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const ms = sessionMap[dateStr] || 0;
                            const level = getIntensity(ms);
                            const hours = (ms / 3600000).toFixed(1);
                            const isFuture = date > new Date();

                            return (
                                <div 
                                    key={dateStr}
                                    className={`
                                        w-3 h-3 rounded-[2px] relative group/cell transition-all duration-300
                                        ${isFuture ? 'opacity-0 pointer-events-none' : getLevelColor(level)}
                                        ${level > 0 ? 'shadow-[0_0_5px_rgba(0,0,0,0.1)]' : ''}
                                    `}
                                >
                                     {/* Tooltip */}
                                     {!isFuture && (
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50 min-w-[max-content] bg-slate-900 border border-white/10 px-2 py-1 rounded-md shadow-2xl text-center pointer-events-none transform scale-100 origin-bottom">
                                            <div className="text-[10px] font-bold text-white whitespace-nowrap">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</div>
                                            <div className={`text-[9px] text-${accent}-400 font-mono font-bold`}>{ms ? `${hours}h focused` : 'No focus sessions'}</div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                                        </div>
                                     )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-500 font-medium px-2">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[2px] bg-slate-800/30" />
            <div className={`w-3 h-3 rounded-[2px] bg-${accent}-500/30`} />
            <div className={`w-3 h-3 rounded-[2px] bg-${accent}-500/60`} />
            <div className={`w-3 h-3 rounded-[2px] bg-${accent}-500`} />
            <span>More</span>
        </div>
    </div>
  );
};
