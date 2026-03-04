
import React, { useState, useMemo } from 'react';
import { StudySession, Subject, isHexColor, getLocalDateString } from '../types';
import { BarChart2, TrendingUp, Clock, Activity, Zap, Calendar, ArrowRight, Layout, List, PieChart, AlertTriangle, Layers, Flame, Target, Trophy } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SubjectDonut } from './SubjectDonut';
import { DailyTimeline } from './DailyTimeline';
import { HistoryList } from './HistoryList';
import { YearlyHeatmap } from './YearlyHeatmap';
import { dbService } from '../services/db';

interface StatsPageProps {
  sessions: StudySession[];
  subjects: Subject[];
  onDataUpdate?: () => void;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';
type ViewMode = 'overview' | 'daily';

export const StatsPage: React.FC<StatsPageProps> = ({ sessions, subjects, onDataUpdate }) => {
  const { accent } = useTheme();
  const [range, setRange] = useState<TimeRange>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  
  // Daily View State
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  // List Deletion Modal State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // --- Handlers ---

  const requestDeleteFromList = (id: string) => {
      setDeleteConfirmationId(id);
  };

  const confirmDeleteFromList = async () => {
      if (deleteConfirmationId) {
          await dbService.deleteSession(deleteConfirmationId);
          setDeleteConfirmationId(null);
          if (onDataUpdate) onDataUpdate();
      }
  };

  // --- Helpers ---
  
  const getDateRange = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (range === 'today') {
          return { start: today, end: today };
      }
      if (range === 'week') {
          const start = new Date(today);
          start.setDate(today.getDate() - 6);
          return { start, end: today };
      }
      if (range === 'month') {
          const start = new Date(today);
          start.setDate(today.getDate() - 29);
          return { start, end: today };
      }
      return { start: new Date(0), end: today };
  };

  const { start, end } = getDateRange();

  const filteredSessions = useMemo((): StudySession[] => {
      if (range === 'all') return sessions;
      const startTime = start.getTime();
      const endTime = end.getTime() + 86400000; // End of today
      return sessions.filter(s => s.startTime >= startTime && s.startTime < endTime);
  }, [sessions, range, start, end]);

  const formatDurationSimple = (ms: number) => {
      if (ms === 0) return '0m';
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      if (h === 0) return `${m}m`;
      return `${h}h ${m}m`;
  };

  // --- Metrics ---

  const totalDuration = filteredSessions.reduce((acc, s) => acc + s.durationMs, 0);
  const totalHours = totalDuration / 3600000;
  
  const daysInRange = range === 'today' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : new Set(filteredSessions.map(s => s.dateString)).size || 1;
  const dailyAverage = totalHours / (daysInRange || 1);

  // Subject Breakdown
  const subjectTotals = useMemo(() => {
      const totals: Record<string, number> = {};
      filteredSessions.forEach(s => {
          totals[s.subjectId] = (totals[s.subjectId] || 0) + s.durationMs;
      });
      return totals;
  }, [filteredSessions]);

  const topSubjectId = Object.keys(subjectTotals).sort((a,b) => subjectTotals[b] - subjectTotals[a])[0];
  const topSubject = subjects.find(s => s.id === topSubjectId);

  // --- Trend Data (Bar Chart) ---
  const trendData = useMemo(() => {
      const data = [];
      const chartRange = range === 'all' || range === 'today' ? 'month' : range;
      
      let chartStart: Date;
      if (chartRange === 'week') {
          chartStart = new Date(start);
      } else {
          chartStart = new Date();
          chartStart.setDate(chartStart.getDate() - 29);
      }

      const daysCount = chartRange === 'week' ? 7 : 30;

      for (let i = 0; i < daysCount; i++) {
          const d = new Date(chartStart);
          d.setDate(chartStart.getDate() + i);
          
          const dStr = getLocalDateString(d);
          const daySessions = sessions.filter(s => s.dateString === dStr);
          const val = daySessions.reduce((acc, s) => acc + s.durationMs, 0) / 3600000;
          
          data.push({
              date: dStr,
              label: d.getDate().toString(),
              weekDay: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
              fullDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric'}),
              value: val
          });
      }
      return data;
  }, [sessions, range, start]);

