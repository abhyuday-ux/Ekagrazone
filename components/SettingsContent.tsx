import React from 'react';
import { 
  Palette, Settings, Target, Clock, Zap, ToggleRight, ToggleLeft, 
  Image as ImageIcon, BookOpen, ChevronRight, Database, RefreshCw, 
  HardDrive, Download, AlertCircle, Trash2, AlertTriangle, LogOut, LogIn, Layout 
} from 'lucide-react';
import { ACCENT_COLORS } from '../contexts/ThemeContext';
import { WALLPAPERS } from '../constants';
import { ChallengeSettings } from './ChallengeSettings';

interface SettingsContentProps {
  currentUser: any;
  isGuest: boolean;
  displayName: string;
  logout: () => void;
  signInWithGoogle: () => void;
  accent: string;
  handleAccentChange: (id: string) => void;
  graphicsQuality: string;
  setGraphicsQuality: (q: string) => void;
  targetHours: number;
  handleTargetHoursChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dayStartHour: number;
  handleDayStartHourChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  enableZenMode: boolean;
  handleZenToggle: () => void;
  showWallpaperOnHome: boolean;
  handleShowWallpaperToggle: () => void;
  wallpaper: string;
  handleWallpaperChange: (url: string) => void;
  setIsSubjectManagerOpen: (open: boolean) => void;
  isSyncing: boolean;
  isOnline: boolean;
  handleSync: () => void;
  handleExport: () => void;
  requestClearToday: () => void;
  requestClearAll: () => void;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  currentUser,
  isGuest,
  displayName,
  logout,
  signInWithGoogle,
  accent,
  handleAccentChange,
  graphicsQuality,
  setGraphicsQuality,
  targetHours,
  handleTargetHoursChange,
  dayStartHour,
  handleDayStartHourChange,
  enableZenMode,
  handleZenToggle,
  showWallpaperOnHome,
  handleShowWallpaperToggle,
  wallpaper,
  handleWallpaperChange,
  setIsSubjectManagerOpen,
  isSyncing,
  isOnline,
  handleSync,
  handleExport,
  requestClearToday,
  requestClearAll
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
        {/* Profile Card */}
        <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
             
             <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                 {currentUser?.photoURL && currentUser.photoURL.trim() !== '' ? (
                     <img src={currentUser.photoURL} className="w-20 h-20 rounded-2xl border-2 border-white/10 shadow-lg object-cover" alt="Profile" />
                 ) : (
                     <div className={`w-20 h-20 rounded-2xl bg-${accent}-500/20 flex items-center justify-center text-${accent}-400 font-bold text-3xl shadow-inner border border-white/5`}>
                        {displayName[0]?.toUpperCase()}
                     </div>
                 )}
                 <div>
                     <h3 className="text-2xl font-bold text-white mb-1">{displayName}</h3>
                     <p className="text-sm text-slate-400 font-medium">{currentUser?.email || (isGuest ? 'Syncing Disabled (Guest Mode)' : 'Synced Account')}</p>
                 </div>
             </div>
             
             <div className="relative z-10 w-full md:w-auto flex flex-col md:flex-row gap-3 justify-start md:justify-end">
                {isGuest ? (
                    <>
                        <button onClick={logout} className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all border border-white/5 font-semibold text-sm flex items-center justify-center gap-2">
                            <LogOut size={18} /> Exit Guest Mode
                        </button>
                        <button onClick={signInWithGoogle} className={`w-full md:w-auto px-6 py-3 bg-${accent}-500 text-white hover:bg-${accent}-600 rounded-xl transition-all shadow-lg shadow-${accent}-500/20 font-bold text-sm flex items-center justify-center gap-2`}>
                            <LogIn size={18} /> Sign In to Sync
                        </button>
                    </>
                ) : (
                    <button onClick={logout} className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all border border-white/5 font-semibold text-sm flex items-center justify-center gap-2">
                        <LogOut size={18} /> Sign Out
                    </button>
                )}
             </div>
        </div>

