
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useStopwatch } from './hooks/useStopwatch';
import { SubjectPicker } from './components/SubjectPicker';
import { TimerDisplay } from './components/TimerDisplay';
import { HistoryList } from './components/HistoryList';
import { DailyTimeline } from './components/DailyTimeline';
import { GoalChecklist } from './components/GoalChecklist';
import { MobileNav, MobileTab } from './components/MobileNav';
import { SubjectManager } from './components/SubjectManager';
import { SubjectDonut } from './components/SubjectDonut';
import { JournalPage } from './components/JournalPage';
import { HabitsPage } from './components/HabitsPage';
import { Dashboard } from './components/Dashboard'; 
import { StatsPage } from './components/StatsPage'; 
import { PlanPage } from './components/PlanPage'; 
import { LoginPage } from './components/LoginPage'; 
import { MaintenanceMode } from './components/MaintenanceMode';
import { ExamList } from './components/ExamList';
import { SocialPanel } from './components/SocialPanel';
import { UsernameSetup } from './components/UsernameSetup';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { FriendObserver } from './components/FriendObserver';
import { NotificationCenter } from './components/NotificationCenter';
import { ChallengeSettings } from './components/ChallengeSettings';
import { ExamTracker } from './components/ExamTracker/ExamTracker';
import { SyllabusPage } from './components/SyllabusPage';
import { TutorialIntro } from './components/TutorialIntro';
import TutorialTooltip from './components/TutorialTooltip';
import { useTutorial } from './hooks/useTutorial';
import { StudyRoom } from './components/StudyRoom';
import { ProPreviewModal } from './components/ProPreviewModal';
import { UpgradePopup } from './components/UpgradePopup';
import { PricingPage } from './components/PricingPage';

import { EkagraLogo } from './components/EkagraLogo';
import { ZenSubjectPanel } from './components/ZenSubjectPanel';
import { useAuth } from './contexts/AuthContext'; 
import { dbService } from './services/db';
import { useSound } from './contexts/SoundContext';
import { usePerformance } from './contexts/PerformanceContext';
import { StudySession, Subject, DEFAULT_SUBJECTS, Task, Exam, isHexColor, TimerDurations, DEFAULT_DURATIONS, UserProfile, getLocalDateString, SyllabusSubject } from './types';
import { Zap, Wifi, WifiOff, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Settings, Timer, BarChart3, CalendarDays, Target, Trash2, AlertCircle, PanelLeftClose, PanelLeftOpen, CheckSquare, Palette, Image as ImageIcon, ToggleLeft, ToggleRight, Maximize2, X, BookOpen, Repeat, Home, Activity, AlertTriangle, Download, Upload, Database, Layout, Rocket, Globe, RotateCcw, LogOut, HardDrive, LogIn, GraduationCap, Volume2, VolumeX, Play, Pause, Hourglass, Users, Bell, Loader2, ShieldCheck, Lock, Clock, Library, HelpCircle } from 'lucide-react';
import { useTheme, ACCENT_COLORS } from './contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { rtdb, db } from './services/firebase';
import { ref, set, onDisconnect, serverTimestamp, onValue, update } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';

const LOCKED_TABS: MobileTab[] = ['syllabus', 'journal', 'habits', 'social', 'calendar', 'exams'];
const FREE_TABS: MobileTab[] = ['dashboard', 'timer', 'timeline', 'settings'];

