
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStopwatch } from '@root/hooks/useStopwatch';
import { DEFAULT_SUBJECTS, TimerDurations, DEFAULT_DURATIONS, StudySession, Subject } from '../types';
import { useGlobalContext } from './GlobalContext';
import { useAuth } from './AuthContext';
import { rtdb } from '@root/services/firebase';
import { ref, set, onDisconnect, serverTimestamp, onValue } from 'firebase/database';

interface TimerContextType {
    elapsedMs: number;
    status: 'idle' | 'running' | 'paused';
    mode: string;
    isOvertime: boolean;
    currentSubjectId: string;
    setSubjectId: (id: string) => void;
    setMode: (mode: any) => void;
    start: () => void;
    pause: () => void;
    stop: () => Promise<StudySession | null>;
    handleStartRequest: () => void;
    handleStopRequest: () => Promise<void>;
    timerDurations: TimerDurations;
    setTimerDurations: (durations: TimerDurations) => void;
    currentSubject: Subject;
    currentSubjectTodayTotal: number;
    isTimerMode: boolean;
    targetDuration: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const PresenceManager = () => {
    const { status, currentSubjectId, elapsedMs } = useTimer();
    const { currentUser, isAuthorized } = useAuth();
    const { subjects, dailyTotalMs } = useGlobalContext();
    
    useEffect(() => {
        if (!currentUser || !isAuthorized) return;

        const publicStatusRef = ref(rtdb, `users/${currentUser.uid}/publicStatus`);
        const connectedRef = ref(rtdb, '.info/connected');
        
        const elapsedRef = { current: elapsedMs };

        const updatePresence = () => {
            const subjectName = subjects.find(s => s.id === currentSubjectId)?.name || "Focusing";
            
            set(publicStatusRef, { 
                isOnline: true,
                lastSeen: serverTimestamp(),
                isFocusing: status === 'running',
                currentTask: status === 'running' ? subjectName : null,
                todayBaseMs: dailyTotalMs,
                currentSessionStart: status === 'running' ? Date.now() - elapsedRef.current : null
            });
        };

        const unsubscribe = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                onDisconnect(publicStatusRef).update({ 
                    isOnline: false,
                    isFocusing: false,
                    lastSeen: serverTimestamp()
                });
                updatePresence();
            }
        });

        updatePresence();

        const interval = setInterval(() => {
            elapsedRef.current = elapsedMs; 
            updatePresence();
        }, 60000); 

        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [currentUser, status, dailyTotalMs, currentSubjectId, subjects, isAuthorized]); 

    return null;
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { handleSessionComplete, subjects, todaySessions, enableZenMode, wallpaper, isZenActive, setShowZenPrompt, setSessionToSave } = useGlobalContext();
    const [timerDurations, setTimerDurations] = useState<TimerDurations>(DEFAULT_DURATIONS);
    
    const { 
        elapsedMs, status, mode, isOvertime, currentSubjectId, setSubjectId, setMode, start, pause, stop 
    } = useStopwatch(subjects[0]?.id || DEFAULT_SUBJECTS[0].id, handleSessionComplete, timerDurations);

    const handleStartRequest = useCallback(() => {
        if (enableZenMode && wallpaper && status === 'idle' && !isZenActive) {
            setShowZenPrompt(true);
        } else {
            start();
        }
    }, [enableZenMode, wallpaper, status, isZenActive, start, setShowZenPrompt]);

    const handleStopRequest = useCallback(async () => {
        const session = await stop();
        if (session) {
            setSessionToSave(session);
        }
    }, [stop, setSessionToSave]);

    const currentSubject = useMemo(() => subjects.find(s => s.id === currentSubjectId) || subjects[0] || DEFAULT_SUBJECTS[0], [subjects, currentSubjectId]);

    const currentSubjectTodayTotal = useMemo(() => {
        return todaySessions.filter(s => s.subjectId === currentSubjectId).reduce((acc, curr) => acc + curr.durationMs, 0);
    }, [todaySessions, currentSubjectId]);

    const isTimerMode = mode !== 'stopwatch';
    const targetDuration = isTimerMode ? (timerDurations[mode as keyof typeof timerDurations] || 25) * 60 * 1000 : 0;
    const isTimerComplete = isTimerMode && elapsedMs >= targetDuration;
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (status === 'running' && isTimerComplete && !notifiedRef.current) {
            notifiedRef.current = true;
            
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});

            if ('Notification' in window && Notification.permission === 'granted') {
               new Notification("Timer Complete!", {
                   body: mode === 'pomodoro' ? "Focus session done. Time for a break!" : "Break is over. Back to focus!",
                   icon: "/favicon.ico"
               });
            }
        }
        
        if (status === 'idle') {
            notifiedRef.current = false;
        }
    }, [status, isTimerComplete, mode]);

    const value = useMemo(() => ({
        elapsedMs, status, mode, isOvertime, currentSubjectId, setSubjectId, setMode, start, pause, stop,
        handleStartRequest, handleStopRequest,
        timerDurations, setTimerDurations,
        currentSubject, currentSubjectTodayTotal, isTimerMode, targetDuration
    }), [elapsedMs, status, mode, isOvertime, currentSubjectId, setSubjectId, setMode, start, pause, stop, handleStartRequest, handleStopRequest, timerDurations, currentSubject, currentSubjectTodayTotal, isTimerMode, targetDuration]);

    return (
        <TimerContext.Provider value={value}>
            <PresenceManager />
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};