        {/* ... Rest of Settings (unchanged) ... */}
        <ChallengeSettings />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Appearance */}
            <div className="space-y-8 h-full">
                <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 space-y-6 h-full">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className={`p-2.5 bg-${accent}-500/20 rounded-xl text-${accent}-400`}><Palette size={20} /></div>
                        <span className="font-bold text-lg text-slate-200">Appearance</span>
                    </div>
                    
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Accent Color</p>
                        <div className="grid grid-cols-6 gap-3">
                            {ACCENT_COLORS.map(color => (
                                <button
                                    key={color.id}
                                    onClick={() => handleAccentChange(color.id)}
                                    className={`relative aspect-square rounded-full transition-all flex items-center justify-center ${color.colorClass} ${accent === color.id ? 'ring-4 ring-white/20 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Performance</p>
                            <div className="flex bg-slate-800 p-1 rounded-lg border border-white/5">
                                <button 
                                    onClick={() => setGraphicsQuality('Low')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${graphicsQuality === 'Low' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Low
                                </button>
                                <button 
                                    onClick={() => setGraphicsQuality('High')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${graphicsQuality === 'High' ? `bg-${accent}-500/20 text-${accent}-400 shadow-sm` : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    High
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-4">
                            Low quality disables animations, blur effects, and complex backgrounds to save battery.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wallpaper</p>
                            <button onClick={handleShowWallpaperToggle} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${showWallpaperOnHome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
                                <Layout size={12} /> {showWallpaperOnHome ? 'Shown on Dash' : 'Hidden on Dash'}
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {WALLPAPERS.map(wp => (
                                <button key={wp.id} onClick={() => handleWallpaperChange(wp.url)} className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${wallpaper === wp.url ? `border-${accent}-500 ring-2 ring-${accent}-500/50` : 'border-transparent hover:border-white/20'}`}>
                                    <img src={wp.url} alt={wp.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    {wallpaper === wp.url && <div className={`absolute inset-0 bg-${accent}-500/20`} />}
                                </button>
                            ))}
                        </div>
                        <input type="text" value={wallpaper} onChange={(e) => handleWallpaperChange(e.target.value)} placeholder="Custom Image URL..." className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-slate-600"/>
                    </div>
                </div>
            </div>

            {/* Column 2: Config & Data */}
            <div className="space-y-8 h-full flex flex-col">
                <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 flex-1">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                        <div className={`p-2.5 bg-${accent}-500/20 rounded-xl text-${accent}-400`}><Settings size={20} /></div>
                        <span className="font-bold text-lg text-slate-200">Configuration</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 bg-${accent}-500/10 rounded-xl text-${accent}-400`}><Target size={20} /></div>
                                <div>
                                    <span className="font-semibold text-slate-200 block">Daily Study Goal</span>
                                    <span className="text-xs text-slate-500">Target hours per day</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-1 border border-white/10">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="24" 
                                    step="0.5"
                                    value={targetHours} 
                                    onChange={handleTargetHoursChange}
                                    className="w-16 bg-transparent text-center font-bold text-white focus:outline-none text-sm"
                                />
                                <span className="text-xs text-slate-500 pr-2 font-bold">HRS</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 bg-${accent}-500/10 rounded-xl text-${accent}-400`}><Clock size={20} /></div>
                                <div>
                                    <span className="font-semibold text-slate-200 block">Day Start Time</span>
                                    <span className="text-xs text-slate-500">When does your new day begin?</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-1 border border-white/10">
                                <select 
                                    value={dayStartHour} 
                                    onChange={handleDayStartHourChange}
                                    className="bg-transparent text-center font-bold text-white focus:outline-none text-sm p-1"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i} className="bg-slate-800">
                                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 bg-${accent}-500/10 rounded-xl text-${accent}-400`}><Zap size={20} /></div>
                                <div>
                                    <span className="font-semibold text-slate-200 block">Graphics Quality</span>
                                    <span className="text-xs text-slate-500">Low Spec Mode (No Glow/Anim)</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setGraphicsQuality(graphicsQuality === 'High' ? 'Low' : 'High')} 
                                className={`transition-colors flex items-center gap-2 ${graphicsQuality === 'High' ? `text-${accent}-400` : 'text-slate-600 hover:text-slate-400'}`}
                            >
                                <span className="text-xs font-bold uppercase">{graphicsQuality}</span>
                                {graphicsQuality === 'High' ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 bg-${accent}-500/10 rounded-xl text-${accent}-400`}><ImageIcon size={20} /></div>
                                <div>
                                    <span className="font-semibold text-slate-200 block">Zen Mode</span>
                                    <span className="text-xs text-slate-500">Immersive timer background</span>
                                </div>
                            </div>
                            <button onClick={handleZenToggle} className={`transition-colors ${enableZenMode ? `text-${accent}-400` : 'text-slate-600 hover:text-slate-400'}`}>
                                {enableZenMode ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                            </button>
                        </div>

                        <button onClick={() => setIsSubjectManagerOpen(true)} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 bg-${accent}-500/10 rounded-xl text-${accent}-400 group-hover:bg-${accent}-500/20 transition-colors`}><BookOpen size={20} /></div>
                                <div>
                                    <span className="font-semibold text-slate-200 block text-left">Manage Subjects</span>
                                    <span className="text-xs text-slate-500 block text-left">Edit names and colors</span>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 flex-1">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                        <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400"><Database size={20} /></div>
                        <span className="font-bold text-lg text-slate-200">Data & Sync</span>
                    </div>
                    <div className="flex gap-3">
                        {!isGuest ? (
                            <button onClick={handleSync} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 hover:bg-emerald-600/20 font-bold transition-colors">
                                <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} /> 
                                <span className="text-xs">Force Sync</span>
                            </button>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-slate-800 text-slate-500 font-bold border border-white/5 cursor-not-allowed">
                                <HardDrive size={20} /> 
                                <span className="text-xs">Local Only</span>
                            </div>
                        )}
                        <button onClick={handleExport} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors border border-white/10">
                            <Download size={20} /> 
                            <span className="text-xs">Backup Data</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 mt-4 hover:bg-red-500/10 transition-colors">
            <div className="flex items-center gap-2 mb-6 text-red-400">
                <AlertCircle size={20} />
                <h3 className="font-bold uppercase tracking-wider text-xs">Danger Zone</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={requestClearToday} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 transition-all group text-left">
                    <div>
                        <span className="block font-semibold text-slate-200 group-hover:text-red-200 text-sm">Clear Today's Data</span>
                        <span className="text-[10px] text-slate-500">Resets sessions & tasks for today only.</span>
                    </div>
                    <Trash2 size={18} className="text-slate-600 group-hover:text-red-400" />
                </button>
                <button onClick={requestClearAll} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 transition-all group text-left">
                    <div>
                        <span className="block font-bold text-red-300 group-hover:text-white transition-colors text-sm">Factory Reset</span>
                        <span className="text-[10px] text-slate-500">Wipes ALL data from cloud & local.</span>
                    </div>
                    <AlertTriangle size={18} className="text-red-500" />
                </button>
            </div>
        </div>
    </div>
  );
};
