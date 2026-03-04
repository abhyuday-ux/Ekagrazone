import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  LayoutDashboard, Trophy, Timer, Settings, 
  Menu, X, LogOut, User, CheckCircle2, 
  AlertTriangle, ArrowRight, Sparkles, 
  Zap, Crown, Share2, Download, Upload, Trash2 
} from 'lucide-react';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { usePerformance } from '../contexts/PerformanceContext';
import { useTimerControl } from '../contexts/TimerContext';

import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ConnectedTimerDisplay } from './ConnectedTimerDisplay';
import { ConnectedMiniTimer } from './ConnectedMiniTimer';
import { SettingsContent } from './SettingsContent';
import { MaintenanceMode } from './MaintenanceMode';
import { ConfirmationModal } from './ConfirmationModal';
import { SessionSummaryModal } from './SessionSummaryModal';
import { SubjectManager } from './SubjectManager';

import { dbService } from '../services/db';
import { 
  Subject, StudySession, Task, Exam, 
  DEFAULT_SUBJECTS, getLocalDateString, MobileTab 
} from '../types';
import { WALLPAPERS } from '../constants';

// Lazy Load Pages
const Dashboard = lazy(() => import('./Dashboard'));
const StatsPage = lazy(() => import('./StatsPage'));
const ExamTracker = lazy(() => import('./ExamTracker/ExamTracker'));
const SocialPanel = lazy(() => import('./SocialPanel'));
const JournalPage = lazy(() => import('./JournalPage'));
const HabitsPage = lazy(() => import('./HabitsPage'));
const PlanPage = lazy(() => import('./PlanPage'));
const PricingPage = lazy(() => import('./PricingPage'));

interface AppContentProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  allSessions: StudySession[];
  setAllSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  targetHours: number;
  setTargetHours: (h: number) => void;
  dayStartHour: number;
  setDayStartHour: (h: number) => void;
  wallpaper: string;
  setWallpaper: (w: string) => void;
  showWallpaperOnHome: boolean;
  setShowWallpaperOnHome: (s: boolean) => void;
  enableZenMode: boolean;
  setEnableZenMode: (e: boolean) => void;
  isAuthorized: boolean;
  usernameNeeded: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  refreshSubjects: () => Promise<void>;
  loadSessions: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadExams: () => Promise<void>;
}