  const maxTrendValue = Math.max(...trendData.map(d => d.value), dailyAverage * 1.5, 1);

  // --- Hourly Activity (New Colorful Chart) ---
  const hourlyActivity = useMemo(() => {
      const hours: number[] = new Array(24).fill(0);
      filteredSessions.forEach(s => {
          const h = new Date(s.startTime).getHours();
          hours[h] = (hours[h] || 0) + s.durationMs;
      });
      const max = Math.max(...hours, 1);
      return hours.map((ms, i) => ({
          hour: i,
          ms,
          percent: (ms / max) * 100,
          label: i === 0 ? '12am' : i === 12 ? '12pm' : i > 12 ? `${i-12}pm` : `${i}am`
      }));
  }, [filteredSessions]);

  // --- Topic Mastery (Ranking) ---
  const subjectRanking = useMemo(() => {
      return Object.entries(subjectTotals)
          .map(([id, ms]) => ({
              id,
              ms: ms as number,
              percent: ((ms as number) / totalDuration) * 100
          }))
          .sort((a, b) => b.ms - a.ms)
          .map(item => {
              const sub = subjects.find(s => s.id === item.id);
              return { ...item, name: sub?.name || 'Unknown', color: sub?.color || '#64748b' };
          });
  }, [subjectTotals, totalDuration, subjects]);

  const sessionQuality = useMemo(() => {
      let short = 0; // < 25m
      let medium = 0; // 25-50m
      let long = 0; // > 50m
      
      filteredSessions.forEach(s => {
          const mins = s.durationMs / 60000;
          if (mins < 25) short++;
          else if (mins < 50) medium++;
          else long++;
      });
      
      const total = short + medium + long || 1;
      return {
          short: (short / total) * 100,
          medium: (medium / total) * 100,
          long: (long / total) * 100
      };
  }, [filteredSessions]);

  const selectedDateSessions = useMemo(() => sessions.filter(s => s.dateString === selectedDate), [sessions, selectedDate]);
  
