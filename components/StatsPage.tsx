
import React, { useState, useMemo } from 'react';
import { StudySession, Subject, isHexColor, getLocalDateString } from '../types';
import { BarChart2, TrendingUp, Clock, Activity, Zap, Calendar, ArrowRight, Layout, List, PieChart, AlertTriangle, Layers, Flame, Target, Trophy, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SubjectDonut } from './SubjectDonut';
import { DailyTimeline } from './DailyTimeline';
import { HistoryList } from './HistoryList';
import { YearlyHeatmap } from './YearlyHeatmap';
import { dbService } from '../services/db';
import { FocusDNA } from './FocusDNA';

interface StatsPageProps {
  sessions: StudySession[];
  subjects: Subject[];
  onDataUpdate?: () => void;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';
type ViewMode = 'overview' | 'daily' | 'dna';

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

  // --- Weekly Stats Check ---
  const weeklyStats = useMemo(() => {
    if (range !== 'week') return null;
    const totalMs = filteredSessions.reduce((acc, s) => acc + s.durationMs, 0);
    
    const byDay: Record<string, number> = {};
    filteredSessions.forEach(s => {
      byDay[s.dateString] = (byDay[s.dateString] || 0) + s.durationMs;
    });
    const bestDay = Object.entries(byDay).sort((a,b) => b[1] - a[1])[0];
    const bestDayName = bestDay ? new Date(bestDay[0] + 'T00:00:00').toLocaleDateString(undefined, {weekday: 'long'}) : 'N/A';
    
    const bySubject: Record<string, number> = {};
    filteredSessions.forEach(s => {
      bySubject[s.subjectId] = (bySubject[s.subjectId] || 0) + s.durationMs;
    });
    const topSubjectId = Object.entries(bySubject).sort((a,b) => b[1] - a[1])[0]?.[0];
    const topSub = subjects.find(s => s.id === topSubjectId);
    
    const weakSubjectId = Object.entries(bySubject).sort((a,b) => a[1] - b[1])[0]?.[0];
    const weakSub = subjects.find(s => s.id === weakSubjectId);
    
    const daysStudied = Object.keys(byDay).length;
    
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 13);
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    const lastWeekMs = sessions
      .filter(s => {
        const t = new Date(s.dateString + 'T00:00:00').getTime();
        return t >= lastWeekStart.getTime() && t <= lastWeekEnd.getTime();
      })
      .reduce((acc, s) => acc + s.durationMs, 0);
    
    const vsLastWeek = lastWeekMs === 0 ? null : ((totalMs - lastWeekMs) / lastWeekMs) * 100;

    return { 
      totalMs, bestDayName, topSub, weakSub, 
      daysStudied, vsLastWeek, bestDayMs: bestDay?.[1] || 0
    };
  }, [filteredSessions, sessions, subjects, range]);

  // --- Focus Quality by day ---
  const focusQualityByDay = useMemo(() => {
    const byDay: Record<string, number[]> = {};
    filteredSessions.forEach(s => {
      if (s.focusScore) {
        if (!byDay[s.dateString]) byDay[s.dateString] = [];
        byDay[s.dateString].push(s.focusScore);
      }
    });
    return Object.entries(byDay).map(([date, scores]) => ({
      date,
      avg: scores.reduce((a,b) => a+b, 0) / scores.length,
      label: new Date(date + 'T00:00:00').toLocaleDateString(undefined, {weekday: 'narrow'})
    })).sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredSessions]);

  // --- Consistency Score ---
  const consistencyScore = useMemo(() => {
    if (range === 'today') return null;
    const days = range === 'week' ? 7 : range === 'month' ? 30 : new Set(sessions.map(s => s.dateString)).size || 1;
    const activeDays = new Set(filteredSessions.map(s => s.dateString)).size;
    return Math.round((activeDays / days) * 100);
  }, [filteredSessions, sessions, range]);

  return (
    <div className="flex flex-col h-full space-y-6">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-none">
            <div className="bg-slate-900/50 p-1 rounded-xl border border-white/10 flex flex-wrap gap-1">
                <button 
                    onClick={() => setViewMode('overview')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'overview' ? `bg-${accent}-600 text-white shadow-lg` : 'text-slate-400 hover:text-white'}`}
                >
                    <Activity size={14} /> Insights
                </button>
                <button 
                    onClick={() => setViewMode('daily')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'daily' ? `bg-${accent}-600 text-white shadow-lg` : 'text-slate-400 hover:text-white'}`}
                >
                    <List size={14} /> Daily Log
                </button>
                <button
                  onClick={() => setViewMode('dna')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'dna' ? `bg-${accent}-500/20 text-${accent}-300 border border-${accent}-500/30` : 'text-slate-400 hover:text-white bg-white/5'}`}
                >
                  🧬 Focus DNA
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
        {viewMode === 'overview' && (
            <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar relative pb-32 md:pb-0"
            >
                {filteredSessions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 mt-12">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center mb-4 text-slate-500">
                            <BarChart2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No study sessions yet</h3>
                        <p className="text-sm max-w-sm mx-auto mb-6">
                            {range !== 'all' ? "Try switching to 'All Time' or start a study session!" : "Your stats will appear here once you start studying."}
                        </p>
                        <button 
                            onClick={() => { if (onDataUpdate) onDataUpdate() }}
                            className={`px-6 py-3 rounded-xl bg-${accent}-600 text-white font-bold text-sm shadow-lg shadow-${accent}-500/20 hover:bg-${accent}-500 transition-colors flex items-center gap-2`}
                        >
                            Start Studying <ArrowRight size={16} />
                        </button>
                    </div>
                ) : (
                <div className="">
                    {/* Weekly Summary */}
                    {range === 'week' && weeklyStats && (
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/10 rounded-2xl p-5 mb-6">
  
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2`}>
                                <Sparkles size={14} className={`text-${accent}-400`} />
                                Weekly Summary
                                </h3>
                                {weeklyStats.vsLastWeek !== null && (
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${weeklyStats.vsLastWeek >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {weeklyStats.vsLastWeek >= 0 ? '↑' : '↓'}
                                    {Math.abs(weeklyStats.vsLastWeek).toFixed(0)}% vs last week
                                </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-black/20 rounded-xl p-3">
                                <div className="text-xs text-slate-500 mb-1">Total Hours</div>
                                <div className="text-2xl font-mono font-bold text-white">
                                    {(weeklyStats.totalMs / 3600000).toFixed(1)}h
                                </div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-3">
                                <div className="text-xs text-slate-500 mb-1">Days Studied</div>
                                <div className="text-2xl font-mono font-bold text-white">
                                    {weeklyStats.daysStudied}/7
                                </div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-3">
                                <div className="text-xs text-slate-500 mb-1">Best Day</div>
                                <div className="text-sm font-bold text-white truncate">
                                    {weeklyStats.bestDayName}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {weeklyStats.bestDayMs > 0 ? (weeklyStats.bestDayMs/3600000).toFixed(1)+'h' : '–'}
                                </div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-3">
                                <div className="text-xs text-slate-500 mb-1">Top Subject</div>
                                <div className="text-sm font-bold text-white truncate">
                                    {weeklyStats.topSub?.name || '–'}
                                </div>
                                </div>
                            </div>

                            {weeklyStats.weakSub && weeklyStats.topSub && weeklyStats.weakSub.id !== weeklyStats.topSub.id && (
                                <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2">
                                <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-300/80">
                                    <span className="font-bold text-amber-300">
                                    {weeklyStats.weakSub.name}
                                    </span> needs more attention this week. You spent the least time on it.
                                </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 1. Key Metrics Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-8 bg-${accent}-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50`} />
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Focus</p>
                            <h3 className="text-2xl font-mono font-bold text-white">{totalHours.toFixed(1)}<span className="text-sm text-slate-500 ml-1">h</span></h3>
                        </div>
                        <Clock className={`absolute bottom-4 right-4 text-${accent}-500/20`} size={32} />
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

                    {consistencyScore !== null && (
                    <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-8 rounded-full blur-xl -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-50 ${consistencyScore > 70 ? 'bg-emerald-500/10' : consistencyScore > 40 ? 'bg-amber-500/10' : 'bg-red-500/10'}`} />
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consistency</p>
                            <h3 className={`text-2xl font-mono font-bold ${consistencyScore > 70 ? 'text-emerald-400' : consistencyScore > 40 ? 'text-amber-400' : 'text-red-400'}`}>{consistencyScore}<span className="text-sm text-slate-500 ml-1">%</span></h3>
                        </div>
                        <Calendar className="absolute bottom-4 right-4 text-slate-500/20" size={32} />
                    </div>
                    )}
                </div>

                {/* Activity Trend Bar Chart (New) */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col my-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 bg-${accent}-500/20 rounded-lg text-${accent}-400`}>
                                <BarChart2 size={18} />
                            </div>
                            <h3 className="font-bold text-slate-200">Activity Trend</h3>
                        </div>
                    </div>
                    <div className="h-48 w-full relative flex items-end gap-2 pb-6 px-2">
                        {dailyAverage > 0 && (
                            <div 
                                className="absolute left-0 w-full border-t border-dashed border-white/20 z-0 flex items-center justify-end pr-2"
                                style={{ bottom: `calc(1.5rem + ${(dailyAverage / (maxTrendValue || 1)) * 100}% - 1px)` }}
                            >
                                <div className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1 -translate-y-1/2">Avg: {dailyAverage.toFixed(1)}h</div>
                            </div>
                        )}
                        
                        {trendData.map((d, i) => {
                            const isAboveAvg = d.value >= dailyAverage;
                            const isToday = d.date === getLocalDateString();
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative z-10 group min-w-[20px]">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(d.value / (maxTrendValue || 1)) * 100}%` }}
                                        transition={{ duration: 0.6, delay: i * 0.02 }}
                                        className={`w-full rounded-t-md transition-all duration-300 min-h-[4px]
                                            ${isAboveAvg ? `bg-${accent}-500` : 'bg-slate-600'}
                                            ${isToday ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}
                                        `}
                                    />
                                    <div className="absolute -bottom-6 text-[10px] text-slate-500 uppercase font-bold text-center w-full truncate">
                                        {range === 'week' ? d.weekDay : d.label}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                        <div className="bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] whitespace-nowrap text-white font-mono">
                                            {d.fullDate}: {d.value.toFixed(1)}h
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 2. Consistency Grid & Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div id="stats-heatmap" className="xl:col-span-3 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 bg-${accent}-500/20 rounded-lg text-${accent}-400`}>
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
                                        className={`w-full rounded-t-sm transition-all duration-300 ${h.percent > 0 ? `bg-gradient-to-t from-${accent}-600/50 to-${accent}-400` : 'bg-slate-800/30'}`}
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

                {/* 4. Session Quality & Focus Quality */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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

                {/* Focus Quality Trend */}
                {(range === 'week' || range === 'month') && focusQualityByDay.length > 0 && (
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Activity size={18} /></div>
                            <h3 className="font-bold text-slate-200">Focus Quality</h3>
                        </div>
                        <div className="flex-1 flex items-end gap-2 h-full py-4 pb-0">
                            {focusQualityByDay.map((d, i) => {
                                const roundedVal = Math.round(d.avg);
                                const vColor = roundedVal === 3 ? 'bg-emerald-500' : roundedVal === 2 ? 'bg-amber-500' : 'bg-red-500';
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative gap-2 min-w-[12px]">
                                        <div className="w-full relative flex-1 flex items-end bg-slate-800/30 rounded-t-lg overflow-hidden">
                                            <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(d.avg / 3) * 100}%` }}
                                                transition={{ duration: 0.6, delay: i * 0.05 }}
                                                className={`w-full ${vColor} opacity-80 rounded-t-lg transition-all`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{d.label}</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                            <div className="bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] whitespace-nowrap text-white font-mono">
                                                {d.date}: Score {d.avg.toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                </div>
                </div>
                )}
            </motion.div>
        )}
        {viewMode === 'dna' && (
            <motion.div
                key="dna"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md mx-auto py-4 w-full"
            >
                <FocusDNA sessions={sessions} subjects={subjects} />
            </motion.div>
        )}
        {viewMode === 'daily' && (
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
                       <Calendar size={16} className={`text-${accent}-400`} />
                       <span className="font-mono font-bold text-white">{selectedDate === getLocalDateString() ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric'})}</span>
                   </div>
                   <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-lg"><ArrowRight size={16}/></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative pb-32 md:pb-0">
                    <div className="">
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
