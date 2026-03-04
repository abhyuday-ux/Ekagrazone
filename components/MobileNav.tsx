
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Timer, BarChart3, CalendarDays, Settings, BookOpen, Repeat, Home, Users, GraduationCap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

import { MobileTab } from '../types';

interface MobileNavProps {
  activeTab?: MobileTab;
}

export const MobileNav = React.memo<MobileNavProps>(({ activeTab }) => {
  const { accent } = useTheme();
  const tabs: { id: MobileTab; label: string; icon: React.FC<any>; path: string }[] = [
    { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
    { id: 'timer', label: 'Focus', icon: Timer, path: '/focus' },
    { id: 'timeline', label: 'Stats', icon: BarChart3, path: '/stats' },
    { id: 'exams', label: 'Exams', icon: GraduationCap, path: '/exams' },
    { id: 'social', label: 'Social', icon: Users, path: '/social' },
    { id: 'habits', label: 'Habits', icon: Repeat, path: '/habits' },
    { id: 'journal', label: 'Journal', icon: BookOpen, path: '/journal' },
    { id: 'calendar', label: 'Plan', icon: CalendarDays, path: '/plan' },
    { id: 'settings', label: 'Manage', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex-none bg-slate-900 border-t border-slate-800 pb-safe z-50 overflow-x-auto no-scrollbar w-full">
      <div className="flex items-center h-16 px-4 gap-6 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={`flex flex-col items-center justify-center w-auto h-full gap-1 transition-colors px-2 py-1 min-w-[3.5rem]
                ${isActive ? `text-${accent}-400` : 'text-slate-500 hover:text-slate-400'}
              `}
              style={isActive ? { color: `var(--color-${accent}-400)` } : {}}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
});
