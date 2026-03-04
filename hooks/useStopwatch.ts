
import { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveTimerState, TimerStatus, TimerMode, getLocalDateString } from '../src/types';
import { saveActiveState, loadActiveState, clearActiveState, calculateElapsed } from '../services/timerState';
import { dbService } from '../services/db';

interface UseStopwatchReturn {
  elapsedMs: number;
  status: TimerStatus;
  mode: TimerMode;
  isOvertime: boolean;
  currentSubjectId: string;
  setSubjectId: (id: string) => void;
  setMode: (mode: TimerMode) => void;
  start: () => void;
  pause: () => void;
  stop: () => Promise<any>;
  reset: () => void;
}

export const useStopwatch = (
  initialSubjectId: string, 
  onSessionComplete: () => void,
  durations: any
): UseStopwatchReturn => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [mode, setModeState] = useState<TimerMode>('stopwatch');
  const [currentSubjectId, setCurrentSubjectId] = useState(initialSubjectId);
  const [isOvertime, setIsOvertime] = useState(false);
  
  const intervalRef = useRef<number | null>(null);

  // Load state on mount
  useEffect(() => {
    const savedState = loadActiveState();
    if (savedState) {
      setStatus(savedState.status);
      setCurrentSubjectId(savedState.subjectId);
      setModeState(savedState.mode || 'stopwatch');
      setElapsedMs(calculateElapsed(savedState));
    }
  }, []);

  // Timer Tick Loop (using setInterval for background persistence)
  useEffect(() => {
    if (status === 'running') {
      const tick = () => {
        const savedState = loadActiveState();
        if (savedState && savedState.status === 'running') {
            const currentElapsed = calculateElapsed(savedState);
            setElapsedMs(currentElapsed);

            // Overtime detection
            if (savedState.mode === 'pomodoro') {
                const target = (durations[savedState.mode] || 25) * 60 * 1000;
                if (currentElapsed >= target) {
                    setIsOvertime(true);
                } else {
                    setIsOvertime(false);
                }
            } else {
                setIsOvertime(false);
            }
        }
      };
      
      // 100ms interval for responsive UI, throttles to 1s in background tabs
      intervalRef.current = window.setInterval(tick, 100); 
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (status === 'idle') {
          setIsOvertime(false);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, durations]);

  const start = useCallback(() => {
    const now = Date.now();
    const perfNow = performance.now(); // Uptime Tick for Anti-Cheat

    const newState: ActiveTimerState = {
      status: 'running',
      mode,
      subjectId: currentSubjectId,
      startTime: now,
      startPerfTime: perfNow,
      accumulatedTime: elapsedMs,
    };
    saveActiveState(newState);
    setStatus('running');
  }, [currentSubjectId, elapsedMs, mode]);

  const pause = useCallback(() => {
    // When pausing, we calculate the total time up to now and store it as accumulated
    // We clear startTime because there is no active "running" segment
    const currentTotal = calculateElapsed(loadActiveState());
    
    const newState: ActiveTimerState = {
      status: 'paused',
      mode,
      subjectId: currentSubjectId,
      startTime: null,
      startPerfTime: null, // Clear uptime tracking during pause
      accumulatedTime: currentTotal,
    };
    saveActiveState(newState);
    setElapsedMs(currentTotal);
    setStatus('paused');
  }, [currentSubjectId, mode]);

  const reset = useCallback(() => {
    clearActiveState();
    setStatus('idle');
    setElapsedMs(0);
  }, []);

  const stop = useCallback(async () => {
    const savedState = loadActiveState();
    if (!savedState) {
        reset();
        return null;
    }

    // 1. Calculate actual duration (Timestamp Logic)
    const currentSegment = savedState.startTime ? Date.now() - savedState.startTime : 0;
    const finalTime = savedState.accumulatedTime + currentSegment;

    // 2. Anti-Cheat: Uptime Check
    if (savedState.status === 'running' && savedState.startTime && savedState.startPerfTime) {
        const wallDiff = Date.now() - savedState.startTime;
        const perfDiff = performance.now() - savedState.startPerfTime;
        
        if (perfDiff > 0) {
            const threshold = 2000 + (wallDiff * 0.01);
            if (Math.abs(wallDiff - perfDiff) > threshold) {
                alert('Invalid session: Clock manipulation detected. XP denied.');
                reset();
                return null;
            }
        }
    }
    
    // 3. Prepare Session Data (Don't save yet, return for modal)
    let session = null;
    if (finalTime > 1000) {
      session = {
        id: crypto.randomUUID(),
        subjectId: currentSubjectId,
        startTime: Date.now() - finalTime, 
        endTime: Date.now(),
        durationMs: finalTime,
        dateString: getLocalDateString(),
      };
    }

    reset();
    return session;
  }, [currentSubjectId, reset]);

  const setSubjectId = useCallback((id: string) => {
    if (status === 'idle') {
      setCurrentSubjectId(id);
    } else {
      const currentState = loadActiveState();
      if (currentState) {
        currentState.subjectId = id;
        saveActiveState(currentState);
      }
      setCurrentSubjectId(id);
    }
  }, [status]);

  const setMode = useCallback((newMode: TimerMode) => {
      if (status !== 'idle') return; // Only allow changing mode when idle
      setModeState(newMode);
  }, [status]);

  return {
    elapsedMs,
    status,
    mode,
    isOvertime,
    currentSubjectId,
    setSubjectId,
    setMode,
    start,
    pause,
    stop,
    reset
  };
};
