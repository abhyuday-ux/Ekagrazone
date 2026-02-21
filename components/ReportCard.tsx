import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, PenLine, Download } from 'lucide-react';
import { StudySession, Subject, Task } from '../types';
import { dbService } from '../services/db';
import { useTheme } from '../contexts/ThemeContext';
import { usePerformance } from '../contexts/PerformanceContext';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Memoized Chart Components ---

const HourlyChart = React.memo(({ data, subjects, isHighQuality }: { data: any[], subjects: Subject[], isHighQuality: boolean }) => (
    <div className="flex-1 w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={20}>
                <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#52525b', fontSize: 10 }} 
                    interval={0}
                />
                {isHighQuality && (
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#e4e4e7', fontSize: '12px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                )}
                {subjects.map((sub, idx) => (
                    <Bar 
                        key={sub.id} 
                        dataKey={sub.name} 
                        stackId="a" 
                        fill={sub.color} 
                        radius={idx === subjects.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                        isAnimationActive={isHighQuality} 
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    </div>
));

const SubjectPieChart = React.memo(({ data, subjects, isHighQuality }: { data: any[], subjects: Subject[], isHighQuality: boolean }) => (
    <div className="flex-1 w-full min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={isHighQuality}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                {isHighQuality && (
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#e4e4e7', fontSize: '12px' }}
                    />
                )}
            </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
                <div className="text-xs font-bold text-white">{subjects.length}</div>
                <div className="text-[8px] text-zinc-500 uppercase">Subs</div>
            </div>
        </div>
    </div>
));

interface ReportCardProps {
    dateString: string;
    sessions: StudySession[];
    tasks: Task[];
    subjects: Subject[];
    onClose: () => void;
    isEditable?: boolean;
    triggerConfetti?: boolean;
    dayStartTime?: number | null;
    challengeTitle?: string;
    challengeDayNumber?: number;
    variant?: 'modal' | 'preview';
}

export const ReportCard = React.memo<ReportCardProps>(({ 
    dateString, 
    sessions, 
    tasks, 
    subjects, 
    onClose, 
    isEditable = true,
    triggerConfetti = false,
    dayStartTime,
    challengeTitle = "MAINS GRIND DAY",
    challengeDayNumber = 1,
    variant = 'modal'
}) => {
    const { accent } = useTheme();
    const { isHighQuality } = usePerformance();
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadNote = async () => {
            const savedNote = await dbService.getDailyNote(dateString);
            if (savedNote) {
                setNote(savedNote.content);
            }
        };
        loadNote();

        if (triggerConfetti && variant === 'modal') {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#6366f1', '#a855f7', '#ec4899']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#6366f1', '#a855f7', '#ec4899']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [dateString, triggerConfetti, variant]);

    const handleSave = async () => {
        setIsSaving(true);
        await dbService.saveDailyNote({
            id: dateString,
            dateString,
            content: note,
            updatedAt: Date.now(),
            dayStartTime: dayStartTime || undefined
        });
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleDownload = async () => {
        if (cardRef.current) {
            try {
                const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: '#000000' });
                const link = document.createElement('a');
                link.download = `ekagra-report-${dateString}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error('Failed to download report card', err);
            }
        }
    };

    // --- Stats Calculations (Memoized) ---
    const { totalHours, totalMinutes, totalSeconds } = useMemo(() => {
        const totalDurationMs = sessions.reduce((acc, s) => acc + s.durationMs, 0);
        return {
            totalHours: Math.floor(totalDurationMs / 3600000),
            totalMinutes: Math.floor((totalDurationMs % 3600000) / 60000),
            totalSeconds: Math.floor((totalDurationMs % 60000) / 1000)
        };
    }, [sessions]);

    const { completedTasks, taskCompletionRate } = useMemo(() => {
        const completed = tasks.filter(t => t.status === 'done').length;
        const total = tasks.length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completedTasks: completed, taskCompletionRate: rate };
    }, [tasks]);

    const topSubject = useMemo(() => {
        if (sessions.length === 0) return null;
        const subjectTimes: Record<string, number> = {};
        sessions.forEach(s => {
            subjectTimes[s.subjectId] = (subjectTimes[s.subjectId] || 0) + s.durationMs;
        });
        const topId = Object.keys(subjectTimes).reduce((a, b) => subjectTimes[a] > subjectTimes[b] ? a : b);
        return subjects.find(s => s.id === topId);
    }, [sessions, subjects]);

    // --- Hourly Chart Data (Memoized) ---
    const hourlyData = useMemo(() => {
        // Create 24 hour slots
        const hours = Array(24).fill(0).map((_, i) => {
            const label = i === 0 ? '12am' : i === 12 ? '12pm' : i > 12 ? `${i-12}pm` : `${i}am`;
            const slot: any = { hour: i, label, totalMinutes: 0 };
            subjects.forEach(sub => slot[sub.name] = 0);
            return slot;
        });

        sessions.forEach(s => {
            const sub = subjects.find(sub => sub.id === s.subjectId);
            if (!sub) return;

            const start = new Date(s.startTime);
            const end = new Date(s.endTime);
            let current = new Date(start);

            while (current < end) {
                const hour = current.getHours();
                const nextHour = new Date(current);
                nextHour.setHours(hour + 1, 0, 0, 0);
                
                const segmentEnd = nextHour < end ? nextHour : end;
                const duration = segmentEnd.getTime() - current.getTime();
                const durationMins = duration / 60000;
                
                if (hours[hour]) {
                    hours[hour][sub.name] = (hours[hour][sub.name] || 0) + durationMins;
                    hours[hour].totalMinutes += durationMins;
                }
                current = segmentEnd;
            }
        });
        
        const result = hours.map(h => {
            const newH = { ...h };
            subjects.forEach(sub => {
                if (newH[sub.name]) newH[sub.name] = Math.round(newH[sub.name]);
            });
            return newH;
        });

        const firstActivityHour = result.findIndex(h => h.totalMinutes > 0);
        const startHour = dayStartTime 
            ? Math.max(0, new Date(dayStartTime).getHours() - 1) 
            : (firstActivityHour !== -1 ? Math.max(0, firstActivityHour - 1) : 6);
            
        const lastActivityHour = [...result].reverse().findIndex(h => h.totalMinutes > 0);
        const lastIndex = lastActivityHour === -1 ? 23 : 23 - lastActivityHour;
        const currentHour = new Date().getHours();
        const displayEnd = Math.min(23, Math.max(lastIndex + 1, currentHour + 1));

        return result.slice(startHour, displayEnd + 1);
    }, [sessions, dayStartTime, subjects]);

    // --- Subject Pie Chart Data (Memoized) ---
    const subjectData = useMemo(() => {
        const data: { name: string; value: number; color: string }[] = [];
        subjects.forEach(sub => {
            const duration = sessions.filter(s => s.subjectId === sub.id).reduce((acc, s) => acc + s.durationMs, 0);
            if (duration > 0) {
                data.push({
                    name: sub.name,
                    value: duration,
                    color: sub.color
                });
            }
        });
        return data;
    }, [sessions, subjects]);

    const formattedDate = new Date(dateString).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const containerClasses = variant === 'modal' 
        ? "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
        : "relative w-full flex flex-col gap-4";

    const cardContainerClasses = variant === 'modal'
        ? "w-full max-w-6xl flex flex-col gap-4 max-h-[90vh]"
        : "w-full flex flex-col gap-4";

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={containerClasses}
        >
            <div className={cardContainerClasses}>
                {variant === 'modal' && (
                    <div className="flex justify-end gap-2 flex-none">
                        <button onClick={handleDownload} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors" title="Download Image">
                            <Download size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className={`flex-1 ${variant === 'modal' ? 'overflow-y-auto custom-scrollbar' : ''} rounded-[2rem]`}>
                    <div ref={cardRef} className="bg-black text-white min-h-[600px] flex flex-col lg:flex-row border border-white/10 shadow-2xl">
                        
                        {/* LEFT SECTION: Notes & Reflections */}
                        <div className="lg:w-1/3 p-8 border-r border-white/10 flex flex-col bg-zinc-950 relative">
                            <div className={`absolute top-0 left-0 w-1 h-full bg-${accent}-500/50`}></div>
                            
                            <div className="mb-8">
                                <h2 className={`text-3xl font-black tracking-tighter text-${accent}-500 mb-1 uppercase leading-none`}>
                                    {challengeTitle} <span className="text-white">[{challengeDayNumber}]</span>
                                </h2>
                                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2 mt-2">
                                    <Calendar size={12} /> {formattedDate}
                                </div>
                            </div>

                            <div className="flex-1 mb-8 overflow-y-auto custom-scrollbar pr-2 min-h-[200px]">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                                    Mission Log
                                </h3>
                                <div className="space-y-4">
                                    {subjects.map(sub => {
                                        const subTasks = tasks.filter(t => t.subjectId === sub.id && t.status === 'done');
                                        if (subTasks.length === 0) return null;
                                        return (
                                            <div key={sub.id}>
                                                <div className="text-sm font-bold mb-1" style={{ color: sub.color }}>{sub.name}</div>
                                                <ul className="space-y-1">
                                                    {subTasks.map(t => (
                                                        <li key={t.id} className="text-xs text-zinc-400 flex items-start gap-2">
                                                            <span className="mt-1 text-zinc-600">&rarr;</span>
                                                            <span>{t.title}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                    {tasks.filter(t => t.status === 'done').length === 0 && (
                                        <div className="text-zinc-600 text-xs italic">No tasks logged yet.</div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <PenLine size={12} /> Reflection
                                    </h3>
                                    {isEditable && (
                                        <button 
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className={`text-[10px] px-2 py-1 rounded bg-${accent}-500/10 text-${accent}-400 hover:bg-${accent}-500/20 transition-colors uppercase font-bold`}
                                        >
                                            {isSaving ? 'Saving...' : 'Save Note'}
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    readOnly={!isEditable}
                                    placeholder="Reflect on your day... What went well? What could be better?"
                                    className="w-full h-32 bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-zinc-300 text-xs resize-none focus:outline-none focus:border-white/10 focus:bg-zinc-900 transition-colors custom-scrollbar font-mono leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* RIGHT SECTION: Precision Analytics */}
                        <div className="lg:w-2/3 p-8 bg-black relative overflow-hidden flex flex-col">
                            {isHighQuality && (
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-${accent}-500/5 rounded-full blur-[100px] pointer-events-none`}></div>
                            )}

                            <div className={`relative z-10 flex-1 border border-${accent}-500/30 rounded-3xl p-6 bg-zinc-950/50 backdrop-blur-sm shadow-[0_0_30px_-10px_rgba(var(--color-${accent}-500),0.15)] flex flex-col gap-6`}>
                                
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6">
                                    <div className="text-center md:text-left">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Focus Time</div>
                                        <div className={`text-5xl md:text-6xl font-black tracking-tighter text-white tabular-nums flex items-baseline gap-1`}>
                                            {String(totalHours).padStart(2, '0')}
                                            <span className="text-2xl text-zinc-600 font-light">:</span>
                                            {String(totalMinutes).padStart(2, '0')}
                                            <span className="text-2xl text-zinc-600 font-light">:</span>
                                            <span className={`text-3xl text-${accent}-500`}>{String(totalSeconds).padStart(2, '0')}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                            <div className={`text-xl font-bold text-${accent}-400`}>{taskCompletionRate}%</div>
                                            <div className="text-[9px] text-zinc-500 uppercase font-bold">Efficiency</div>
                                        </div>
                                        <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                            <div className="text-xl font-bold text-emerald-400">{completedTasks}</div>
                                            <div className="text-[9px] text-zinc-500 uppercase font-bold">Tasks</div>
                                        </div>
                                        <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                            <div className="text-xl font-bold text-blue-400">{topSubject ? topSubject.name.substring(0, 3).toUpperCase() : '-'}</div>
                                            <div className="text-[9px] text-zinc-500 uppercase font-bold">Top Sub</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[200px]">
                                    <div className="md:col-span-2 flex flex-col">
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Hourly Focus Intensity</h3>
                                        <HourlyChart data={hourlyData} subjects={subjects} isHighQuality={isHighQuality} />
                                    </div>

                                    <div className="flex flex-col">
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Distribution</h3>
                                        <SubjectPieChart data={subjectData} subjects={subjects} isHighQuality={isHighQuality} />
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                                    <div>
                                        STATUS: <span className={`text-${accent}-400`}>ONLINE</span>
                                    </div>
                                    <div>
                                        DEEP WORK RATIO: <span className="text-white">{(totalHours > 4 ? 'HIGH' : totalHours > 2 ? 'MED' : 'LOW')}</span>
                                    </div>
                                    <div>
                                        ID: <span className="text-zinc-600">{dateString.replace(/-/g, '')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
