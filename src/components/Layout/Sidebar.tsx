
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Timer, BarChart3, GraduationCap, Repeat, BookOpen, CalendarDays, Users, Settings, Volume2, VolumeX } from 'lucide-react';
import { EkagraLogo } from '../EkagraLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { useGlobalContext } from '../../contexts/GlobalContext';
import { useSound } from '../../contexts/SoundContext';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { accent } = useTheme();
  const { isLogoSpinning, triggerLogoSpin } = useGlobalContext();
  const { isPlaying, currentSound, togglePlay } = useSound();
  const { currentUser } = useAuth();
  const displayName = currentUser?.displayName || "Guest User";

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
    <nav className="flex flex-col w-20 xl:w-64 flex-none py-6 h-full max-h-screen relative z-50">
       <div className="flex xl:justify-start justify-center px-4 mb-8 flex-none">
           <div className="flex items-center gap-3 cursor-pointer select-none" onClick={triggerLogoSpin}>
              <EkagraLogo 
                  className={`w-10 h-10 text-${accent}-500 shadow-lg shadow-${accent}-500/20 flex-none transition-transform`}
                  style={{ animation: isLogoSpinning ? 'spin 0.7s ease-in-out' : 'none' }}
              />
              <h1 className="hidden xl:block font-bold text-lg tracking-tight text-white">EKAGRAZONE</h1>
           </div>
       </div>
       
       <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar px-3">
          {tabs.map((tab) => {
              const Icon = tab.icon;
              
              return (
              <NavLink
                  key={tab.id}
                  to={tab.path}
                  className={({ isActive }) => `
                      w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group relative
                      ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/10'}
                      ${!isActive && 'hover:translate-x-1'}
                  `}
              >
                  {({ isActive }) => (
                      <>
                          {isActive && (
                              <motion.div 
                                  layoutId="sidebar-active"
                                  className={`absolute left-0 w-1 h-6 bg-${accent}-500 rounded-r-full shadow-[0_0_12px_rgba(var(--color-${accent}-500),0.6)]`}
                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                          )}
                          <div className="flex justify-center xl:w-6 flex-none">
                              <Icon size={20} className={`transition-transform duration-300 ${isActive ? `scale-110 text-${accent}-400` : 'group-hover:scale-110'}`} />
                          </div>
                          <span className="hidden xl:block text-sm font-medium tracking-wide opacity-90">{tab.label}</span>
                      </>
                  )}
              </NavLink>
              )
          })}
       </div>

       <div className="flex-none mt-auto pt-4 border-t border-white/5 px-4 xl:px-6">
           {/* Music Player Mini */}
           {isPlaying && (
               <div className="mb-4 bg-slate-900/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between shadow-lg">
                   <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-lg bg-${accent}-500/20 text-${accent}-400 animate-pulse`}>
                           <Volume2 size={14} />
                       </div>
                       <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-white uppercase">{currentSound}</span>
                           <span className="text-[9px] text-slate-500">Now Playing</span>
                       </div>
                   </div>
                   <button onClick={togglePlay} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                       <VolumeX size={14} />
                   </button>
               </div>
           )}

           <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
               {currentUser?.photoURL && currentUser.photoURL.trim() !== '' ? (
                   <img src={currentUser.photoURL} className="w-8 h-8 rounded-lg border border-white/10" alt="Profile" />
               ) : (
                   <div className={`w-8 h-8 rounded-lg bg-${accent}-500/20 flex items-center justify-center text-${accent}-400 font-bold text-xs`}>{displayName?.[0]?.toUpperCase() || '?'}</div>
               )}
               <div className="hidden xl:block overflow-hidden">
                   <p className="text-xs font-bold text-white truncate">{displayName}</p>
                   <p className="text-[10px] text-slate-500 truncate group-hover:text-slate-400 transition-colors">Free Plan</p>
               </div>
           </div>
           <div className="mt-4 hidden xl:block px-2 text-center">
              <p className="text-[10px] text-slate-600 font-mono font-medium tracking-wide">Made by Abhyuday</p>
           </div>
       </div>
    </nav>
  );
};
