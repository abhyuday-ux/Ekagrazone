import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { StudySession, Subject, isHexColor, getLocalDateString, UserProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Flame, Clock, Moon, Sun, Sunset,
  Plus, ArrowRight, Calendar, 
  CheckCircle2, AlertTriangle, Lock,
  Trophy, BarChart2, Zap, BookOpen, CalendarDays,
  Sparkles, TrendingUp, MoreHorizontal, PieChart, ArrowUpRight, ArrowDownRight, History, Activity, Shield
} from 'lucide-react';
import { ReportCard } from './ReportCard';
import { Play, CheckSquare, BookOpen as BookIcon } from 'lucide-react';
import { SubjectDonut } from './SubjectDonut';
import { dbService } from '../services/db';
import { ConfirmationModal } from './ConfirmationModal';

// Lazy load ReportAlbum for performance
const ReportAlbum = React.lazy(() => import('./ReportAlbum').then(module => ({ default: module.ReportAlbum })));

interface DashboardProps {
  sessions: StudySession[];
  subjects: Subject[];
  targetHours: number;
  userName?: string;
  onNavigate: (tab: any) => void;
  tasks: any[];
  exams?: any[];
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ 
  sessions, 
  subjects, 
  targetHours, 
  userName = "Aspirant",
  onNavigate,
  tasks,
  exams
}) => {
  const { accent } = useTheme();
  const [timeOfDay, setTimeOfDay] = useState('');
  const [isDayStarted, setIsDayStarted] = useState(false);
  const [dayStartTime, setDayStartTime] = useState<number | null>(null);
  const [isDayCompleted, setIsDayCompleted] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showReportAlbum, setShowReportAlbum] = useState(false);
  const [reportConfetti, setReportConfetti] = useState(false);
  const [isConfirmingCompleteDay, setIsConfirmingCompleteDay] = useState(false);
  
  // User Profile State for XP/Level
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Use local date string to fix timezone bugs
  const todayStr = getLocalDateString();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Morning');
    else if (hour < 18) setTimeOfDay('Afternoon');
    else setTimeOfDay('Evening');

    const started = localStorage.getItem(`ekagra_started_${todayStr}`);
    if (started === 'true') setIsDayStarted(true);

    const startTime = localStorage.getItem(`ekagra_startTime_${todayStr}`);
    if (startTime) setDayStartTime(parseInt(startTime));

    const completed = localStorage.getItem(`omni_completed_${todayStr}`);
    if (completed === 'true') setIsDayCompleted(true);

    // Fetch User Profile for XP
    const fetchProfile = async () => {
        const profile = await dbService.getUserProfile();
        setUserProfile(profile);
    };
    fetchProfile();

    const handleSync = () => fetchProfile();
    window.addEventListener('ekagrazone_sync_complete', handleSync);
    
    // Listen for level up events to refresh immediately
    window.addEventListener('ekagra_levelup', handleSync);

    return () => {
        window.removeEventListener('ekagrazone_sync_complete', handleSync);
        window.removeEventListener('ekagra_levelup', handleSync);
    };
  }, [todayStr]);

  const handleStartDay = useCallback(() => {
      const now = Date.now();
      setIsDayStarted(true);
      setDayStartTime(now);
      localStorage.setItem(`ekagra_started_${todayStr}`, 'true');
      localStorage.setItem(`ekagra_startTime_${todayStr}`, now.toString());
  }, [todayStr]);

  const handleCompleteDay = useCallback(() => {
      setIsDayCompleted(true);
      localStorage.setItem(`omni_completed_${todayStr}`, 'true');
      setReportConfetti(true);
      setShowReportCard(true);
  }, [todayStr]);

  // --- Calculations ---

  const todaySessions = useMemo(() => sessions.filter(s => s.dateString === todayStr), [sessions, todayStr]);
  const todayDurationMs = useMemo(() => todaySessions.reduce((acc, s) => acc + s.durationMs, 0), [todaySessions]);
  const todayHours = todayDurationMs / 3600000;
  
  // Use dailyGoal from profile if available, otherwise fallback to targetHours prop or default 6
  const effectiveTargetHours = userProfile?.dailyGoal || targetHours || 6;
  const progressPercent = Math.min((todayHours / effectiveTargetHours) * 100, 100);

  const todaySessions_count = todaySessions.length;
  const todayAvgSession = todaySessions_count > 0 
    ? todayDurationMs / todaySessions_count : 0;
  const todayTopSubject = subjects.find(s => 
    s.id === Object.entries(
      todaySessions.reduce((acc, session) => {
        acc[session.subjectId] = (acc[session.subjectId]||0) + session.durationMs;
        return acc;
      }, {} as Record<string,number>)
    ).sort((a,b) => b[1]-a[1])[0]?.[0]
  );
  const hoursRemaining = Math.max(0, 
    effectiveTargetHours - todayHours);

  const nextExam = useMemo(() => {
    if (!exams || exams.length === 0) return null;
    const upcoming = exams
      .filter(e => new Date(e.date + 'T00:00:00') >= new Date())
      .sort((a,b) => new Date(a.date).getTime() 
        - new Date(b.date).getTime());
    return upcoming[0] || null;
  }, [exams]);

  const daysToExam = nextExam ? Math.ceil(
    (new Date(nextExam.date + 'T00:00:00').getTime() 
      - new Date().setHours(0,0,0,0)) 
    / (1000*60*60*24)
  ) : null;

  const quote = useMemo(() => {
    if (todayHours >= effectiveTargetHours) 
      return "Goal crushed! You're built different. 💪";
    if (timeOfDay === 'Morning') 
      return "The early bird gets the rank. Start strong!";
    if (timeOfDay === 'Afternoon') 
      return "Afternoon slump? That's when legends grind.";
    if (timeOfDay === 'Evening') 
      return "Evening focus hits different. Lock in! 🔒";
    return "Night owl mode activated. Stay sharp!";
  }, [timeOfDay, todayHours, effectiveTargetHours]);

  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - 
    (progressPercent / 100) * circumference;

  const yesterdayStr = useMemo(() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return getLocalDateString(d);
  }, []);
  const yesterdaySessions = useMemo(() => sessions.filter(s => s.dateString === yesterdayStr), [sessions, yesterdayStr]);
  const yesterdayDurationMs = useMemo(() => yesterdaySessions.reduce((acc, s) => acc + s.durationMs, 0), [yesterdaySessions]);
  
  const growthPercent = yesterdayDurationMs > 0 
    ? ((todayDurationMs - yesterdayDurationMs) / yesterdayDurationMs) * 100 
    : todayDurationMs > 0 ? 100 : 0;

  const streak = useMemo(() => {
      const dates = [...new Set(sessions.map(s => s.dateString))].sort().reverse();
      if (dates.length === 0) return 0;
      
      let count = 0;
      let current = new Date();
      
      // Check if we studied today or yesterday to start the streak
      if (dates.includes(todayStr)) {
          // includes today
      } else {
          current.setDate(current.getDate() - 1);
          if (!dates.includes(getLocalDateString(current))) {
              return 0;
          }
      }

      current = new Date();
      if (!dates.includes(todayStr)) {
           current.setDate(current.getDate() - 1);
      }

      while (true) {
          const dStr = getLocalDateString(current);
          if (dates.includes(dStr)) {
              count++;
              current.setDate(current.getDate() - 1);
          } else {
              break;
          }
      }
      return count;
  }, [sessions, todayStr]);

  const weeklyTrend = useMemo(() => {
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dStr = getLocalDateString(d);
          const dayTotal = sessions
            .filter(s => s.dateString === dStr)
            .reduce((acc, s) => acc + s.durationMs, 0);
          
          days.push({
              day: d.toLocaleDateString('en-US', { weekday: 'short' }),
              date: dStr,
              hours: dayTotal / 3600000,
              isToday: dStr === todayStr
          });
      }
      return days;
  }, [sessions, todayStr]);

  const maxWeeklyHours = Math.max(...weeklyTrend.map(d => d.hours), effectiveTargetHours * 0.5);

  const focusRhythm = useMemo(() => {
      const dist = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      sessions.forEach(s => {
          const h = new Date(s.startTime).getHours();
          if (h >= 5 && h < 12) dist.morning += s.durationMs;
          else if (h >= 12 && h < 17) dist.afternoon += s.durationMs;
          else if (h >= 17 && h < 22) dist.evening += s.durationMs;
          else dist.night += s.durationMs; 
      });
      
      const total = Object.values(dist).reduce((a,b) => a+b, 0) || 1;
      return [
          { label: 'Morning', value: dist.morning, pct: (dist.morning / total) * 100, icon: Sun, color: 'text-amber-400' },
          { label: 'Afternoon', value: dist.afternoon, pct: (dist.afternoon / total) * 100, icon: Zap, color: 'text-orange-400' },
          { label: 'Evening', value: dist.evening, pct: (dist.evening / total) * 100, icon: Sunset, color: 'text-indigo-400' },
          { label: 'Night', value: dist.night, pct: (dist.night / total) * 100, icon: Moon, color: 'text-blue-400' },
      ];
  }, [sessions]);

  const recentSessions = useMemo(() => {
      return [...sessions]
        .sort((a, b) => b.endTime - a.endTime)
        .slice(0, 3);
  }, [sessions]);

  const formatHoursMins = (ms: number) => {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      if (h === 0) return `${m}m`;
      return `${h}h ${m}m`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const handleUpdateChallenge = useCallback(async () => {
      const newTitle = prompt("Enter Challenge Title (e.g., NEET PREP DAY):", userProfile?.challengeTitle || "MAINS GRIND DAY");
      if (newTitle !== null) {
          const newStartDate = prompt("Enter Start Date (YYYY-MM-DD):", userProfile?.challengeStartDate || getLocalDateString());
          if (newStartDate) {
              await dbService.updateUserProfile({
                  challengeTitle: newTitle,
                  challengeStartDate: newStartDate
              });
              // Refresh profile
              const profile = await dbService.getUserProfile();
              setUserProfile(profile);
          }
      }
  }, [userProfile]);

  const challengeDayNumber = useMemo(() => {
      if (!userProfile?.challengeStartDate) return 1;
      const start = new Date(userProfile.challengeStartDate + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffTime = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      return Math.max(1, diffDays);
  }, [userProfile]);

  const today = new Date();
  const isSunday = today.getDay() === 0;

  const weekSessions = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    return sessions.filter(s => 
      new Date(s.dateString + 'T00:00:00') >= weekStart
    );
  }, [sessions]);

  const weekDaysStudied = new Set(
    weekSessions.map(s => s.dateString)
  ).size;

  const showWeeklySummary = isSunday || weekDaysStudied >= 5;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar flex flex-col pb-32 md:pb-0">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full max-w-7xl mx-auto flex-1 flex flex-col px-4 lg:px-2 pb-8"
        >
            {/* 1. Header Section */}
            <motion.div variants={itemVariants} className="flex-none mb-8 pt-4 lg:pt-2 px-1">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 opacity-80 cursor-pointer hover:opacity-100 transition-opacity" onClick={handleUpdateChallenge} title="Click to edit challenge">
                            <span className="flex h-2 w-2 relative">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${accent}-400 opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 bg-${accent}-500`}></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {userProfile?.challengeTitle || "MAINS GRIND DAY"} [{challengeDayNumber}]
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                            Good {timeOfDay}, <span className={`text-transparent bg-clip-text bg-gradient-to-r from-${accent}-400 to-purple-400`}>{userName}</span>
                        </h1>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 sm:gap-3 self-start md:self-auto mt-4 md:mt-0">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowReportAlbum(true)}
                            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-full text-xs font-bold text-slate-300 transition-all shadow-lg backdrop-blur-sm"
                        >
                            <BookIcon size={14} /> 
                            <span>Report Album</span>
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('calendar')}
                            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-full text-xs font-bold text-slate-300 transition-all shadow-lg backdrop-blur-sm"
                        >
                            <Calendar size={14} /> 
                            <span>Schedule</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Weekly Summary Card */}
            {showWeeklySummary && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-r from-${accent}-500/10 to-purple-500/10 border border-${accent}-500/20 rounded-2xl p-3 sm:p-5 mb-3 sm:mb-6 mt-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${accent}-500/20 flex items-center justify-center`}>
                        <Trophy size={20} className={`text-${accent}-400`} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          {isSunday ? "Weekly Wrap-up 🎉" : "Almost there! 🔥"}
                        </div>
                        <div className="text-sm font-bold text-white">
                          {weekDaysStudied} days studied this week · {(weekSessions.reduce((a,s) => a+s.durationMs,0)/3600000).toFixed(1)}h total
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('timeline')}
                      className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Full Stats <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
            )}

            {/* 2. Main Dashboard Grid - Responsive Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                
                {/* Hero Card / XP Rank Card */}
                <motion.div 
                    id="daily-goals"
                    variants={itemVariants}
                    className="col-span-1 sm:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden group shadow-2xl flex flex-col justify-between min-h-[240px]"
                >
                    <div className={`absolute top-0 right-0 p-40 bg-${accent}-500/10 rounded-full blur-[100px] -mr-20 -mt-20 transition-opacity opacity-50 group-hover:opacity-80 duration-1000`} />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{timeOfDay === 'Morning' ? '🌅' : timeOfDay === 'Afternoon' ? '☀️' : timeOfDay === 'Evening' ? '🌇' : '🌙'}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{timeOfDay}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">{userProfile?.displayName || userName || 'Student'}</h1>
                            <p className="text-sm text-slate-500 mt-0.5 italic font-medium">{quote}</p>

                            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                              {[
                                { label: 'Start Timer', icon: Zap, 
                                  action: () => onNavigate('timer'), 
                                  color: accent },
                                { label: 'Add Task', icon: CheckSquare, 
                                  action: () => onNavigate('calendar'), 
                                  color: 'slate' },
                                { label: 'Syllabus', icon: BookOpen, 
                                  action: () => onNavigate('syllabus'), 
                                  color: 'slate' },
                                { label: 'Stats', icon: BarChart2, 
                                  action: () => onNavigate('timeline'), 
                                  color: 'slate' },
                              ].map((btn, i) => (
                                <button
                                  key={i}
                                  onClick={btn.action}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 
                                    rounded-lg text-xs font-bold transition-all
                                    ${btn.color === accent 
                                      ? `bg-${accent}-500/15 text-${accent}-300 
                                         border border-${accent}-500/25 
                                         hover:bg-${accent}-500/25` 
                                      : 'bg-white/5 text-slate-400 border border-white/8 hover:bg-white/10 hover:text-white'}`}
                                >
                                  <btn.icon size={12} />
                                  {btn.label}
                                </button>
                              ))}
                            </div>

                            <div className="mb-2 mt-4">
                                <div className="flex justify-between text-xs mb-1.5 font-medium">
                                    <span className="text-slate-300">Total Focus Time</span>
                                    <span className="text-blue-400 font-mono text-base">{formatHoursMins(userProfile?.totalFocusMs || 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 self-center sm:self-auto ml-0 sm:ml-4 flex items-center justify-center">
                          <svg className="w-20 h-20 sm:w-28 sm:h-28 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" 
                              fill="none" stroke="rgba(255,255,255,0.05)" 
                              strokeWidth="8"/>
                            <circle cx="50" cy="50" r="45" fill="none"
                              stroke={`var(--color-${accent}-500, #06b6d4)`}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              style={{transition: 'stroke-dashoffset 1s ease'}}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-mono font-bold text-white">
                              {Math.round(progressPercent)}%
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider">of goal</span>
                          </div>
                        </div>
                    </div>

                    <div id="timer-display" className="relative z-10 mt-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                        {!isDayStarted ? (
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleStartDay}
                                className={`w-full sm:flex-1 py-4 sm:py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/20`}
                            >
                                <Play size={18} fill="currentColor" /> Start Day
                            </motion.button>
                        ) : (
                            <>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => !isDayCompleted && onNavigate('timer')}
                                    disabled={isDayCompleted}
                                    className={`
                                        w-full sm:flex-1 py-4 sm:py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                                        ${isDayCompleted 
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                                            : `bg-gradient-to-r from-${accent}-600 to-${accent}-500 hover:from-${accent}-500 hover:to-${accent}-400 text-white shadow-lg shadow-${accent}-500/25 border border-${accent}-400/20`}
                                    `}
                                >
                                    <Zap size={18} fill="currentColor" /> {isDayCompleted ? 'Day Complete' : 'Start Timer'}
                                </motion.button>

                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={isDayCompleted ? () => setShowReportCard(true) : () => setIsConfirmingCompleteDay(true)}
                                    className={`w-full sm:w-auto p-4 sm:p-3.5 flex items-center justify-center rounded-xl text-slate-300 hover:text-white transition-colors border border-white/10 ${isDayCompleted ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 hover:bg-white/10'}`}
                                    title={isDayCompleted ? "View Report" : "Complete Day"}
                                >
                                    {isDayCompleted ? <Zap size={22} className="text-purple-400" fill="currentColor" /> : <CheckSquare size={22} />}
                                    <span className="sm:hidden font-bold text-sm ml-2">{isDayCompleted ? "View Report" : "Complete Day"}</span>
                                </motion.button>
                            </>
                        )}
                        
                        {/* Neon Grind Button (Always visible if day started, to check progress) */}
                        {isDayStarted && !isDayCompleted && (
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setReportConfetti(false); setShowReportCard(true); }}
                                className="w-full sm:w-auto p-4 sm:p-3.5 flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 rounded-xl text-yellow-400 transition-colors border border-yellow-500/20"
                                title="Neon Grind (Live Report)"
                            >
                                <Zap size={22} />
                                <span className="sm:hidden font-bold text-sm ml-2">Live Report</span>
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Today's Breakdown */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-1 sm:col-span-2 lg:col-span-1 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-5 flex flex-col justify-between relative overflow-hidden hover:border-white/20 transition-colors"
                >
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="flex items-center gap-2">
                            <PieChart size={16} className="text-blue-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Mix</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-300">{formatHoursMins(todayDurationMs)}</span>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center relative z-10 min-h-[120px]">
                        <div className="scale-90 -ml-2 -mt-2">
                            <SubjectDonut sessions={todaySessions} subjects={subjects} />
                        </div>
                    </div>
                </motion.div>

                {/* Streak Card */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-1 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/30 transition-colors"
                >
                    <div className="absolute top-0 right-0 p-16 bg-orange-500/5 rounded-full blur-3xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/10">
                            <Flame size={20} className={streak > 0 ? "animate-pulse" : ""} fill={streak > 0 ? "currentColor" : "none"} />
                        </div>
                    </div>
                    
                    <div className="relative z-10 mt-auto">
                        <span className="text-4xl font-mono font-bold text-white block tracking-tighter mb-1">{streak}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            Day Streak <TrendingUp size={12} />
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Today's Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
              {[
                { 
                  label: 'Today', 
                  value: formatHoursMins(todayDurationMs), 
                  sub: `${todaySessions_count} sessions`,
                  icon: Clock, color: 'blue' 
                },
                { 
                  label: 'Remaining', 
                  value: hoursRemaining > 0 
                    ? formatHoursMins(hoursRemaining * 3600000) 
                    : 'Goal hit! 🎉',
                  sub: `of ${effectiveTargetHours}h goal`,
                  icon: Target, color: 'emerald'
                },
                { 
                  label: 'Avg Session', 
                  value: formatHoursMins(todayAvgSession),
                  sub: 'per session today',
                  icon: Activity, color: 'purple'
                },
                { 
                  label: 'Top Subject',
                  value: todayTopSubject?.name || '–',
                  sub: 'most studied today',
                  icon: BookOpen, color: 'amber'
                },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  variants={itemVariants}
                  className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col gap-1 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    <stat.icon size={12} className={`text-${stat.color}-400 opacity-60`} />
                  </div>
                  <span className="text-base sm:text-lg font-mono font-bold text-white leading-tight truncate">{stat.value}</span>
                  <span className="text-[9px] text-slate-600 truncate">{stat.sub}</span>
                </motion.div>
              ))}
            </div>

            {/* 3. Detailed Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4">
                
                {/* Weekly Trend */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-1 sm:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className={`text-${accent}-400`} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Trend</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400">
                            {weeklyTrend.reduce((a,d) => a+d.hours,0).toFixed(1)}h this week
                        </span>
                    </div>
                    <div className="flex-1 flex items-end gap-2 sm:gap-3 w-full h-28 sm:h-36 overflow-x-auto no-scrollbar pb-2">
                        {weeklyTrend.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end min-w-[30px]">
                                <div className="w-full relative flex-1 flex items-end bg-slate-800/30 rounded-t-lg overflow-hidden">
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-mono px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {d.hours > 0 ? d.hours.toFixed(1)+'h' : '–'}
                                    </div>
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(d.hours / (maxWeeklyHours || 1)) * 100}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
                                        className={`w-full rounded-t-lg transition-all duration-300 relative group-hover:opacity-90 ${d.isToday ? `bg-${accent}-500 shadow-[0_0_15px_rgba(var(--color-${accent}-500),0.3)]` : d.hours >= effectiveTargetHours ? 'bg-emerald-500/70' : d.hours > 0 ? 'bg-slate-600' : 'bg-slate-800/30'}`}
                                        style={{ minHeight: '4px' }}
                                    />
                                </div>
                                <span className={`text-[8px] sm:text-[9px] font-bold uppercase ${d.isToday ? 'text-white' : 'text-slate-600'}`}>
                                    <span className="sm:hidden">{d.day[0]}</span>
                                    <span className="hidden sm:block">{d.day.substring(0,3)}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Focus Rhythm */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-1 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex flex-col"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <Clock size={16} className="text-emerald-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus Rhythm</span>
                    </div>
                    <div className="hidden sm:flex flex-1 flex-col justify-between gap-3">
                        {focusRhythm.map((period, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <period.icon size={14} className={`flex-none ${period.color}`} />
                                <div className="flex-1 h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${period.pct}%` }}
                                        transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                                        className={`h-full rounded-full opacity-90 ${period.pct > 0 ? period.color.replace('text-', 'bg-') : 'bg-transparent'}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="sm:hidden flex gap-2 flex-wrap min-h-0">
                        <span className="text-[10px] text-slate-500 my-auto">Peak hours:</span>
                        {focusRhythm.sort((a,b) => b.value - a.value).slice(0,3).map((h, i) => (
                            <span key={i} className={`text-[10px] font-mono text-white ${h.color.replace('text-', 'bg-')}/20 px-2 py-0.5 rounded-lg border border-white/5 flex items-center gap-1`}>
                                <h.icon size={10} className={`${h.color}`} /> {h.label}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Sessions */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-1 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex flex-col"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <History size={16} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Activity</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
                        {recentSessions.length === 0 ? (
                            <div className="text-[10px] text-slate-600 italic text-center my-auto">No recent activity</div>
                        ) : (
                            recentSessions.map((s, idx) => {
                                const sub = subjects.find(sub => sub.id === s.subjectId);
                                const isHex = isHexColor(sub?.color || '');
                                return (
                                    <motion.div 
                                        key={s.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + (idx * 0.1) }}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div 
                                                className={`w-1 h-8 rounded-full flex-none ${!isHex ? sub?.color : ''} shadow-[0_0_8px_currentColor]`}
                                                style={isHex ? { backgroundColor: sub?.color, color: sub?.color } : {}} 
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold text-slate-300 truncate">{sub?.name}</span>
                                                <span className="text-[9px] text-slate-500">
                                                    {new Date(s.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-950/30 px-2 py-1 rounded-md">
                                            {s.durationMs > 3600000 ? (s.durationMs/3600000).toFixed(1) + 'h' : Math.round(s.durationMs/60000) + 'm'}
                                        </span>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </motion.div>

                {/* Upcoming Exam */}
                <motion.div
                  variants={itemVariants}
                  className="col-span-1 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex flex-col hover:border-red-500/20 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays size={16} className="text-red-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Exam</span>
                  </div>
                  
                  {nextExam ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-sm font-bold text-white mb-1 truncate">{nextExam.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(nextExam.date + 'T00:00:00')
                            .toLocaleDateString(undefined, 
                              {month:'long', day:'numeric', year:'numeric'})}
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className={`text-3xl sm:text-4xl font-mono font-bold ${daysToExam! <= 7 ? 'text-red-400' : daysToExam! <= 30 ? 'text-amber-400' : 'text-white'}`}>
                          {daysToExam}
                        </span>
                        <span className="text-slate-500 text-xs ml-2">
                          days left
                        </span>
                        {daysToExam! <= 7 && (
                          <div className="text-[9px] text-red-400 font-bold mt-1 animate-pulse">
                            ⚠️ Exam week approaching!
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      <CalendarDays size={24} className="text-slate-700" />
                      <span className="text-[10px] text-slate-600 text-center">No upcoming exams.<br/>Add one in the Planner!</span>
                      <button 
                        onClick={() => onNavigate('calendar')}
                        className="text-[10px] text-slate-400 hover:text-white transition-colors mt-1"
                      >
                        + Add Exam →
                      </button>
                    </div>
                  )}
                </motion.div>

            </div>

            <AnimatePresence>
                {showReportCard && (
                    <ReportCard 
                        dateString={todayStr}
                        sessions={todaySessions}
                        tasks={tasks.filter(t => t.dateString === todayStr)}
                        subjects={subjects}
                        onClose={() => setShowReportCard(false)}
                        triggerConfetti={reportConfetti}
                        dayStartTime={dayStartTime}
                        challengeTitle={userProfile?.challengeTitle || "MAINS GRIND DAY"}
                        challengeDayNumber={challengeDayNumber}
                    />
                )}
                {showReportAlbum && (
                    <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div></div>}>
                        <ReportAlbum 
                            subjects={subjects}
                            onClose={() => setShowReportAlbum(false)}
                        />
                    </Suspense>
                )}
            </AnimatePresence>

            <ConfirmationModal 
                isOpen={isConfirmingCompleteDay}
                onClose={() => setIsConfirmingCompleteDay(false)}
                onConfirm={handleCompleteDay}
                title="Complete Your Day?"
                message="This will generate your final report card for the day. You won't be able to log more sessions after this."
                confirmText="Yes, Complete Day"
            />
        </motion.div>
    </div>
  );
});