  // --- Streak Calculation ---
  const streaks = useMemo(() => {
    const datesWithSessions = new Set(sessions.filter(s => s.durationMs > 0).map(s => s.dateString));
    const sortedDates = Array.from(datesWithSessions).sort();
    
    if (sortedDates.length === 0) return { current: 0, best: 0 };

    let best = 0;
    let current = 0;
    let tempStreak = 0;
    
    // Calculate Best Streak
    const allDates: string[] = [];
    if (sortedDates.length > 0) {
        const startStr = sortedDates[0] as string;
        const start = new Date(startStr + 'T00:00:00');
        const end = new Date();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            allDates.push(getLocalDateString(d));
        }
    }

    allDates.forEach(date => {
        if (datesWithSessions.has(date)) {
            tempStreak++;
            best = Math.max(best, tempStreak);
        } else {
            tempStreak = 0;
        }
    });

    // Calculate Current Streak
    const today = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (datesWithSessions.has(today)) {
        let checkDate = new Date();
        while (datesWithSessions.has(getLocalDateString(checkDate))) {
            current++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
    } else if (datesWithSessions.has(yesterdayStr)) {
        let checkDate = new Date(yesterday);
        while (datesWithSessions.has(getLocalDateString(checkDate))) {
            current++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
    }

    return { current, best };
  }, [sessions]);

  const changeDate = (offset: number) => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + offset);
    setSelectedDate(getLocalDateString(date));
  };

  return (
    <div className="flex flex-col h-full space-y-6">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-none">
            <div className="bg-slate-900/50 p-1 rounded-xl border border-white/10 flex gap-1">
                <button 
                    onClick={() => setViewMode('overview')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'overview' ? `bg-${typeof accent === 'string' ? accent : 'cyan'}-600 text-white shadow-lg` : 'text-slate-400 hover:text-white'}`}
                >
                    <Activity size={14} /> Insights
                </button>
                <button 
                    onClick={() => setViewMode('daily')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'daily' ? `bg-${typeof accent === 'string' ? accent : 'cyan'}-600 text-white shadow-lg` : 'text-slate-400 hover:text-white'}`}
                >
                    <List size={14} /> Daily Log
                </button>
            </div>

            {viewMode === 'overview' && (
                <div className="flex gap-2">
                    {(['today', 'week', 'month', 'all'] as TimeRange[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${range === r ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <AnimatePresence mode="wait">
        {viewMode === 'overview' ? (
            <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar"
            >
                {/* 1. Key Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-8 bg-${typeof accent === 'string' ? accent : 'cyan'}-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50`} />
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Focus</p>
                            <h3 className="text-2xl font-mono font-bold text-white">{totalHours.toFixed(1)}<span className="text-sm text-slate-500 ml-1">h</span></h3>
                        </div>
                        <Clock className={`absolute bottom-4 right-4 text-${typeof accent === 'string' ? accent : 'cyan'}-500/20`} size={32} />
                    </div>
                    
                    <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Avg</p>
                            <h3 className="text-2xl font-mono font-bold text-white">{dailyAverage.toFixed(1)}<span className="text-sm text-slate-500 ml-1">h</span></h3>
                        </div>
                        <Activity className="absolute bottom-4 right-4 text-emerald-500/20" size={32} />
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-orange-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Top Subject</p>
                            <h3 className="text-xl font-bold text-white truncate">{topSubject?.name || '-'}</h3>
                        </div>
                        <TrendingUp className="absolute bottom-4 right-4 text-orange-500/20" size={32} />
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-blue-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deep Work</p>
                            <h3 className="text-2xl font-mono font-bold text-white">{sessionQuality.long.toFixed(0)}<span className="text-sm text-slate-500 ml-1">%</span></h3>
                        </div>
                        <Zap className="absolute bottom-4 right-4 text-blue-500/20" size={32} />
                    </div>
                </div>

                {/* 2. Consistency Grid & Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-3 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 bg-${typeof accent === 'string' ? accent : 'cyan'}-500/20 rounded-lg text-${typeof accent === 'string' ? accent : 'cyan'}-400`}>
                                    <Calendar size={18} />
                                </div>
                                <h3 className="font-bold text-slate-200">Consistency Grid</h3>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">Past 12 Months</span>
                        </div>
                        
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                            <YearlyHeatmap sessions={sessions} />
                        </div>
                    </div>

                    {/* Streak Stats Sidebar */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 bg-orange-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                                    <Flame size={20} className="fill-orange-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Streak</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-mono font-bold text-white">{streaks.current}</span>
                                <span className="text-sm text-slate-500 font-medium">days</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 bg-amber-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                                    <Trophy size={20} className="fill-amber-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Best Streak</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-mono font-bold text-white">{streaks.best}</span>
                                <span className="text-sm text-slate-500 font-medium">days</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-1 relative overflow-hidden group flex-1">
                            <div className="absolute top-0 right-0 p-8 bg-blue-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Clock size={20} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lifetime Focus</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-mono font-bold text-white">{(sessions.reduce((acc, s) => acc + s.durationMs, 0) / 3600000).toFixed(0)}</span>
                                <span className="text-sm text-slate-500 font-medium">hours</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. New Colorful Insights Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Hourly Focus Rhythm */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Clock size={18} /></div>
                                <h3 className="font-bold text-slate-200">Hourly Focus Rhythm</h3>
                            </div>
                        </div>
                        <div className="flex-1 flex items-end gap-[2px] h-40 w-full relative">
                            {hourlyActivity.map((h, i) => (
                                <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(5, h.percent)}%` }}
                                        transition={{ duration: 0.6, delay: 0.2 + (i * 0.02) }}
                                        className={`w-full rounded-t-sm transition-all duration-300 ${h.percent > 0 ? `bg-gradient-to-t from-${typeof accent === 'string' ? accent : 'cyan'}-600/50 to-${typeof accent === 'string' ? accent : 'cyan'}-400` : 'bg-slate-800/30'}`}
                                    />
                                    {/* Hover info */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                        <div className="bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] whitespace-nowrap text-white font-mono">
                                            {h.label}: {formatDurationSimple(h.ms)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 uppercase font-bold mt-2 px-1">
                            <span>12 AM</span>
                            <span>6 AM</span>
                            <span>12 PM</span>
                            <span>6 PM</span>
                            <span>12 AM</span>
                        </div>
                    </div>

                    {/* Topic Mastery (Ranking) */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-fuchsia-500/20 rounded-lg text-fuchsia-400"><Target size={18} /></div>
                                <h3 className="font-bold text-slate-200">Topic Mastery</h3>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 max-h-[180px]">
                            {subjectRanking.map((sub, i) => {
                                const isHex = isHexColor(sub.color);
                                return (
                                    <motion.div 
                                        key={sub.id} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + (i * 0.1) }}
                                        className="w-full group"
                                    >
                                        <div className="flex justify-between items-center text-xs mb-1.5">
                                            <span className="font-bold text-slate-300">{sub.name}</span>
                                            <span className="font-mono text-slate-500">{formatDurationSimple(sub.ms)}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${sub.percent}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full ${!isHex ? sub.color.replace('text-','bg-') : ''}`}
                                                style={isHex ? { backgroundColor: sub.color } : {}}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {subjectRanking.length === 0 && <div className="text-slate-500 text-xs text-center py-8">No session data available.</div>}
                        </div>
                    </div>

                </div>

                {/* 4. Session Quality (Existing but polished) */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Zap size={18} /></div>
                        <h3 className="font-bold text-slate-200">Deep Work Ratio</h3>
                    </div>
                    
                    <div className="space-y-6">
                        {/* Long */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-300 font-bold">Deep Work (&gt;50m)</span>
                                <span className="text-emerald-400 font-mono font-bold">{sessionQuality.long.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${sessionQuality.long}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                            </div>
                        </div>
                        {/* Medium */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-400">Core Focus (25-50m)</span>
                                <span className="text-blue-400 font-mono">{sessionQuality.medium.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${sessionQuality.medium}%` }} transition={{ duration: 1 }} className="h-full bg-blue-500/60" />
                            </div>
                        </div>
                        {/* Short */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-500">Quick Sessions (&lt;25m)</span>
                                <span className="text-slate-400 font-mono">{sessionQuality.short.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${sessionQuality.short}%` }} transition={{ duration: 1 }} className="h-full bg-slate-600/50" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        ) : (
            <motion.div 
                key="daily"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full overflow-hidden"
            >
                {/* Date Controls */}
                <div className="flex items-center justify-between mb-4 bg-white/5 backdrop-blur-md border border-white/5 p-3 rounded-xl flex-none">
                   <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-lg"><ArrowRight size={16} className="rotate-180"/></button>
                   <div className="flex items-center gap-2">
                       <Calendar size={16} className={`text-${typeof accent === 'string' ? accent : 'cyan'}-400`} />
                       <span className="font-mono font-bold text-white">{selectedDate === getLocalDateString() ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric'})}</span>
                   </div>
                   <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-lg"><ArrowRight size={16}/></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
                    <div className="h-[400px] mb-8 bg-slate-950/30 rounded-2xl border border-white/5 p-4">
                        <DailyTimeline 
                            sessions={selectedDateSessions} 
                            subjects={subjects} 
                            className="h-full"
                        />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Session Records</h2>
                    </div>
                    <HistoryList 
                        sessions={selectedDateSessions} 
                        subjects={subjects} 
                        onDeleteSession={requestDeleteFromList}
                    />
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Confirmation Modal for List Deletion */}
        {deleteConfirmationId && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Session?</h3>
                        <p className="text-slate-400 text-sm">
                            Are you sure you want to delete this session from your history?
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeleteConfirmationId(null)}
                            className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDeleteFromList}
                            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-lg shadow-red-900/20"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
