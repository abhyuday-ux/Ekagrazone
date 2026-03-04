import React, { useEffect } from 'react';
import { useTimer, useTimerTime } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { rtdb } from '../services/firebase';
import { ref, set, onDisconnect, serverTimestamp, onValue } from 'firebase/database';
import { Subject } from '../types';

interface LiveStatusSyncProps {
    subjects: Subject[];
    dailyTotalMs: number;
}

export const LiveStatusSync: React.FC<LiveStatusSyncProps> = ({ subjects, dailyTotalMs }) => {
    const { currentUser } = useAuth();
    const { status, currentSubjectId } = useTimer();
    const { elapsedMs } = useTimerTime();

    useEffect(() => {
        if (!currentUser) return;
  
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
  
        // Initial update
        updatePresence();
  
        // Periodic update
        const interval = setInterval(() => {
            elapsedRef.current = elapsedMs; 
            updatePresence();
        }, 60000); 
  
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [currentUser, status, dailyTotalMs, currentSubjectId, subjects]); // elapsedMs is intentionally omitted from deps to avoid spam, but used in ref

    return null;
};
