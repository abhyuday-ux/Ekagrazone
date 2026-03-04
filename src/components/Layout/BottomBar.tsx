
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Timer, BarChart3, GraduationCap, Repeat, BookOpen, CalendarDays, Users, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const BottomBar: React.FC = () => {
  const { accent } = useTheme();

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
    { id: 'timer', label: 'Focus', icon: Timer, path: '/timer' },
    { id: 'timeline', label: 'Stats', icon: BarChart3, path: '/stats' },
    { id: 'exams', label: 'Exams', icon: GraduationCap, path: '/exams' },
    { id: 'habits', label: 'Habits', icon: Repeat, path: '/habits' },
    { id: 'journal', label: 'Journal', icon: BookOpen, path: '/journal' },
    { id: 'calendar', label: 'Plan', icon: CalendarDays, path: '/plan' },
    { id: 'social', label: 'Arena', icon: Users, path: '/leaderboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <nav className="flex-none bg-slate-900/90 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex justify-between items-center relative z-50 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px]
              ${isActive ? `text-${accent}-400` : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            {({ isActive }) => (
                <>
                    <div className={`p-1.5 rounded-lg transition-all ${isActive ? `bg-${accent}-500/20` : ''}`}>
                        <Icon size={20} className={isActive ? 'scale-110' : ''} />
                    </div>
                    <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
