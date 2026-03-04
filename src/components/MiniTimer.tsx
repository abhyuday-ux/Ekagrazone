
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Hourglass, Play, Pause } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Subject, isHexColor } from '../types';
import { useTimer } from '../contexts/TimerContext';
import { useGlobalContext } from '../contexts/GlobalContext';
import { useTheme } from '../contexts/ThemeContext';

// Helper
const formatMiniTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
};

export const MiniTimer: React.FC = React.memo(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const { isZenActive, isSpaceMode } = useGlobalContext();
    const { accent } = useTheme();
    const { 
        status, targetDuration, elapsedMs, isTimerMode, currentSubject, 
        pause, handleStartRequest 
    } = useTimer();

    const onToggle = status === 'running' ? pause : handleStartRequest;
    
    // Hide if idle, or if on timer page (assuming /timer route), or zen/space active
    const isVisible = !(status === 'idle' || pathname === '/timer' || isZenActive || isSpaceMode);
    
    const remainingMs = Math.max(0, targetDuration - elapsedMs);
    const displayTime = isTimerMode ? remainingMs : elapsedMs;
    const progress = isTimerMode ? (elapsedMs / targetDuration) * 100 : 0;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 z-50 cursor-pointer"
                    onClick={() => navigate('/timer')}
                >
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between relative overflow-hidden group">
                        {/* Progress Bar Background */}
                        {isTimerMode && (
                            <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
                                <div 
                                    className={`h-full bg-${accent}-500 transition-all duration-300 ease-linear`} 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${accent}-500/20 text-${accent}-400`}>
                                {isTimerMode ? <Hourglass size={20} /> : <Timer size={20} />}
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    {currentSubject.name}
                                    <div className={`w-1.5 h-1.5 rounded-full ${isHexColor(currentSubject.color) ? '' : currentSubject.color}`} style={isHexColor(currentSubject.color) ? {backgroundColor: currentSubject.color} : {}} />
                                </div>
                                <div className="text-xl font-mono font-bold text-white leading-none mt-0.5 tabular-nums">
                                    {formatMiniTime(displayTime)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                {status === 'running' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
