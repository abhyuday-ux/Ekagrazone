
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Timer, BarChart3, GraduationCap, Repeat, 
    BookOpen, CalendarDays, Users, Settings, 
    Bell, LogIn, Wifi, WifiOff, RefreshCw, X,
    Volume2, VolumeX, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useGlobalContext } from '../../contexts/GlobalContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSound } from '../../contexts/SoundContext';
import { EkagraLogo } from '@/components/EkagraLogo';
import { MobileNav } from '../MobileNav';
import { MiniTimer } from '../MiniTimer';
import { PricingPage } from '../PricingPage';
import { SubjectManager } from '../SubjectManager';
import { SessionSummaryModal } from '../SessionSummaryModal';
import { LevelUpModal } from '../LevelUpModal';

// Local Header Component for Mobile
const Header = () => {
    const { accent } = useTheme();
    const { isLogoSpinning, triggerLogoSpin } = useGlobalContext();
    return (
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2" onClick={triggerLogoSpin}>
                <EkagraLogo 
                    className={`w-8 h-8 text-${accent}-500 transition-transform`}
                    style={{ animation: isLogoSpinning ? 'spin 0.7s ease-in-out' : 'none' }}
                />
                <h1 className="font-bold text-lg tracking-tight text-white">EKAGRA</h1>
            </div>
            <div className="flex gap-3">
                <button className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <Bell size={18} className="text-slate-400" />
                </button>
            </div>
        </div>
    );
};

const HeaderAd = ({ onClick }: { onClick: () => void }) => (
    <div className="mx-4 mb-4 p-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={onClick}>
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <GraduationCap size={16} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Premium Upgrade</p>
                <p className="text-xs text-white font-medium">Unlock all focus features</p>
            </div>
        </div>
        <X size={14} className="text-slate-500" />
    </div>
);


export const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { 
        isZenActive, isSpaceMode, showPricing, setShowPricing,
        isNotificationOpen, setIsNotificationOpen, unreadCount,
        isOnline, isSyncing, handleSync,
        isSubjectManagerOpen, setIsSubjectManagerOpen, subjects, refreshSubjects,
        sessionToSave, handleSessionSave, setSessionToSave,
        levelUpData, setLevelUpData
    } = useGlobalContext();

    const { currentUser, isGuest, hasPremium, signInWithGoogle } = useAuth();
    const { accent } = useTheme();
    const { isPlaying, currentSound, togglePlay } = useSound();
    const { isLogoSpinning, triggerLogoSpin } = useGlobalContext();

    const displayName = currentUser?.displayName || (isGuest ? "Guest User" : "User");

    const DesktopSidebar = () => {
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
                        const isActive = location.pathname.includes(tab.path);
                        
                        return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={`
                                w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group relative
                                ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/10'}
                                ${!isActive && 'hover:translate-x-1'}
                            `}
                        >
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
                        </button>
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

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-cyan-600/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-purple-600/5 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            {/* Modals & Overlays */}
            {isSubjectManagerOpen && (
                <SubjectManager />
            )}

            <AnimatePresence>
                {sessionToSave && (
                    <SessionSummaryModal />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {levelUpData.show && (
                    <LevelUpModal />
                )}
            </AnimatePresence>

            {/* --- Mobile Layout (< md) --- */}
            <div className={`md:hidden flex flex-col h-[100dvh] relative z-10 ${isZenActive || isSpaceMode ? 'hidden' : ''}`}>
                {!hasPremium && <HeaderAd onClick={() => setShowPricing(true)} />}
                <div className="flex-none px-4 pt-4 transition-all">
                    <Header />
                </div>
                
                <main className="flex-1 relative overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex flex-col h-full overflow-hidden"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
                
                <MobileNav />
            </div>

            {/* --- Desktop Layout (>= md) --- */}
            <div className={`hidden md:flex h-screen w-full max-w-[1920px] mx-auto p-4 gap-4 relative z-10 ${isZenActive || isSpaceMode ? 'hidden' : ''}`}>
                <DesktopSidebar />

                {/* Main Glass Panel */}
                <main 
                    className={`
                        flex-1 bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-row transition-all duration-500
                        ring-1 ring-white/5
                        ${location.pathname.includes('/plan') ? 'p-0 rounded-[2rem]' : 'p-8 rounded-[2.5rem]'}
                    `}
                >
                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {!hasPremium && <HeaderAd onClick={() => setShowPricing(true)} />}
                        {/* Top Bar inside glass */}
                        {!location.pathname.includes('/plan') && (
                            <div className="flex justify-between items-center mb-6 flex-none z-30 relative transition-opacity">
                                <motion.h2 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={location.pathname}
                                    className="text-3xl font-bold text-white tracking-tight flex items-center gap-3"
                                >
                                {location.pathname.includes('/dashboard') && 'Dashboard'}
                                {location.pathname.includes('/timer') && 'Focus Zone'}
                                {location.pathname.includes('/stats') && 'Analytics'}
                                {location.pathname.includes('/exams') && 'Exam Tracker'}
                                {location.pathname.includes('/journal') && 'Daily Journal'}
                                {location.pathname.includes('/habits') && 'Habit Forge'}
                                {location.pathname.includes('/leaderboard') && 'Social Hub'}
                                {location.pathname.includes('/settings') && 'Preferences'}
                                {location.pathname.includes('/dashboard') && <span className="text-sm font-normal text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>}
                                </motion.h2>
                                <div className="flex gap-4 items-center">
                                    <button onClick={() => setIsNotificationOpen(true)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative">
                                        <Bell size={20} className="text-slate-300" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900" />
                                        )}
                                    </button>

                                    {isGuest ? (
                                        <button 
                                            onClick={signInWithGoogle}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/50 border border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                                        >
                                            <LogIn size={14} /> Sign In to Sync
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleSync}
                                            disabled={!isOnline || isSyncing}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                                        >
                                            {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                                            <span className="">{isSyncing ? 'Syncing...' : isOnline ? 'Connected' : 'Offline'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 relative overflow-hidden flex flex-col">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full flex flex-col"
                                >
                                    <Outlet />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>

            <MiniTimer />

            {/* Pricing Modal Overlay */}
            <AnimatePresence>
                {showPricing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-slate-950 overflow-y-auto"
                    >
                        <button 
                            onClick={() => setShowPricing(false)} 
                            className="fixed top-6 right-6 z-[10000] p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-white/10"
                        >
                            <X size={24} />
                        </button>
                        <PricingPage />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
