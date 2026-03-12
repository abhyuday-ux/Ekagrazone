import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { dbService } from '../services/db';
import { UserProfile, StudySession, Task, Subject, DEFAULT_SUBJECTS, getLocalDateString } from '../types';
import { ReportCard } from './ReportCard';
import { Trophy, Calendar, Save, RefreshCw } from 'lucide-react';

export const ChallengeSettings: React.FC = () => {
    const { accent } = useTheme();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        const profile = await dbService.getUserProfile();
        setUserProfile(profile);
        if (profile) {
            setTitle(profile.challengeTitle || "MAINS GRIND DAY");
            setStartDate(profile.challengeStartDate || getLocalDateString());
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await dbService.updateUserProfile({
            challengeTitle: title,
            challengeStartDate: startDate
        });
        // Refresh profile to ensure sync
        await loadProfile();
        setIsSaving(false);
    };

    const challengeDayNumber = useMemo(() => {
        if (!startDate) return 1;
        const start = new Date(startDate + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffTime = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        return Math.max(1, diffDays);
    }, [startDate]);

    // Mock Data for Preview
    const previewSessions: StudySession[] = useMemo(() => [
        { id: '1', subjectId: DEFAULT_SUBJECTS[0].id, startTime: Date.now() - 3600000 * 4, endTime: Date.now() - 3600000 * 3, durationMs: 3600000, dateString: '2024-01-01' },
        { id: '2', subjectId: DEFAULT_SUBJECTS[1].id, startTime: Date.now() - 3600000 * 2, endTime: Date.now() - 3600000 * 1, durationMs: 3600000, dateString: '2024-01-01' },
        { id: '3', subjectId: DEFAULT_SUBJECTS[2].id, startTime: Date.now() - 1800000, endTime: Date.now(), durationMs: 1800000, dateString: '2024-01-01' },
    ], []);

    const previewTasks: Task[] = useMemo(() => [
        { id: '1', title: 'Complete Chapter 5', status: 'done', subjectId: DEFAULT_SUBJECTS[0].id, dateString: '2024-01-01', createdAt: Date.now() },
        { id: '2', title: 'Review Notes', status: 'done', subjectId: DEFAULT_SUBJECTS[1].id, dateString: '2024-01-01', createdAt: Date.now() },
    ], []);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
    }

    return (
        <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
                <div className={`p-2.5 bg-${accent}-500/20 rounded-xl text-${accent}-400`}>
                    <Trophy size={20} />
                </div>
                <span className="font-bold text-lg text-slate-200">Challenge Settings</span>
            </div>

            <div className="flex flex-col gap-8">
                {/* Top Section: Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    {/* Title Input */}
                    <div className="lg:col-span-5 bg-slate-950/30 rounded-2xl p-4 border border-white/5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Challenge Title
                        </label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. MAINS GRIND DAY"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-slate-600 font-medium"
                        />
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            Appears on dashboard & reports.
                        </p>
                    </div>

                    {/* Date Input */}
                    <div className="lg:col-span-4 bg-slate-950/30 rounded-2xl p-4 border border-white/5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Start Date
                        </label>
                        <div className="relative group">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-slate-600 appearance-none relative z-10 bg-transparent"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-300 transition-colors pointer-events-none" size={16} />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full bg-${accent}-500 animate-pulse`}></div>
                            <p className="text-[10px] text-slate-400">
                                Current: <span className={`text-${accent}-400 font-bold`}>DAY {challengeDayNumber}</span>
                            </p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="lg:col-span-3 flex items-stretch">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-full h-full min-h-[100px] lg:min-h-0 rounded-2xl bg-${accent}-500 hover:bg-${accent}-600 text-white font-bold transition-all shadow-lg shadow-${accent}-500/20 flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] group`}
                        >
                            <div className="p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                                {isSaving ? <RefreshCw size={24} className="animate-spin" /> : <Save size={24} />}
                            </div>
                            <span>{isSaving ? 'Saving...' : 'Update Challenge'}</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Section: Full Width Preview */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Live Preview (Full Size)
                        </label>
                        <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5">
                            Auto-generated based on inputs
                        </span>
                    </div>
                    
                    <div className="w-full rounded-3xl overflow-hidden border border-white/10 bg-black relative shadow-2xl group min-h-[700px] flex flex-col">
                        {/* Decorative background elements */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                        <div className={`absolute -top-20 -right-20 w-96 h-96 bg-${accent}-500/10 rounded-full blur-[100px] pointer-events-none`}></div>
                        <div className={`absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none`}></div>
                        
                        {/* Preview Container - Centered and Scaled if needed, but mostly full */}
                        <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center justify-center bg-zinc-950/50 p-8 custom-scrollbar">
                            <div className="transform scale-[0.8] md:scale-90 xl:scale-100 transition-transform duration-500 ease-out shadow-2xl rounded-[2rem] border border-white/5">
                                <ReportCard 
                                    dateString={getLocalDateString()}
                                    sessions={previewSessions}
                                    tasks={previewTasks}
                                    subjects={DEFAULT_SUBJECTS}
                                    onClose={() => {}}
                                    isEditable={false}
                                    triggerConfetti={false}
                                    challengeTitle={title || "MAINS GRIND DAY"}
                                    challengeDayNumber={challengeDayNumber}
                                    variant="preview"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