export const AppContent: React.FC<AppContentProps> = React.memo(({
  subjects, setSubjects, allSessions, setAllSessions, tasks, setTasks, exams, setExams,
  targetHours, setTargetHours, dayStartHour, setDayStartHour, wallpaper, setWallpaper,
  showWallpaperOnHome, setShowWallpaperOnHome, enableZenMode, setEnableZenMode,
  isAuthorized, usernameNeeded, isOnline, isSyncing,
  refreshSubjects, loadSessions, loadTasks, loadExams
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme, accent, setAccent } = useTheme();
  const { isHighQuality, toggleQuality } = usePerformance();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Timer Context
  const { 
    status, mode, start, sessionToSave, handleSessionSave, setSessionToSave, updatePresenceData 
  } = useTimerControl();

  // UI State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [levelUpData, setLevelUpData] = useState<{level: number} | null>(null);
  
  const [isZenActive, setIsZenActive] = useState(false);
  const [showZenPrompt, setShowZenPrompt] = useState(false);
  const [isSpaceMode, setIsSpaceMode] = useState(false);
  const [spaceVideoUrl, setSpaceVideoUrl] = useState('');
  
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{type: 'today'|'all', title: string, message: string, onConfirm: () => void} | null>(null);
  
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState<'tasks' | 'chat'>('tasks');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Derived State
  const activeTab = (location.pathname.substring(1) || 'dashboard') as MobileTab;
  const currentSubjectId = useTimerControl().currentSubjectId; // Access directly
  const currentSubject = subjects.find(s => s.id === currentSubjectId) || subjects[0];

  // Update Presence Data in Context
  useEffect(() => {
    const todayStr = getLocalDateString();
    const todayTotal = allSessions
      .filter(s => s.dateString === todayStr)
      .reduce((acc, s) => acc + s.durationMs, 0);
    
    updatePresenceData(subjects, todayTotal);
  }, [subjects, allSessions, updatePresenceData]);

  // Level Up Listener
  useEffect(() => {
    const handleLevelUp = (e: CustomEvent) => {
        setLevelUpData(e.detail);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
        setTimeout(() => setLevelUpData(null), 5000);
    };
    window.addEventListener('ekagra_levelup', handleLevelUp as EventListener);
    return () => window.removeEventListener('ekagra_levelup', handleLevelUp as EventListener);
  }, []);

  // Zen Mode Logic
  useEffect(() => {
    if (status === 'running' && enableZenMode && !isZenActive && !isSpaceMode) {
        setShowZenPrompt(true);
    } else if (status !== 'running') {
        setShowZenPrompt(false);
        if (isZenActive) setIsZenActive(false);
    }
  }, [status, enableZenMode, isZenActive, isSpaceMode]);

  // Space Mode Logic
  useEffect(() => {
    if (isSpaceMode && status !== 'running') {
        setIsSpaceMode(false);
    }
  }, [status, isSpaceMode]);

  // Handlers
  const handleStartRequest = useCallback(() => {
      if (enableZenMode && !isZenActive && !isSpaceMode) {
          setShowZenPrompt(true);
      } else {
          start();
      }
  }, [enableZenMode, isZenActive, isSpaceMode, start]);

  const handleEnterZen = () => {
      setShowZenPrompt(false);
      setIsZenActive(true);
      start();
  };

  const handleEnterSpace = (videoUrl: string) => {
      setSpaceVideoUrl(videoUrl);
      setIsSpaceMode(true);
      setShowZenPrompt(false);
      start();
  };

  const handleExport = async () => {
      const data = await dbService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ekagrazone_backup_${getLocalDateString()}.json`;
      a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const success = await dbService.importData(text);
      if (success) {
          alert('Data imported successfully! Reloading...');
          window.location.reload();
      } else {
          alert('Failed to import data.');
      }
  };

  const requestClearToday = () => {
      setConfirmModal({
          type: 'today',
          title: 'Clear Today\'s Data?',
          message: 'This will delete all sessions recorded today. This action cannot be undone.',
          onConfirm: async () => {
              await dbService.clearTodaySessions();
              await loadSessions();
              setConfirmModal(null);
          }
      });
  };

  const requestClearAll = () => {
      setConfirmModal({
          type: 'all',
          title: 'Reset Everything?',
          message: 'This will delete ALL your data including sessions, tasks, and settings. This action is irreversible.',
          onConfirm: async () => {
              await dbService.clearAllData();
              localStorage.clear();
              window.location.reload();
          }
      });
  };

  const handleTargetHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTargetHours(parseFloat(e.target.value));
  };
  const handleDayStartHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setDayStartHour(parseInt(e.target.value));
  };
  const handleWallpaperChange = (url: string) => {
      setWallpaper(url);
  };
  const handleShowWallpaperToggle = () => {
      setShowWallpaperOnHome(!showWallpaperOnHome);
  };
  const handleZenToggle = () => {
      setEnableZenMode(!enableZenMode);
  };

  const { signInWithGoogle } = useAuth();

  // Render Logic
  if (!isAuthorized) {
      return <MaintenanceMode />;
  }

  const todayStr = getLocalDateString();
  const todaySessions = allSessions.filter(s => s.dateString === todayStr);
  const todaySubjectTotal = todaySessions
      .filter(s => s.subjectId === currentSubjectId)
      .reduce((acc, s) => acc + s.durationMs, 0);

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-black text-slate-200' : 'bg-slate-50 text-slate-900'} ${isZenActive ? 'zen-mode' : ''}`}>
        
        {/* Background Wallpaper */}
        <AnimatePresence>
            {(showWallpaperOnHome || isZenActive) && wallpaper && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isZenActive ? 1 : 0.4 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-0 pointer-events-none"
                >
                    <img 
                        src={wallpaper} 
                        className="w-full h-full object-cover filter brightness-[0.4] blur-sm scale-105"
                        alt="Wallpaper"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
                </motion.div>
            )}
        </AnimatePresence>

        {/* Space Mode Video */}
        <AnimatePresence>
            {isSpaceMode && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black"
                >
                    <video 
                        src={spaceVideoUrl} 
                        autoPlay loop muted 
                        className="w-full h-full object-cover opacity-60"
                    />
                    
                    {/* Space Mode Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <ConnectedTimerDisplay 
                            todaySubjectTotal={todaySubjectTotal}
                            subjectColor={currentSubject.color}
                            isWallpaperMode={true}
                            subjects={subjects}
                            onStartRequest={handleStartRequest}
                        />
                        
                        <button 
                            onClick={() => setIsSpaceMode(false)}
                            className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/50 hover:text-white transition-all text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/5"
                        >
                            Exit Space Mode
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Zen Mode Overlay */}
        <AnimatePresence>
            {isZenActive && !isSpaceMode && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl"
                >
                    <ConnectedTimerDisplay 
                        todaySubjectTotal={todaySubjectTotal}
                        subjectColor={currentSubject.color}
                        isWallpaperMode={true}
                        subjects={subjects}
                        onStartRequest={handleStartRequest}
                    />
                    
                    <button 
                        onClick={() => setIsZenActive(false)}
                        className="mt-12 text-slate-500 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Exit Zen Mode
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Zen Prompt Modal */}
        <AnimatePresence>
            {showZenPrompt && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Sparkles className="text-amber-400" /> Enter Focus Mode?
                        </h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Choose your immersive experience.
                        </p>
                        <div className="space-y-3">
                            <button 
                                onClick={handleEnterZen}
                                className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center gap-3 transition-colors group"
                            >
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-indigo-300">
                                    <Zap size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-white">Zen Mode</div>
                                    <div className="text-xs text-slate-500">Minimalist timer with wallpaper</div>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => handleEnterSpace('https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4')}
                                className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center gap-3 transition-colors group"
                            >
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:text-purple-300">
                                    <Crown size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-white">Space Travel</div>
                                    <div className="text-xs text-slate-500">Hyperspace visual loop</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => { setShowZenPrompt(false); start(); }}
                                className="w-full py-3 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wider"
                            >
                                Continue in Normal Mode
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Sidebar (Desktop) */}
        {!isZenActive && !isSpaceMode && (
            <Sidebar 
                activeTab={activeTab} 
                isDrawerOpen={isDrawerOpen} 
                setIsDrawerOpen={setIsDrawerOpen}
                user={currentUser}
                isOnline={isOnline}
                isSyncing={isSyncing}
                unreadCount={unreadCount}
            />
        )}

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${isDrawerOpen ? 'md:ml-64' : 'md:ml-20'}`}>
            
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
                        <Zap size={18} className="text-white" fill="currentColor" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">Ekagra<span className="text-indigo-400">Zone</span></span>
                </div>
                <button onClick={() => navigate('/settings')} className="p-2 bg-slate-800 rounded-full text-slate-400">
                    <Settings size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-0">
                <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    }>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                className="h-full w-full"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Routes location={location}>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    
                                    <Route path="/dashboard" element={
                                    <Dashboard 
                                        user={currentUser}
                                        subjects={subjects}
                                        allSessions={allSessions}
                                        tasks={tasks}
                                        exams={exams}
                                        onStartRequest={handleStartRequest}
                                    />
                                } />

                                <Route path="/focus" element={
                                    <div className="h-[calc(100vh-100px)] flex flex-col">
                                        <ConnectedTimerDisplay 
                                            todaySubjectTotal={todaySubjectTotal}
                                            subjectColor={currentSubject.color}
                                            subjects={subjects}
                                            sidePanel={
                                                <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 h-full">
                                                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Session Goals</h3>
                                                    {/* Goal list placeholder */}
                                                    <div className="text-sm text-slate-500 italic">No active goals for this session.</div>
                                                </div>
                                            }
                                            onStartRequest={handleStartRequest}
                                        />
                                    </div>
                                } />

                                <Route path="/timeline" element={
                                    <StatsPage 
                                        sessions={allSessions} 
                                        subjects={subjects} 
                                        targetHours={targetHours}
                                    />
                                } />

                                <Route path="/exams" element={
                                    <ExamTracker 
                                        exams={exams} 
                                        setExams={setExams} 
                                        subjects={subjects}
                                    />
                                } />

                                <Route path="/social" element={
                                    <SocialPanel />
                                } />

                                <Route path="/journal" element={
                                    <JournalPage />
                                } />

                                <Route path="/habits" element={
                                    <HabitsPage />
                                } />

                                <Route path="/plan" element={
                                    <PlanPage 
                                        tasks={tasks} 
                                        setTasks={setTasks} 
                                        subjects={subjects}
                                    />
                                } />

                                <Route path="/settings" element={
                                    <SettingsContent 
                                        currentUser={currentUser}
                                        isGuest={!currentUser}
                                        displayName={currentUser?.displayName || 'Guest'}
                                        logout={logout}
                                        signInWithGoogle={signInWithGoogle}
                                        accent={accent}
                                        handleAccentChange={setAccent}
                                        graphicsQuality={isHighQuality ? 'High' : 'Low'}
                                        setGraphicsQuality={(q) => q === 'High' ? (!isHighQuality && toggleQuality()) : (isHighQuality && toggleQuality())}
                                        targetHours={targetHours}
                                        handleTargetHoursChange={handleTargetHoursChange}
                                        dayStartHour={dayStartHour}
                                        handleDayStartHourChange={handleDayStartHourChange}
                                        wallpaper={wallpaper}
                                        handleWallpaperChange={handleWallpaperChange}
                                        showWallpaperOnHome={showWallpaperOnHome}
                                        handleShowWallpaperToggle={handleShowWallpaperToggle}
                                        enableZenMode={enableZenMode}
                                        handleZenToggle={handleZenToggle}
                                        handleExport={handleExport}
                                        handleSync={refreshSubjects} // Using refreshSubjects as sync for now
                                        isSyncing={isSyncing}
                                        isOnline={isOnline}
                                        setIsSubjectManagerOpen={setIsSubjectManagerOpen}
                                        requestClearToday={requestClearToday}
                                        requestClearAll={requestClearAll}
                                    />
                                } />

                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </motion.div>
                        </AnimatePresence>
                    </Suspense>
                </div>
            </div>

            {/* Mobile Navigation */}
            <MobileNav activeTab={activeTab} />
        </main>

        {/* Floating Elements */}
        <ConnectedMiniTimer 
            activeTab={activeTab}
            isZenActive={isZenActive}
            isSpaceMode={isSpaceMode}
            currentSubject={currentSubject}
            onActivate={() => navigate('/focus')}
            handleStartRequest={handleStartRequest}
        />

        {/* Modals */}
        {sessionToSave && (
            <SessionSummaryModal 
                session={sessionToSave}
                subjects={subjects}
                onSave={handleSessionSave}
                onDiscard={() => setSessionToSave(null)}
            />
        )}

        {confirmModal && (
            <ConfirmationModal 
                config={confirmModal}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(null)}
            />
        )}

        {isSubjectManagerOpen && (
            <SubjectManager 
                subjects={subjects}
                onUpdate={refreshSubjects}
                onClose={() => setIsSubjectManagerOpen(false)}
            />
        )}

        {levelUpData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-1 rounded-3xl animate-in zoom-in duration-500 shadow-2xl shadow-orange-500/50">
                    <div className="bg-slate-900 rounded-[1.4rem] p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                        <Trophy size={64} className="text-amber-400 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Level Up!</h2>
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-2">
                            {levelUpData.level}
                        </div>
                        <p className="text-amber-200 font-bold uppercase tracking-widest text-xs">Keep Grinding</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
});
