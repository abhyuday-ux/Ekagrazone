
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStopwatch } from '../../hooks/useStopwatch';
import { useAuth } from './AuthContext';
import { dbService } from '../../services/db';
import { useSound } from './SoundContext';
import { usePerformance } from './PerformanceContext';
import { useTheme } from './ThemeContext';
import { StudySession, Subject, DEFAULT_SUBJECTS, Task, Exam, TimerDurations, DEFAULT_DURATIONS, getLocalDateString } from '../types';
import { rtdb, db } from '../../services/firebase';
import { ref, set, onDisconnect, serverTimestamp, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';

interface GlobalContextType {
  subjects: Subject[];
  allSessions: StudySession[];
  tasks: Task[];
  exams: Exam[];
  targetHours: number;
  dayStartHour: number;
  isOnline: boolean;
  isSyncing: boolean;
  usernameNeeded: boolean;
  isAuthorized: boolean;
  isVerifying: boolean;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  unreadCount: number;
  levelUpData: { show: boolean; level: number };
  setLevelUpData: (data: { show: boolean; level: number }) => void;
  sessionToSave: StudySession | null;
  setSessionToSave: (session: StudySession | null) => void;
  wallpaper: string;
  showWallpaperOnHome: boolean;
  enableZenMode: boolean;
  isZenActive: boolean;
  setIsZenActive: (active: boolean) => void;
  showZenPrompt: boolean;
  setShowZenPrompt: (show: boolean) => void;
  isSpaceMode: boolean;
  setIsSpaceMode: (active: boolean) => void;
  spaceVideoUrl: string;
  isLogoSpinning: boolean;
  triggerLogoSpin: () => void;
  showPricing: boolean;
  setShowPricing: (show: boolean) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isSubjectManagerOpen: boolean;
  setIsSubjectManagerOpen: (open: boolean) => void;
  confirmModal: { type: 'today' | 'all'; title: string; message: string; } | null;
  setConfirmModal: (modal: { type: 'today' | 'all'; title: string; message: string; } | null) => void;
  isSidePanelCollapsed: boolean;
  setIsSidePanelCollapsed: (collapsed: boolean) => void;
  sidePanelTab: 'goals' | 'exams';
  setSidePanelTab: (tab: 'goals' | 'exams') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dailyTotalMs: number;
  handleZenResponse: (shouldEnter: boolean) => void;
  handleSessionSave: (updatedSession: StudySession) => Promise<void>;
  handleSessionComplete: () => void;
  handleTargetHoursChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDayStartHourChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleZenToggle: () => void;
  handleWallpaperChange: (url: string) => void;
  handleShowWallpaperToggle: () => void;
  handleAccentChange: (newAccent: string) => void;
  handleSync: () => Promise<void>;
  handleExport: () => Promise<void>;
  requestClearToday: () => void;
  requestClearAll: () => void;
  executeClear: () => Promise<void>;
  refreshSubjects: () => Promise<void>;
  loadSessions: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadExams: () => Promise<void>;
  handleDeleteExam: (id: string) => Promise<void>;
  todaySessions: StudySession[];
  todaysTasks: Task[];
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isGuest } = useAuth(); 
  const { setAccent } = useTheme();

  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [targetHours, setTargetHours] = useState(6);
  const [dayStartHour, setDayStartHour] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [usernameNeeded, setUsernameNeeded] = useState(false);
  
  // Whitelist & Auth State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // UI State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Level Up State
  const [levelUpData, setLevelUpData] = useState<{ show: boolean; level: number }>({ show: false, level: 1 });

  // Session Summary Modal State
  const [sessionToSave, setSessionToSave] = useState<StudySession | null>(null);

  // Timer Config
  const [timerDurations, setTimerDurations] = useState<TimerDurations>(DEFAULT_DURATIONS);
  
  // Wallpaper / Zen State
  const [wallpaper, setWallpaper] = useState<string>('');
  const [showWallpaperOnHome, setShowWallpaperOnHome] = useState(false);
  const [enableZenMode, setEnableZenMode] = useState(false);
  const [isZenActive, setIsZenActive] = useState(false);
  const [showZenPrompt, setShowZenPrompt] = useState(false);

  // Space Mode State
  const [isSpaceMode, setIsSpaceMode] = useState(false);
  const [spaceVideoUrl, setSpaceVideoUrl] = useState('https://www.youtube.com/watch?v=xRPjKQtRKT8');

  // Animation State
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ type: 'today' | 'all'; title: string; message: string; } | null>(null);
  
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState<'goals' | 'exams'>('goals');

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());

  // Derived Stats for RTDB
  const dailyTotalMs = useMemo(() => {
      const today = getLocalDateString();
      return allSessions.filter(s => s.dateString === today).reduce((acc, curr) => acc + curr.durationMs, 0);
  }, [allSessions]);

  // --- WHITELIST VERIFICATION EFFECT ---
  useEffect(() => {
      if (!currentUser) {
          setIsAuthorized(false);
          setIsVerifying(false);
          return;
      }

      const verifyUser = async () => {
          setIsVerifying(true);
          try {
              const email = currentUser.email?.toLowerCase() || '';
              // Verify against Firestore collection
              const docRef = doc(db, 'authorized_users', email);
              const docSnap = await getDoc(docRef);
              const exists = docSnap.exists();
              
              console.log('VIP Status:', exists);
              setIsAuthorized(exists);
          } catch (error) {
              console.error("Verification error:", error);
              setIsAuthorized(false); // Default to deny on error for security
          } finally {
              setIsVerifying(false);
          }
      };

      verifyUser();
  }, [currentUser]);

  const refreshSubjects = async () => {
      const storedSubjects = await dbService.getSubjects();
      setSubjects(storedSubjects.length ? storedSubjects : DEFAULT_SUBJECTS);
  };

  const loadSessions = async () => {
    const sessions = await dbService.getAllSessions();
    setAllSessions(sessions);
  };

  const loadTasks = async () => {
      const allTasks = await dbService.getTasks();
      setTasks(allTasks);
  };

  const loadExams = async () => {
      const allExams = await dbService.getExams();
      setExams(Array.isArray(allExams) ? allExams : []);
  };

  // Init Data Effect
  useEffect(() => {
    // Only init data if we are authorized OR a guest
    const canAccess = (currentUser && isAuthorized) || isGuest;
    if (!canAccess) return;

    const initData = async () => {
      try {
        await refreshSubjects();
        loadSessions();
        loadTasks();
        loadExams();
        
        // Load Daily Goal
        const profile = await dbService.getUserProfile();
        if (profile?.dailyGoal) {
            setTargetHours(profile.dailyGoal);
        } else {
            const localGoal = localStorage.getItem('ekagrazone_targetHours');
            if (localGoal) setTargetHours(parseFloat(localGoal));
        }

        const savedDurations = localStorage.getItem('ekagrazone_timer_durations');
        if (savedDurations) {
            try {
                setTimerDurations(JSON.parse(savedDurations));
            } catch (e) {
                console.error("Failed to parse saved durations");
            }
        }

        const savedWallpaper = localStorage.getItem('ekagrazone_wallpaper');
        if (savedWallpaper) setWallpaper(savedWallpaper);
        
        const savedShowHome = localStorage.getItem('ekagrazone_wallpaper_home');
        if (savedShowHome) setShowWallpaperOnHome(savedShowHome === 'true');

        const savedZenEnabled = localStorage.getItem('ekagrazone_enableZenMode');
        if (savedZenEnabled) setEnableZenMode(savedZenEnabled === 'true');
        
        const savedDayStartHour = localStorage.getItem('ekagrazone_dayStartHour');
        if (savedDayStartHour) setDayStartHour(parseInt(savedDayStartHour));
        
        const oldZenUrl = localStorage.getItem('ekagrazone_zenWallpaperUrl');
        if (oldZenUrl && !savedWallpaper) {
            setWallpaper(oldZenUrl);
            localStorage.setItem('ekagrazone_wallpaper', oldZenUrl);
        }

        // --- Social Profile Init ---
        if (currentUser) {
            // Check username presence
            const profile = await dbService.getUserProfile();
            if (!profile || !profile.username) {
                setUsernameNeeded(true);
            }
            
            // Update profile metadata asynchronously
            dbService.updateProfileMeta(currentUser.displayName || 'User', currentUser.email || '', currentUser.photoURL || null);
        }

      } catch (e) {
        console.error("Failed to initialize DB", e);
      }
    };
    initData();

    const handleSyncComplete = () => {
        initData();
        setIsSyncing(false);
    };
    window.addEventListener('ekagrazone_sync_complete', handleSyncComplete);

    const handleLevelUp = (e: CustomEvent) => {
        setLevelUpData({ show: true, level: e.detail.level });
    };
    // Cast to EventListener to satisfy TS with CustomEvent
    window.addEventListener('ekagra_levelup', handleLevelUp as EventListener);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      window.removeEventListener('ekagrazone_sync_complete', handleSyncComplete);
      window.removeEventListener('ekagra_levelup', handleLevelUp as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, isAuthorized, isGuest]); // Depend on authorization state

  // Unread Notification Listener
  useEffect(() => {
      if (!currentUser || !isAuthorized) return;
      const notifRef = ref(rtdb, `users/${currentUser.uid}/notifications`);
      return onValue(notifRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const count = Object.values(data).filter((n: any) => !n.read).length;
              setUnreadCount(count);
          } else {
              setUnreadCount(0);
          }
      });
  }, [currentUser, isAuthorized]);

  // Sync local data when user signs in
  useEffect(() => {
    if (currentUser && !isGuest) {
      dbService.syncLocalToCloud().then(() => {
          console.log("Synced local data to cloud");
          refreshSubjects();
          loadSessions();
          loadTasks();
          loadExams();
      }).catch(err => console.error("Sync failed", err));
    }
  }, [currentUser, isGuest]);

  const handleDeleteExam = async (id: string) => {
      if(confirm("Delete this exam?")) {
          await dbService.deleteExam(id);
          loadExams();
      }
  };

  const handleSessionComplete = useCallback(() => {
    loadSessions();
  }, []);

  const handleUpdateDurations = useCallback((newDurations: TimerDurations) => {
      setTimerDurations(newDurations);
      localStorage.setItem('ekagrazone_timer_durations', JSON.stringify(newDurations));
      dbService.syncSettingsToCloud().catch(console.error);
  }, []);

  const handleTargetHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setTargetHours(val);
      localStorage.setItem('ekagrazone_targetHours', val.toString());
      dbService.updateDailyGoal(val).catch(console.error);
      dbService.syncSettingsToCloud().catch(console.error);
  }, []);

  const handleDayStartHourChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = parseInt(e.target.value);
      setDayStartHour(val);
      localStorage.setItem('ekagrazone_dayStartHour', val.toString());
      dbService.syncSettingsToCloud().catch(console.error);
  }, []);

  const handleZenToggle = useCallback(() => {
      const newState = !enableZenMode;
      setEnableZenMode(newState);
      localStorage.setItem('ekagrazone_enableZenMode', String(newState));
      dbService.syncSettingsToCloud().catch(console.error);
  }, [enableZenMode]);

  const handleWallpaperChange = useCallback((url: string) => {
      setWallpaper(url);
      localStorage.setItem('ekagrazone_wallpaper', url);
      dbService.syncSettingsToCloud().catch(console.error);
  }, []);

  const handleShowWallpaperToggle = useCallback(() => {
      const newVal = !showWallpaperOnHome;
      setShowWallpaperOnHome(newVal);
      localStorage.setItem('ekagrazone_wallpaper_home', String(newVal));
      dbService.syncSettingsToCloud().catch(console.error);
  }, [showWallpaperOnHome]);

  const handleAccentChange = useCallback((newAccent: string) => {
      setAccent(newAccent as any);
      setTimeout(() => dbService.syncSettingsToCloud().catch(console.error), 100);
  }, [setAccent]);

  const handleSync = useCallback(async () => {
    if (!isOnline || isGuest) return;
    setIsSyncing(true);
    await dbService.pullFromFirestore();
    await loadSessions();
    await loadTasks();
    await loadExams();
    await refreshSubjects();
    setTimeout(() => { setIsSyncing(false); }, 800);
  }, [isOnline, isGuest]);

  const handleExport = async () => {
    const dbData = await dbService.createBackup();
    const localData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ekagrazone_'))) {
            localData[key] = localStorage.getItem(key);
        }
    }
    const backup = { version: 1, date: new Date().toISOString(), db: dbData, local: localData };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ekagrazone_backup_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const requestClearToday = () => {
    setConfirmModal({
        type: 'today',
        title: "Clear Today's Progress?",
        message: "This will permanently delete all study sessions, completed tasks, and journal entries for today. This syncs to the cloud and cannot be undone."
    });
  };

  const requestClearAll = () => {
      setConfirmModal({
          type: 'all',
          title: "⚠️ ARE YOU ABSOLUTELY SURE?",
          message: "This action is permanent. You will lose your Rank, your XP will be wiped from the Global Leaderboard, and your focus history will vanish forever."
      });
  };

  const executeClear = async () => {
      if (!confirmModal) return;

      if (confirmModal.type === 'today') {
          const today = getLocalDateString();
          await dbService.deleteSessionsByDate(today);
          await dbService.deleteGoalsByDate(today); // Legacy
          await dbService.deleteTasksByDate(today);
          await dbService.deleteJournalByDate(today);
          await loadSessions();
          await loadTasks();
      } else if (confirmModal.type === 'all') {
          await dbService.factoryReset();
          localStorage.clear();
          window.location.reload();
      }

      setConfirmModal(null);
  };

  const triggerLogoSpin = () => {
      if (isLogoSpinning) return;
      setIsLogoSpinning(true);
      setTimeout(() => setIsLogoSpinning(false), 700);
  };

  const handleSessionSave = async (updatedSession: StudySession) => {
    const { levelUp, newLevel } = await dbService.saveSession(updatedSession);
    if (levelUp) {
        const event = new CustomEvent('ekagra_levelup', { 
            detail: { level: newLevel } 
        });
        window.dispatchEvent(event);
    }
    setSessionToSave(null);
    handleSessionComplete();
  };

  const todaySessions = useMemo(() => allSessions.filter(s => s.dateString === getLocalDateString()), [allSessions]);

  const todaysTasks = useMemo(() => {
      const today = getLocalDateString();
      return tasks.filter(t => t.dateString === today);
  }, [tasks]);

  const handleZenResponse = (shouldEnter: boolean) => {
      setShowZenPrompt(false);
      if (shouldEnter) setIsZenActive(true);
  };

  const value = useMemo(() => ({
    subjects, allSessions, tasks, exams, targetHours, dayStartHour, isOnline, isSyncing, usernameNeeded,
    isAuthorized, isVerifying, isNotificationOpen, setIsNotificationOpen, unreadCount,
    levelUpData, setLevelUpData, sessionToSave, setSessionToSave,
    wallpaper, showWallpaperOnHome, enableZenMode, isZenActive, setIsZenActive, showZenPrompt, setShowZenPrompt,
    isSpaceMode, setIsSpaceMode, spaceVideoUrl, isLogoSpinning, triggerLogoSpin, showPricing, setShowPricing,
    isDrawerOpen, setIsDrawerOpen, isSubjectManagerOpen, setIsSubjectManagerOpen, confirmModal, setConfirmModal,
    isSidePanelCollapsed, setIsSidePanelCollapsed, sidePanelTab, setSidePanelTab, selectedDate, setSelectedDate,
    dailyTotalMs, handleZenResponse, handleSessionSave, handleSessionComplete,
    handleTargetHoursChange, handleDayStartHourChange, handleZenToggle, handleWallpaperChange,
    handleShowWallpaperToggle, handleAccentChange, handleSync, handleExport, requestClearToday, requestClearAll,
    executeClear, refreshSubjects, loadSessions, loadTasks, loadExams, handleDeleteExam,
    todaySessions, todaysTasks
  }), [
    subjects, allSessions, tasks, exams, targetHours, dayStartHour, isOnline, isSyncing, usernameNeeded,
    isAuthorized, isVerifying, isNotificationOpen, unreadCount, levelUpData, sessionToSave,
    wallpaper, showWallpaperOnHome, enableZenMode, isZenActive, showZenPrompt, isSpaceMode,
    spaceVideoUrl, isLogoSpinning, showPricing, isDrawerOpen, isSubjectManagerOpen, confirmModal,
    isSidePanelCollapsed, sidePanelTab, selectedDate, dailyTotalMs, handleZenResponse,
    handleSessionSave, handleSessionComplete, handleTargetHoursChange, handleDayStartHourChange,
    handleZenToggle, handleWallpaperChange, handleShowWallpaperToggle, handleAccentChange,
    handleSync, handleExport, requestClearToday, requestClearAll, executeClear,
    refreshSubjects, loadSessions, loadTasks, loadExams, handleDeleteExam, todaySessions,
    todaysTasks
  ]);

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};
