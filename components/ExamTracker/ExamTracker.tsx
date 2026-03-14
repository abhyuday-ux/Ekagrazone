import React, { useState } from 'react';
import { Subject, Exam } from '../../types';
import { ExamCountdown } from './ExamCountdown';
import { MockTestAnalytics } from './MockTestAnalytics';
import { useTheme } from '../../contexts/ThemeContext';
import { Calendar, BarChart3 } from 'lucide-react';

interface ExamTrackerProps {
    subjects: Subject[];
    exams: Exam[];
    onUpdate: () => void;
}

export const ExamTracker: React.FC<ExamTrackerProps> = ({ subjects, exams, onUpdate }) => {
    const { accent } = useTheme();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8 pb-24">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Exam Tracker</h1>
                <p className="text-slate-400 text-sm">Manage countdowns and analyze your mock test performance.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-slate-900/50 backdrop-blur-md rounded-xl border border-white/10 mb-8 w-full md:w-fit">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'upcoming' 
                            ? `bg-${accent}-500 text-white shadow-lg shadow-${accent}-500/20` 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }
                    `}
                >
                    <Calendar size={16} /> Upcoming Exams
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'history' 
                            ? `bg-${accent}-500 text-white shadow-lg shadow-${accent}-500/20` 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }
                    `}
                >
                    <BarChart3 size={16} /> Mock Test History
                </button>
            </div>

            {/* Content Area */}
            <div id="exam-countdown" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'upcoming' ? (
                    <ExamCountdown subjects={subjects} exams={exams} onUpdate={onUpdate} />
                ) : (
                    <MockTestAnalytics subjects={subjects} />
                )}
            </div>
        </div>
    );
};