// Helper function to extract YouTube video ID
const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const WALLPAPERS = [
  { id: 'mountains', label: 'Midnight Peaks', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80' },
  { id: 'forest', label: 'Misty Forest', url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2000&q=80' },
  { id: 'rain', label: 'City Rain', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=2000&q=80' },
  { id: 'space', label: 'Deep Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80' },
  { id: 'lofi', label: 'Lofi Room', url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=2000&q=80' },
  { id: 'abstract', label: 'Dark Abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2000&q=80' },
];

const formatMiniTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
};

interface MiniTimerProps {
    status: 'idle' | 'running' | 'paused';
    activeTab: MobileTab;
    isZenActive: boolean;
    isSpaceMode: boolean;
    targetDuration: number;
    elapsedMs: number;
    isTimerMode: boolean;
    accent: string;
    currentSubject: Subject;
    onToggle: () => void;
    onActivate: () => void;
}

const MiniTimer: React.FC<MiniTimerProps> = React.memo(({
    status, activeTab, isZenActive, isSpaceMode, targetDuration, elapsedMs, isTimerMode, accent, currentSubject, onToggle, onActivate
}) => {
    const isVisible = !(status === 'idle' || activeTab === 'timer' || isZenActive || isSpaceMode);
    
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
                    onClick={onActivate}
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

const tabMap: Record<string, MobileTab> = {
  '/home': 'dashboard',
  '/focus': 'timer',
  '/stats': 'timeline',
  '/exam': 'exams',
  '/habits': 'habits',
  '/journal': 'journal',
  '/plan': 'calendar',
  '/arena': 'social',
  '/settings': 'settings',
  '/syllabus': 'syllabus'
};

const reverseTabMap: Record<MobileTab, string> = {
  'dashboard': '/home',
  'timer': '/focus',
  'timeline': '/stats',
  'exams': '/exam',
  'habits': '/habits',
  'journal': '/journal',
  'calendar': '/plan',
  'social': '/arena',
  'settings': '/settings',
  'syllabus': '/syllabus'
};

const App: React.FC = () => {
  const { currentUser, isGuest, loading, logout, signInWithGoogle, hasPremium } = useAuth(); 
  const { isPlaying, currentSound, togglePlay } = useSound();
  const { graphicsQuality, setGraphicsQuality, isHighQuality } = usePerformance();

  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [syllabusSubjects, setSyllabusSubjects] = useState<SyllabusSubject[]>([]);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [targetHours, setTargetHours] = useState(6);
  const [dayStartHour, setDayStartHour] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [usernameNeeded, setUsernameNeeded] = useState(false);
  
  const [isVIP, setIsVIP] = useState(false);
  const [showProPreview, setShowProPreview] = useState<MobileTab | null>(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['dashboard']));
  const [sessionStartTime] = useState(Date.now());
  
  const isPro = hasPremium || isVIP;

  useEffect(() => {
    if (currentUser && !isGuest) {
      getDoc(doc(db, 'authorized_users', currentUser.uid))
        .then(d => setIsVIP(d.exists()))
        .catch(() => setIsVIP(false));
    }
  }, [currentUser, isGuest]);

  // UI State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
  // Fix 2 & 3: Orphaned Session and Auto-capped states
  const [orphanedSession, setOrphanedSession] = useState<{ durationMs: number; subjectId: string; show: boolean } | null>(null);
  const [cappedNotification, setCappedNotification] = useState(false);
  
  const [showStudyRoom, setShowStudyRoom] = useState(false);

  useEffect(() => {
    const handleOpenRoom = () => setShowStudyRoom(true);
    window.addEventListener('open_study_room', handleOpenRoom);
    return () => window.removeEventListener('open_study_room', handleOpenRoom);
  }, []);

  const { accent, setAccent } = useTheme();
  
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = tabMap[location.pathname] || 'dashboard';

  const {
    showIntro, isTooltipActive, currentTooltipConfig,
    currentTooltipStep, totalTooltipSteps,
    initTutorial, completeIntro, skipIntro,
    nextTooltip, skipTooltips, replayTutorial,
  } = useTutorial(activeTab);

  const setActiveTab = useCallback((tab: MobileTab) => {
    navigate(reverseTabMap[tab]);
  }, [navigate]);

  const handleTabChange = useCallback((tab: MobileTab) => {
    if (isPro) {
      setActiveTab(tab);
      return;
    }
    
    if (LOCKED_TABS.includes(tab)) {
      setShowProPreview(tab);
      return;
    }
    
    setActiveTab(tab);
    setVisitedTabs(prev => {
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [isPro, setActiveTab]);

  useEffect(() => {
    if (isPro || isGuest || !currentUser) return;
    
    const alreadyShown = localStorage.getItem('ekagra_upgrade_shown');
    if (alreadyShown) return;

    const tabsVisited = visitedTabs.size >= 4;
    const timeElapsed = Date.now() - sessionStartTime > 120000;
    
    if (tabsVisited || timeElapsed) {
      setShowUpgradePopup(true);
      localStorage.setItem('ekagra_upgrade_shown', 'true');
    }
  }, [visitedTabs, isPro, isGuest, currentUser, sessionStartTime]);

  useEffect(() => {
    if (isPro || isGuest || !currentUser) return;
    const alreadyShown = localStorage.getItem('ekagra_upgrade_shown');
    if (alreadyShown) return;
    
    const timer = setTimeout(() => {
      setShowUpgradePopup(true);
      localStorage.setItem('ekagra_upgrade_shown', 'true');
    }, 120000); // 2 minutes
    
    return () => clearTimeout(timer);
  }, [isPro, isGuest, currentUser]);

  useEffect(() => {
    if ((location.pathname === '/' || !tabMap[location.pathname]) && (currentUser || isGuest)) {
      navigate('/home', { replace: true });
    }
  }, [location.pathname, navigate, currentUser, isGuest]);

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

  // Init Data Effect
  useEffect(() => {
    // Only init data if we are logged in OR a guest
    const canAccess = currentUser || isGuest;
    if (!canAccess) return;

    const initData = async () => {
      try {
        // Fix 2: Detect orphaned session
        const isRunning = localStorage.getItem('ekagra_session_running');
        if (isRunning) {
            const startStr = localStorage.getItem('ekagra_session_start');
            const subjectId = localStorage.getItem('ekagra_session_subject') || DEFAULT_SUBJECTS[0].id;
            
            if (startStr) {
                const startTime = parseInt(startStr);
                const orphanedMs = Date.now() - startTime;
                
                if (orphanedMs > 21600000) { // 6 hours
                    // Discard silently
                    localStorage.removeItem('ekagra_session_running');
                    localStorage.removeItem('ekagra_session_start');
                    localStorage.removeItem('ekagra_session_subject');
                } else if (orphanedMs > 60000) { // > 1 minute
                    setOrphanedSession({
                        durationMs: orphanedMs,
                        subjectId,
                        show: true
                    });
                } else {
                    localStorage.removeItem('ekagra_session_running');
                    localStorage.removeItem('ekagra_session_start');
                    localStorage.removeItem('ekagra_session_subject');
                }
            }
        }

        await refreshSubjects();
        await refreshSyllabusSubjects();
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

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const handleSessionCapped = () => setCappedNotification(true);
    window.addEventListener('ekagra_session_capped', handleSessionCapped as EventListener);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      window.removeEventListener('ekagrazone_sync_complete', handleSyncComplete);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ekagra_session_capped', handleSessionCapped as EventListener);
    };
  }, [currentUser, isGuest]); // Depend on authorization state

  // Unread Notification Listener
  useEffect(() => {
      if (!currentUser) return;
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
  }, [currentUser]);

  const refreshSubjects = async () => {
      const storedSubjects = await dbService.getSubjects();
      setSubjects(storedSubjects.length ? storedSubjects : DEFAULT_SUBJECTS);
  };

  const refreshSyllabusSubjects = async () => {
      const data = await dbService.getSyllabusSubjects();
      setSyllabusSubjects(data);
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
      setExams(allExams);
  };

  // Sync local data when user signs in
  useEffect(() => {
    if (currentUser && !isGuest) {
      dbService.syncLocalToCloud().then(() => {
          console.log("Synced local data to cloud");
          refreshSubjects();
          refreshSyllabusSubjects();
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
    await refreshSyllabusSubjects();
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
          message: "This action is permanent. Your entire focus history and data will be wiped forever."
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
          const hasPremiumCached = localStorage.getItem('ekagrazone_hasPremium');
          localStorage.clear();
          if (hasPremiumCached) {
              localStorage.setItem('ekagrazone_hasPremium', hasPremiumCached);
          }
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
    await dbService.saveSession(updatedSession);
    setSessionToSave(null);
    handleSessionComplete();
  };

  const handleOrphanedSave = async () => {
      if (!orphanedSession) return;
      const sessionToSave: StudySession = {
          id: crypto.randomUUID(),
          subjectId: orphanedSession.subjectId,
          durationMs: orphanedSession.durationMs,
          startTime: Date.now() - orphanedSession.durationMs,
          endTime: Date.now(),
          dateString: getLocalDateString(),
      };
      await dbService.saveSession(sessionToSave);
      
      localStorage.removeItem('ekagra_session_running');
      localStorage.removeItem('ekagra_session_start');
      localStorage.removeItem('ekagra_session_subject');
      
      setOrphanedSession(null);
      handleSessionComplete();
  };

  const handleOrphanedDiscard = () => {
      localStorage.removeItem('ekagra_session_running');
      localStorage.removeItem('ekagra_session_start');
      localStorage.removeItem('ekagra_session_subject');
      setOrphanedSession(null);
  };

  const { elapsedMs, status, mode, isOvertime, currentSubjectId, setSubjectId, setMode, start, pause, stop } = useStopwatch(DEFAULT_SUBJECTS[0].id, handleSessionComplete, timerDurations);
  
  const handleStopRequest = async () => {
    const session = await stop();
    if (session) {
        setSessionToSave(session);
    }
  };

  const currentSubject = subjects.find(s => s.id === currentSubjectId) || subjects[0];

  // Timer Completion Logic (Global)
  const isTimerMode = mode !== 'stopwatch';
  const targetDuration = isTimerMode ? (timerDurations[mode as keyof typeof timerDurations] || 25) * 60 * 1000 : 0;
  const isTimerComplete = isTimerMode && elapsedMs >= targetDuration;
  const notifiedRef = useRef(false);

  // --- LIVE STATUS SYNC (RTDB) ---
  useEffect(() => {
      if (!currentUser) return;

      const publicStatusRef = ref(rtdb, `users/${currentUser.uid}/publicStatus`);
      const connectedRef = ref(rtdb, '.info/connected');
      
      // Use ref for elapsedMs so interval can access current value without re-triggering effect
      const elapsedRef = { current: elapsedMs };

      const updatePresence = () => {
          const subjectName = subjects.find(s => s.id === currentSubjectId)?.name || "Focusing";
          
          set(publicStatusRef, { 
              isOnline: true,
              lastSeen: serverTimestamp(),
              isFocusing: status === 'running',
              currentTask: status === 'running' ? subjectName : null,
              todayBaseMs: dailyTotalMs, // Base time (finished sessions)
              currentSessionStart: status === 'running' ? Date.now() - elapsedRef.current : null
          });
      };

      // Watch connection state
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

      // Update presence immediately when status/subject changes
      updatePresence();

      // Periodic update to refresh lastSeen and ensure consistency
      // Note: We don't rely on this loop for elapsed time precision, client does that.
      const interval = setInterval(() => {
          // Update ref value for interval closure
          elapsedRef.current = elapsedMs; 
          updatePresence();
      }, 60000); 

      return () => {
          clearInterval(interval);
          unsubscribe();
      };
  }, [currentUser, status, dailyTotalMs, currentSubjectId, subjects]); 
  // removed elapsedMs from dep array to avoid spam, interval handles updates if needed, 
  // but crucially status change triggers immediate update with correct start time.

  useEffect(() => {
      // If timer becomes complete while running, notify
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
      
      // Reset notified flag if timer is reset or stopped
      if (status === 'idle') {
          notifiedRef.current = false;
      }
  }, [status, isTimerComplete, mode]);

  const todaySessions = useMemo(() => allSessions.filter(s => s.dateString === getLocalDateString()), [allSessions]);
  const currentSubjectTodayTotal = useMemo(() => {
      return todaySessions.filter(s => s.subjectId === currentSubjectId).reduce((acc, curr) => acc + curr.durationMs, 0);
  }, [todaySessions, currentSubjectId]);

  const todaysTasks = useMemo(() => {
      const today = getLocalDateString();
      return tasks.filter(t => t.dateString === today);
  }, [tasks]);

  const handleStartRequest = useCallback(() => {
      if (enableZenMode && wallpaper && status === 'idle' && !isZenActive) {
          setShowZenPrompt(true);
      } else {
          start();
      }
  }, [enableZenMode, wallpaper, status, isZenActive, start]);



  const handleZenResponse = (shouldEnter: boolean) => {
      setShowZenPrompt(false);
      start(); 
      if (shouldEnter) setIsZenActive(true);
  };

  useEffect(() => {
    if (currentUser && !isGuest && currentUser.displayName && !usernameNeeded) {
      const tutorialDone = localStorage.getItem('ekagra_tutorial_complete');
      if (!tutorialDone) {
        setTimeout(() => initTutorial(true), 1000);
      }
    }
  }, [currentUser, isGuest, usernameNeeded, initTutorial]);

  // --- STRICT RENDERING LOGIC ---

  // 1. Loading State - Absolute Top Priority
  // Stops the app from 'guessing' or flashing wrong screens
  if (loading) {
      return (
          <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className={`w-12 h-12 border-4 border-${accent}-500/30 border-t-${accent}-500 rounded-full animate-spin`} />
                  <p className="text-slate-400 text-sm font-mono animate-pulse">Initializing Zone...</p>
              </div>
          </div>
      );
  }

  // 2. Not Logged In & Not Guest -> Login Page
  if (!currentUser && !isGuest) {
      if (location.pathname !== '/') {
          return <Navigate to="/" replace />;
      }
      return <LoginPage />;
  }

  // 3. Logged In User Checks

  // 4. Force Username Setup if needed (Post-Auth / Post-Guest)
  if (usernameNeeded && !isGuest) {
      return <UsernameSetup onComplete={() => setUsernameNeeded(false)} />;
  }

  const displayName = currentUser?.displayName || (isGuest ? "Guest User" : "User");

  // --- Components ---

  const Header = () => (
    <div className="flex justify-between items-center mb-6">
       <div className="flex items-center gap-2 cursor-pointer select-none" onClick={triggerLogoSpin}>
         <EkagraLogo 
            className="w-8 h-8 rounded-xl shadow-lg text-white"
            style={{ animation: isLogoSpinning ? 'spin 0.7s ease-in-out' : 'none' }}
         />
         <h1 className="font-bold text-xl tracking-tight text-slate-100">EKAGRAZONE</h1>
       </div>
       <div className="flex items-center gap-2">
           {/* Notification Bell (Mobile) */}
           <button onClick={() => setIsNotificationOpen(true)} className="p-1.5 rounded-full bg-white/5 border border-white/5 relative">
               <Bell size={16} className="text-slate-400" />
               {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />}
           </button>

           {/* Mobile Sound Indicator */}
           {isPlaying && (
               <button onClick={togglePlay} className="p-1.5 rounded-full bg-white/5 border border-white/5 text-emerald-400 animate-pulse">
                   <Volume2 size={14} />
               </button>
           )}
           {isGuest ? (
             <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
             >
                 <LogIn size={12} />
                 <span className="hidden sm:inline">Sign In</span>
             </button>
           ) : (
             <button 
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
            >
                {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span className="hidden sm:inline">{isSyncing ? 'Syncing' : isOnline ? 'Online' : 'Offline'}</span>
            </button>
           )}
       </div>
    </div>
  );

  const MobileDrawer = () => (
    <div className={`fixed bottom-16 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300 ease-out z-40 flex flex-col ${isDrawerOpen ? 'h-[70vh]' : 'h-12'}`}>
       <button 
         onClick={() => setIsDrawerOpen(!isDrawerOpen)}
         className="w-full flex justify-center items-center h-12 flex-none text-slate-400 hover:text-white"
       >
         {isDrawerOpen ? <ChevronDown size={20} /> : <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><ChevronUp size={16} /> Timeline</div>}
       </button>
       <div className="flex-1 overflow-y-auto px-4 pb-4">
          <DailyTimeline sessions={todaySessions} subjects={subjects} className="h-full min-h-[500px]" />
       </div>
    </div>
  );

  const ConfirmationModal = () => {
    const [inputValue, setInputValue] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    if (!confirmModal) return null;

    const isDangerMode = confirmModal.type === 'all';
    const isValid = isDangerMode ? inputValue === 'RESET' : true;

    const handleConfirm = () => {
        if (!isValid) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }
        executeClear();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
            `}</style>
            
            <div className={`bg-slate-900 border ${isDangerMode ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200`}>
                <div className={`flex items-center gap-3 mb-4 ${isDangerMode ? 'text-red-500' : 'text-slate-200'}`}>
                    <AlertTriangle size={32} className={isDangerMode ? 'animate-pulse' : ''} />
                    <h3 className="text-xl font-bold leading-tight">{confirmModal.title}</h3>
                </div>
                
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
                
                {isDangerMode && (
                    <div className="mb-6">
                        <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2 block">
                            Type <span className="bg-red-500/10 px-1 rounded text-red-300">RESET</span> to confirm
                        </label>
                        <input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="RESET"
                            className="w-full bg-red-950/20 border border-red-900/50 rounded-xl p-3 text-red-200 placeholder-red-900/50 focus:outline-none focus:border-red-500 transition-colors font-mono font-bold tracking-widest text-center"
                            autoFocus
                        />
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors border border-white/5">Cancel</button>
                    <button 
                        onClick={handleConfirm} 
                        className={`
                            flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                            ${isDangerMode 
                                ? isValid 
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20' 
                                    : 'bg-red-900/20 text-red-800 cursor-not-allowed border border-red-900/10 opacity-50'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20'
                            }
                            ${isShaking ? 'shake' : ''}
                        `}
                    >
                        <Trash2 size={18} /> {isDangerMode ? 'Delete Everything' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const SettingsContent = () => (
    <div id="settings-container" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
        {!isPro && (
          <div className={`p-4 rounded-2xl bg-${accent}-500/10 border border-${accent}-500/20 mb-6`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Free Plan</div>
                <div className="text-xs text-slate-400">Upgrade to unlock all features</div>
              </div>
              <button
                onClick={() => setShowPricing(true)}
                className={`px-4 py-2 rounded-xl bg-${accent}-500 text-white text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer`}
              >
                Upgrade ₹149
              </button>
            </div>
          </div>
        )}
        
        {/* Profile Card */}
        <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
             
             <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                 {currentUser?.photoURL ? (
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

        <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <div className={`p-2.5 bg-${accent}-500/20 rounded-xl text-${accent}-400`}>
              <HelpCircle size={20} />
            </div>
            <span className="font-bold text-lg text-slate-200">App Tutorial</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-300 mb-1">🎬 Replay Tutorial</div>
              <div className="text-xs text-slate-500">Watch the intro and re-enable all feature tooltips</div>
            </div>
            <button
              onClick={replayTutorial}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 hover:text-white transition-all"
            >
              <RotateCcw size={14} />
              Replay
            </button>
          </div>
        </div>

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

  const DockNav = () => {
    const [hoveredTab, setHoveredTab] = useState<string|null>(null);
    const [mouseX, setMouseX] = useState<number|null>(null);
    const dockRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<string, HTMLDivElement|null>>({});

    const tabs = [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'timer', label: 'Focus', icon: Timer },
      { id: 'timeline', label: 'Stats', icon: BarChart3 },
      { id: 'syllabus', label: 'Syllabus', icon: Library },
      { id: 'calendar', label: 'Plan', icon: CalendarDays },
      { id: 'exams', label: 'Exams', icon: GraduationCap },
      { id: 'habits', label: 'Habits', icon: Repeat },
      { id: 'journal', label: 'Journal', icon: BookOpen },
      { id: 'social', label: 'Social', icon: Users },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const getItemScale = (tabId: string) => {
      if (mouseX === null) return 1;
      const el = itemRefs.current[tabId];
      if (!el) return 1;
      const rect = el.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const distance = Math.abs(mouseX - itemCenter);
      const maxDistance = rect.width * 3.5;
      if (distance > maxDistance) return 1;
      const scale = 1 + (1 - distance / maxDistance) * 0.75;
      return Math.min(1.75, scale);
    };

    const getItemYOffset = (tabId: string) => {
      if (mouseX === null) return 0;
      const el = itemRefs.current[tabId];
      if (!el) return 1;
      const rect = el.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const distance = Math.abs(mouseX - itemCenter);
      const maxDistance = rect.width * 3.5;
      if (distance > maxDistance) return 0;
      return -(1 - distance / maxDistance) * 14;
    };

    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 
        z-50 hidden md:block">
        
        {/* Dock container */}
        <motion.div
          ref={dockRef}
          className="flex items-end gap-2 px-4 py-3
            bg-slate-900/80 backdrop-blur-2xl 
            border border-white/10 rounded-3xl
            shadow-2xl shadow-black/50"
          onMouseMove={(e) => setMouseX(e.clientX)}
          onMouseLeave={() => {
            setMouseX(null);
            setHoveredTab(null);
          }}
        >
          {/* Logo */}
          <div 
            className="flex items-center justify-center 
              w-10 h-10 mr-2 cursor-pointer flex-shrink-0 rounded-2xl"
            onClick={triggerLogoSpin}
          >
            <EkagraLogo 
              className="w-8 h-8 rounded-2xl"
              style={{ 
                animation: isLogoSpinning 
                  ? 'spin 0.7s ease-in-out' : 'none',
                filter: `drop-shadow(0 0 8px var(--tw-shadow-color))`
              }}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10 mr-2 flex-shrink-0" />

          {/* Tab icons */}
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <div
                key={tab.id}
                ref={el => itemRefs.current[tab.id] = el}
                className="relative flex flex-col items-center"
                onMouseEnter={() => setHoveredTab(tab.id)}
              >
                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredTab === tab.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -top-10 left-1/2 
                        -translate-x-1/2 whitespace-nowrap
                        bg-slate-800 border border-white/10 
                        text-white text-[11px] font-semibold 
                        px-2.5 py-1 rounded-lg shadow-xl
                        pointer-events-none z-50"
                    >
                      {tab.label}
                      <div className="absolute top-full left-1/2 
                        -translate-x-1/2 w-0 h-0 
                        border-l-4 border-r-4 border-t-4 
                        border-transparent border-t-slate-800" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon button */}
                <motion.button
                  onClick={() => handleTabChange(tab.id as MobileTab)}
                  animate={{
                    scale: getItemScale(tab.id),
                    y: getItemYOffset(tab.id),
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    mass: 0.5
                  }}
                  className={`relative w-11 h-11 rounded-2xl 
                    flex items-center justify-center 
                    transition-colors duration-200 cursor-pointer
                    ${isActive 
                      ? `bg-${accent}-500/20 
                         border border-${accent}-500/30` 
                      : 'hover:bg-white/8 border border-transparent'}`}
                  style={{
                    transformOrigin: 'bottom center',
                  }}
                >
                  <Icon 
                    size={20} 
                    className={`transition-colors duration-200
                      ${isActive 
                        ? `text-${accent}-400` 
                        : 'text-slate-400 hover:text-slate-200'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {LOCKED_TABS.includes(tab.id as MobileTab) && !isPro && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                      <Lock size={6} className="text-slate-400" />
                    </div>
                  )}

                  {/* Active glow dot */}
                  {isActive && (
                    <motion.div
                      layoutId="dock-active-dot"
                      className={`absolute -bottom-1.5 left-1/2 
                        -translate-x-1/2 w-1 h-1 rounded-full 
                        bg-${accent}-400`}
                      style={{
                        boxShadow: `0 0 6px 2px var(--tw-shadow-color)`
                      }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 300, 
                        damping: 30 
                      }}
                    />
                  )}
                </motion.button>
              </div>
            );
          })}

          {/* Divider */}
          <div className="w-px h-8 bg-white/10 ml-2 flex-shrink-0" />

          {/* User avatar + online status */}
          <div className="relative flex-shrink-0 ml-1">
            <div
              className="w-10 h-10 rounded-2xl overflow-hidden 
                border border-white/10 cursor-pointer
                hover:border-white/20 transition-colors"
              onClick={() => setActiveTab('settings')}
              title={displayName}
            >
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full 
                  bg-${accent}-500/20 flex items-center 
                  justify-center text-${accent}-400 
                  font-bold text-sm`}
                >
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {/* Online status dot */}
            <div className={`absolute -bottom-0.5 -right-0.5 
              w-3 h-3 rounded-full border-2 border-slate-900
              ${isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} 
            />
          </div>

          {/* Music playing indicator */}
          {isPlaying && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={togglePlay}
              className={`flex-shrink-0 w-10 h-10 rounded-2xl 
                bg-${accent}-500/20 border border-${accent}-500/30
                flex items-center justify-center
                text-${accent}-400 animate-pulse`}
              title="Music playing — click to stop"
            >
              <Volume2 size={16} />
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30 relative">
      
      {/* Friend Milestone Observer - Always render but handle user inside */}
      <FriendObserver />
      
      {/* Notification Center - Always render */}
      <NotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

      {/* Background Ambience */}
      {!isZenActive && !isSpaceMode && (
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={!isHighQuality ? { backgroundColor: '#000000' } : {}}>
              {isHighQuality ? (
                  showWallpaperOnHome && wallpaper ? (
                      <>
                        <img src={wallpaper} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-[#0f172a]/70 backdrop-blur-[2px]" />
                      </>
                  ) : (
                      <>
                        <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-${accent}-600/10 blur-[120px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]`} />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]" />
                        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-purple-600/5 blur-[80px] rounded-full mix-blend-screen animate-[pulse_12s_ease-in-out_infinite]" />
                      </>
                  )
              ) : null}
          </div>
      )}

      {/* ZEN & Space Modes (Unchanged code) ... */}
      {showZenPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full transform scale-100 animate-in zoom-in-95">
                <h3 className="text-xl font-bold text-white mb-2">Enter Zen Mode?</h3>
                <p className="text-slate-400 text-sm mb-6">Would you like to switch to the immersive fullscreen background?</p>
                <div className="flex gap-3">
                    <button onClick={() => handleZenResponse(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors">No</button>
                    <button onClick={() => handleZenResponse(true)} className={`flex-1 py-3 rounded-xl bg-${accent}-600 text-white hover:bg-${accent}-500 font-bold transition-colors shadow-lg shadow-${accent}-500/20`}>Yes</button>
                </div>
            </div>
        </div>
      )}

      {isZenActive && !isSpaceMode && (
          <div className="fixed inset-0 z-[50] animate-in fade-in duration-700 bg-black">
              {wallpaper && <img src={wallpaper} alt="Zen Background" className="absolute inset-0 w-full h-full object-cover opacity-80" />}
              <div className="absolute inset-0 bg-black/30" /> 
              
              <button 
                onClick={() => setIsZenActive(false)} 
                className="absolute top-6 right-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/50 hover:text-white transition-all z-[60]"
              >
                <X size={24} />
              </button>
              <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end items-center pb-12">
                  <div className="pointer-events-auto flex flex-col items-center">
                    <TimerDisplay 
                        elapsedMs={elapsedMs} 
                        status={status} 
                        mode={mode}
                        isOvertime={isOvertime}
                        todaySubjectTotal={currentSubjectTodayTotal}
                        subjectColor={currentSubject.color} 
                        onStart={start} 
                        onPause={pause} 
                        onStop={handleStopRequest} 
                        onSetMode={setMode}
                        durations={timerDurations}
                        onUpdateDurations={handleUpdateDurations}
                        isWallpaperMode={true}
                        subjects={subjects}
                        currentSubjectId={currentSubjectId}
                        onSelectSubject={setSubjectId}
                        dailyTotalMs={dailyTotalMs}
                    />
                  </div>
              </div>
          </div>
      )}

      {isSpaceMode && (
          <div className="fixed inset-0 z-[60] animate-in fade-in duration-1000 bg-black flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 pointer-events-none select-none">
                  {(() => {
                      const videoId = getYoutubeId(spaceVideoUrl) || "xRPjKQtRKT8";
                      return (
                        <iframe 
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&autohide=1&modestbranding=1&loop=1&playlist=${videoId}&iv_load_policy=3&rel=0`}
                            title="Space Live Stream"
                            className="absolute top-1/2 left-1/2 w-[177.77777778vh] h-[100vh] min-w-full min-h-[56.25vw] -translate-x-1/2 -translate-y-1/2 object-cover opacity-80"
                            allow="autoplay; encrypted-media"
                        />
                      );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
              </div>

              <button onClick={() => setIsSpaceMode(false)} className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs uppercase tracking-widest border border-white/10 transition-all z-[70] group">
                  <Rocket size={14} className="group-hover:-translate-y-0.5 transition-transform" /> Exit Orbit
              </button>

              <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end items-center pb-16">
                  <div className="pointer-events-auto scale-90 md:scale-100">
                    <TimerDisplay 
                        elapsedMs={elapsedMs} 
                        status={status} 
                        mode={mode}
                        isOvertime={isOvertime}
                        todaySubjectTotal={currentSubjectTodayTotal}
                        subjectColor={currentSubject.color} 
                        onStart={start} 
                        onPause={pause} 
                        onStop={handleStopRequest} 
                        onSetMode={setMode}
                        durations={timerDurations}
                        onUpdateDurations={handleUpdateDurations}
                        isWallpaperMode={true}
                        subjects={subjects}
                        currentSubjectId={currentSubjectId}
                        onSelectSubject={setSubjectId}
                        dailyTotalMs={dailyTotalMs}
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-mono tracking-widest opacity-60">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      LIVE FROM ORBIT
                  </div>
              </div>
          </div>
      )}

      {isSubjectManagerOpen && (
          <SubjectManager 
            subjects={subjects} 
            onUpdate={refreshSubjects} 
            onClose={() => setIsSubjectManagerOpen(false)} 
          />
      )}

      <ConfirmationModal />
      
      {/* Orphaned Session Modal */}
      <AnimatePresence>
          {orphanedSession && orphanedSession.show && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
                  >
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex flex-col items-center justify-center mb-6 mx-auto text-amber-500">
                          <Activity size={32} />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white text-center mb-3">Looks like you forgot to stop your timer!</h3>
                      <p className="text-slate-400 text-sm text-center mb-8">
                          Did you study for <span className="text-amber-400 font-bold whitespace-nowrap">{Math.floor(orphanedSession.durationMs / 3600000)} hrs {Math.floor((orphanedSession.durationMs % 3600000) / 60000)} mins</span>?
                      </p>
                      
                      <div className="flex flex-col gap-3">
                          <button 
                              onClick={handleOrphanedSave}
                              className={`w-full py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-${accent}-600 to-${accent}-500 text-white hover:from-${accent}-500 hover:to-${accent}-400 shadow-lg`}
                          >
                              Yes, save it
                          </button>
                          <button 
                              onClick={handleOrphanedDiscard}
                              className="w-full py-3 rounded-xl font-bold transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                              No, discard
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* Capped Notification */}
      <AnimatePresence>
          {cappedNotification && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-md">
                 <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-amber-500/10 flex items-start gap-4"
                 >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-none">
                        <Activity size={20} />
                    </div>
                    <div className="flex-1 pr-6">
                        <h4 className="text-sm font-bold text-white mb-1">Timer Auto-Paused</h4>
                        <p className="text-xs text-slate-400">Timer auto-paused after 6 hours. Don't forget to save your session!</p>
                    </div>
                    <button onClick={() => setCappedNotification(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                        <X size={16} />
                    </button>
                 </motion.div>
              </div>
          )}
      </AnimatePresence>
      
      {/* Session Summary Modal */}
      <AnimatePresence>
          {sessionToSave && (
              <SessionSummaryModal 
                session={sessionToSave} 
                subjects={subjects} 
                onSave={handleSessionSave} 
                onCancel={() => setSessionToSave(null)} 
              />
          )}
      </AnimatePresence>

      <AnimatePresence>
        {showStudyRoom && currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950"
          >
            <StudyRoom
              onClose={() => setShowStudyRoom(false)}
              currentUser={{
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Mobile Layout (< md) --- */}
      <div className={`md:hidden flex flex-col h-[100dvh] relative z-10 ${isZenActive || isSpaceMode ? 'hidden' : ''}`}>
        <div className="flex-none px-4 pt-4 transition-all">
           <Header />
        </div>
        
        <main className="flex-1 relative overflow-hidden flex flex-col">
           <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
                 className="flex-1 flex flex-col h-full overflow-hidden"
               >
                   {activeTab === 'dashboard' && (
                     <Dashboard 
                        sessions={allSessions} 
                        subjects={subjects} 
                        targetHours={targetHours} 
                        userName={displayName}
                        onNavigate={setActiveTab}
                        tasks={tasks}
                        exams={exams}
                        syllabusSubjects={syllabusSubjects}
                    />
                   )}

                   {/* Other mobile tabs... */}
                   {activeTab === 'timer' && (
                     <div className="flex-1 flex flex-col px-4 relative overflow-y-auto no-scrollbar">
                        <div id="timer-subject-picker" className="flex-none mt-2 mb-2 relative z-10">
                          <SubjectPicker subjects={subjects} selectedId={currentSubjectId} onSelect={setSubjectId} disabled={status !== 'idle'} variant="horizontal" />
                        </div>
                        <div className="flex-1 flex flex-col relative z-10 justify-center items-center pb-32 md:pb-24">
                          <TimerDisplay 
                            elapsedMs={elapsedMs} 
                            status={status} 
                            mode={mode}
                            isOvertime={isOvertime}
                            todaySubjectTotal={currentSubjectTodayTotal}
                            subjectColor={currentSubject.color} 
                            onStart={handleStartRequest} 
                            onPause={pause} 
                            onStop={handleStopRequest} 
                            onSetMode={setMode}
                            durations={timerDurations}
                            onUpdateDurations={handleUpdateDurations}
                            isWallpaperMode={false}
                            dailyTotalMs={dailyTotalMs}
                          />
                          {enableZenMode && wallpaper && status === 'running' && !isZenActive && (
                              <button onClick={() => {
                                  setIsZenActive(true);
                              }} className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-${accent}-500/10 text-${accent}-400 border border-${accent}-500/20 text-xs font-semibold hover:bg-${accent}-500/20 transition-all`}>
                                  <Maximize2 size={14} /> Enter Zen Mode
                              </button>
                          )}
                        </div>
                        <div className="absolute top-4 right-4 z-20">
                            <button onClick={() => setActiveTab('calendar')} className="bg-slate-900/60 backdrop-blur border border-white/10 p-2 rounded-full shadow-lg">
                                <Target size={18} className={`text-${accent}-400`} />
                            </button>
                        </div>
                        <MobileDrawer />
                     </div>
                   )}

                   {activeTab === 'timeline' && (
                     <div className="flex-1 flex flex-col px-4 overflow-y-auto pb-32 md:pb-4">
                        <StatsPage 
                            sessions={allSessions} 
                            subjects={subjects} 
                            onDataUpdate={loadSessions} 
                        />
                     </div>
                   )}

                   {activeTab === 'exams' && (
                     <div className="flex-1 flex flex-col px-4 overflow-y-auto pb-32 md:pb-4">
                        <ExamTracker subjects={subjects} exams={exams} onUpdate={loadExams} sessions={allSessions} syllabusSubjects={syllabusSubjects} />
                     </div>
                   )}

                   {activeTab === 'syllabus' && (
                     <div className="flex-1 flex flex-col overflow-hidden pb-4">
                        <SyllabusPage subjects={subjects} />
                     </div>
                   )}



                   {/* Add Social Panel for Mobile */}
                   {activeTab === 'social' && (
                     <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <SocialPanel />
                     </div>
                   )}

                   {activeTab === 'journal' && <div className="flex-1 flex flex-col overflow-hidden"><JournalPage /></div>}
                   {activeTab === 'habits' && <div className="flex-1 flex flex-col overflow-hidden"><HabitsPage /></div>}

                   {activeTab === 'calendar' && (
                     <div className="flex-1 px-4 overflow-y-auto pt-4 pb-32 md:pb-4">
                        <PlanPage 
                            sessions={allSessions}
                            subjects={subjects}
                            exams={exams}
                            tasks={tasks}
                            syllabusSubjects={syllabusSubjects}
                            onTaskUpdate={loadTasks}
                            onStartSession={setSubjectId}
                            targetHours={targetHours}
                        />
                     </div>
                   )}
                   
                   {activeTab === 'settings' && (
                     <div className="flex-1 p-6 overflow-y-auto pb-32 md:pb-6">
                       <h2 className="text-xl font-bold mb-6">Settings</h2>
                       <SettingsContent />
                       <div className="mt-12 text-center pb-8">
                         <p className="text-slate-500 text-[10px] font-mono font-medium tracking-wide">Made by Abhyuday</p>
                       </div>
                     </div>
                   )}
               </motion.div>
           </AnimatePresence>
        </main>
        
        <MobileNav activeTab={activeTab} setTab={handleTabChange} isPro={isPro} lockedTabs={LOCKED_TABS} />
      </div>


      {/* --- Desktop Layout (>= md) --- */}
      <div className={`hidden md:flex flex-col h-screen w-full max-w-[1920px] mx-auto p-4 relative z-10 ${isZenActive || isSpaceMode ? 'hidden' : ''}`}>
         {/* Main Glass Panel */}
         <main 
            className={`
                flex-1 bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-row transition-all duration-500
                ring-1 ring-white/5 mb-20
                ${activeTab === 'calendar' ? 'p-0 rounded-[2rem]' : 'p-8 rounded-[2.5rem]'}
            `}
         >
            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar inside glass */}
                {activeTab !== 'calendar' && (
                    <div className="flex justify-between items-center mb-6 flex-none z-30 relative transition-opacity">
                        <motion.h2 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={activeTab}
                            className="text-3xl font-bold text-white tracking-tight flex items-center gap-3"
                        >
                        {activeTab === 'dashboard' && 'Dashboard'}
                        {activeTab === 'timer' && 'Focus Zone'}
                        {activeTab === 'timeline' && 'Analytics'}

                        {activeTab === 'exams' && 'Exam Tracker'}
                        {activeTab === 'syllabus' && 'Syllabus'}
                        {activeTab === 'journal' && 'Daily Journal'}
                        {activeTab === 'habits' && 'Habit Forge'}
                        {activeTab === 'social' && 'Social Hub'}
                        {activeTab === 'settings' && 'Preferences'}
                        {activeTab === 'dashboard' && <span className="text-sm font-normal text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>}
                        </motion.h2>
                        <div className="flex gap-4 items-center">
                            {/* Desktop Notification Bell */}
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
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="h-full w-full flex flex-col"
                        >
                            {activeTab === 'dashboard' && (
                                <div className="h-full overflow-hidden rounded-[2rem]">
                                    <Dashboard 
                                        sessions={allSessions} 
                                        subjects={subjects} 
                                        targetHours={targetHours} 
                                        userName={displayName}
                                        onNavigate={setActiveTab}
                                        tasks={tasks}
                                        exams={exams}
                                        syllabusSubjects={syllabusSubjects}
                                    />
                                </div>
                            )}
                            
                            {activeTab === 'timer' && (
                                <div className="h-full flex flex-col relative overflow-y-auto custom-scrollbar pb-8">
                                    <div className="flex-none py-2 flex justify-center relative z-20">
                                        <div className="bg-slate-900/30 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-xl max-w-[95%]">
                                            <SubjectPicker subjects={subjects} selectedId={currentSubjectId} onSelect={setSubjectId} disabled={status !== 'idle'} variant="horizontal" />
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col relative rounded-3xl mt-6 z-10 justify-center items-center">
                                        <TimerDisplay 
                                            elapsedMs={elapsedMs} 
                                            status={status} 
                                            mode={mode}
                                            isOvertime={isOvertime}
                                            todaySubjectTotal={currentSubjectTodayTotal}
                                            subjectColor={currentSubject.color} 
                                            onStart={handleStartRequest} 
                                            onPause={pause} 
                                            onStop={handleStopRequest} 
                                            onSetMode={setMode}
                                            durations={timerDurations}
                                            onUpdateDurations={handleUpdateDurations}
                                            isWallpaperMode={false}
                                            dailyTotalMs={dailyTotalMs}
                                            sidePanel={
                                                <div className={`transition-all duration-500 ease-in-out flex flex-col bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden ${isSidePanelCollapsed ? 'w-14' : 'w-80'} h-full hover:bg-slate-900/40`}>
                                                    <div className="flex-none flex items-center justify-between p-3 border-b border-white/5">
                                                        {!isSidePanelCollapsed && (
                                                            <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-white/5">
                                                                <button 
                                                                    onClick={() => setSidePanelTab('goals')}
                                                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${sidePanelTab === 'goals' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                                >
                                                                    Goals
                                                                </button>
                                                                <button 
                                                                    onClick={() => setSidePanelTab('exams')}
                                                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${sidePanelTab === 'exams' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                                >
                                                                    Exams
                                                                </button>
                                                            </div>
                                                        )}
                                                        <button onClick={() => setIsSidePanelCollapsed(!isSidePanelCollapsed)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 ml-auto" title={isSidePanelCollapsed ? "Expand" : "Collapse"}>
                                                            {isSidePanelCollapsed ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                                                        </button>
                                                    </div>
                                                    {!isSidePanelCollapsed ? (
                                                        <div className="flex-1 overflow-hidden relative">
                                                            <div className="absolute inset-0 p-4 overflow-y-auto custom-scrollbar">
                                                                {sidePanelTab === 'goals' ? (
                                                                    <GoalChecklist dailyTotalMs={dailyTotalMs} tasks={todaysTasks} onTaskUpdate={loadTasks} selectedDate={getLocalDateString()} targetHours={targetHours} variant="compact" />
                                                                ) : (
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><GraduationCap size={14}/> Upcoming Exams</span>
                                                                        </div>
                                                                        <ExamList exams={exams} subjects={subjects} variant="compact" onDelete={handleDeleteExam} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 flex flex-col items-center gap-4 pt-4">
                                                            <button onClick={() => { setSidePanelTab('goals'); setIsSidePanelCollapsed(false); }} className={`p-2 rounded-xl hover:bg-white/10 ${sidePanelTab === 'goals' ? `text-${accent}-400` : 'text-slate-400'}`} title="Goals"><CheckSquare size={20} /></button>
                                                            <button onClick={() => { setSidePanelTab('exams'); setIsSidePanelCollapsed(false); }} className={`p-2 rounded-xl hover:bg-white/10 ${sidePanelTab === 'exams' ? `text-${accent}-400` : 'text-slate-400'}`} title="Exams"><GraduationCap size={20} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        />
                                        {enableZenMode && wallpaper && status === 'running' && !isZenActive && (
                                            <button onClick={() => {
                                                setIsZenActive(true)
                                            }} className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-${accent}-500/10 text-${accent}-400 border border-${accent}-500/20 text-xs font-semibold hover:bg-${accent}-500/20 transition-all`}>
                                                <Maximize2 size={14} /> Enter Zen Mode
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'timeline' && (
                                <div className="h-full w-full overflow-hidden">
                                    <StatsPage 
                                        sessions={allSessions} 
                                        subjects={subjects} 
                                        onDataUpdate={loadSessions} 
                                    />
                                </div>
                            )}

                            {activeTab === 'exams' && (
                                <div className="h-full w-full overflow-y-auto custom-scrollbar rounded-[2rem]">
                                    <ExamTracker subjects={subjects} exams={exams} onUpdate={loadExams} sessions={allSessions} syllabusSubjects={syllabusSubjects} />
                                </div>
                            )}

                            {activeTab === 'syllabus' && (
                                <div className="h-full w-full overflow-hidden rounded-[2rem]">
                                    <SyllabusPage subjects={subjects} />
                                </div>
                            )}



                            {activeTab === 'social' && (
                                <div className="h-full w-full overflow-hidden rounded-[2rem]">
                                    <SocialPanel />
                                </div>
                            )}

                            {activeTab === 'journal' && <div className="h-full overflow-hidden rounded-[2rem]"><JournalPage /></div>}
                            {activeTab === 'habits' && <div className="h-full overflow-hidden rounded-[2rem]"><HabitsPage /></div>}

                            {activeTab === 'calendar' && (
                                <div className="h-full w-full overflow-hidden">
                                    <PlanPage 
                                        sessions={allSessions}
                                        subjects={subjects}
                                        exams={exams}
                                        tasks={tasks}
                                        syllabusSubjects={syllabusSubjects}
                                        onTaskUpdate={loadTasks}
                                        onStartSession={setSubjectId}
                                        targetHours={targetHours}
                                    />
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-8">
                                    <SettingsContent />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
         </main>
         <DockNav />
      </div>
      <MiniTimer 
          status={status}
          activeTab={activeTab}
          isZenActive={isZenActive}
          isSpaceMode={isSpaceMode}
          targetDuration={targetDuration}
          elapsedMs={elapsedMs}
          isTimerMode={isTimerMode}
          accent={accent}
          currentSubject={currentSubject}
          onToggle={status === 'running' ? pause : handleStartRequest}
          onActivate={() => setActiveTab('timer')}
      />

       {/* Pricing Modal Overlay */}
       <AnimatePresence>
            {showProPreview && (
              <ProPreviewModal
                tab={showProPreview}
                onClose={() => setShowProPreview(null)}
                onUpgrade={() => {
                  setShowProPreview(null);
                  setShowPricing(true);
                }}
              />
            )}
            
            {showUpgradePopup && (
              <UpgradePopup
                onClose={() => setShowUpgradePopup(false)}
                onUpgrade={() => {
                  setShowUpgradePopup(false);
                  setShowPricing(true);
                }}
              />
            )}
            
            {showPricing && (
              <PricingPage
                onClose={() => setShowPricing(false)}
                onUpgrade={() => {
                  alert('Payment coming soon! Contact us for beta access.');
                  setShowPricing(false);
                }}
              />
            )}
       </AnimatePresence>

      {/* Tutorial Intro */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300]"
          >
            <TutorialIntro
              displayName={displayName}
              onComplete={completeIntro}
              onSkip={skipIntro}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Tooltips */}
      <AnimatePresence>
        {isTooltipActive && currentTooltipConfig && (
          <TutorialTooltip
            key={currentTooltipConfig.targetId}
            targetId={currentTooltipConfig.targetId}
            title={currentTooltipConfig.title}
            description={currentTooltipConfig.description}
            step={currentTooltipStep}
            totalSteps={totalTooltipSteps}
            position={currentTooltipConfig.position}
            onNext={nextTooltip}
            onSkip={skipTooltips}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default App;
