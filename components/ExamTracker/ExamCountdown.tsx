import React, { useState, useEffect } from 'react';
import { Exam, Subject, isHexColor } from '../../types';
import { dbService } from '../../services/db';
import { useTheme } from '../../contexts/ThemeContext';
import { Calendar, Trash2, Plus, BookOpen, AlertCircle, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExamCountdownProps {
    subjects: Subject[];
    exams: Exam[];
    onUpdate: () => void;
}

export const ExamCountdown: React.FC<ExamCountdownProps> = ({ subjects, exams, onUpdate }) => {
    const { accent } = useTheme();
    const [isAdding, setIsAdding] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

    const handleAddExam = async () => {
        if (!title || !date || selectedSubjectIds.length === 0) return;

        const newExam: Exam = {
            id: crypto.randomUUID(),
            title,
            date,
            subjectIds: selectedSubjectIds,
            topics: '', // Optional/Legacy
            createdAt: Date.now()
        };

        await dbService.saveExam(newExam);
        onUpdate();
        
        // Reset
        setTitle('');
        setDate('');
        setSelectedSubjectIds([]);
        setIsAdding(false);
    };

    const handleDeleteExam = async (id: string) => {
        if (confirm('Delete this exam tracker?')) {
            await dbService.deleteExam(id);
            onUpdate();
        }
    };

    const toggleSubject = (id: string) => {
        setSelectedSubjectIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    // Sort by date
    const sortedExams = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className={`text-${accent}-400`} size={20} />
                    Upcoming Exams
                </h3>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={`p-2 rounded-xl transition-all ${isAdding ? 'bg-red-500/20 text-red-400' : `bg-${accent}-500/20 text-${accent}-400 hover:bg-${accent}-500/30`}`}
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                </button>
            </div>

            {/* Add Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Exam Name</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. JEE Mains Session 1"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white/20 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Exam Date</label>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white/20 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Subjects</label>
                                <div className="flex flex-wrap gap-2">
                                    {subjects.map(sub => {
                                        const isSelected = selectedSubjectIds.includes(sub.id);
                                        return (
                                            <button
                                                key={sub.id}
                                                onClick={() => toggleSubject(sub.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5
                                                    ${isSelected 
                                                        ? `bg-${accent}-500/20 border-${accent}-500/50 text-white` 
                                                        : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/20'
                                                    }
                                                `}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${isHexColor(sub.color) ? '' : sub.color}`} style={isHexColor(sub.color) ? { backgroundColor: sub.color } : {}} />
                                                {sub.name}
                                                {isSelected && <Check size={12} className={`text-${accent}-400`} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button 
                                onClick={handleAddExam}
                                disabled={!title || !date || selectedSubjectIds.length === 0}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all
                                    ${(!title || !date || selectedSubjectIds.length === 0) 
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                        : `bg-${accent}-500 hover:bg-${accent}-600 text-white shadow-lg shadow-${accent}-500/20`
                                    }
                                `}
                            >
                                Add Exam Tracker
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exam List */}
            <div className="space-y-4">
                {sortedExams.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                        <BookOpen className="mx-auto text-slate-600 mb-3" size={32} />
                        <p className="text-slate-500 text-sm">No upcoming exams tracked.</p>
                        <button onClick={() => setIsAdding(true)} className={`mt-2 text-${accent}-400 text-xs font-bold hover:underline`}>
                            Add your first exam
                        </button>
                    </div>
                ) : (
                    sortedExams.map(exam => {
                        const now = Date.now();
                        const examDate = new Date(exam.date).getTime();
                        const createdDate = exam.createdAt || (examDate - (30 * 24 * 60 * 60 * 1000)); // Fallback to 30 days before if no createdAt
                        
                        const totalDuration = examDate - createdDate;
                        const elapsed = now - createdDate;
                        const daysLeft = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
                        
                        // Progress calculation (0 to 100)
                        // If daysLeft < 0, progress is 100
                        const progress = daysLeft <= 0 ? 100 : Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                        
                        const isClose = daysLeft <= 7 && daysLeft >= 0;
                        const isToday = daysLeft === 0;
                        const isPast = daysLeft < 0;

                        return (
                            <div key={exam.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 relative group hover:border-white/10 transition-all overflow-hidden">
                                {/* Progress Bar Background */}
                                <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out ${isClose ? 'bg-rose-500' : isPast ? 'bg-emerald-500' : `bg-${accent}-500`}`} 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1">{exam.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Calendar size={12} />
                                            {new Date(exam.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider
                                        ${isPast ? 'bg-emerald-500/10 text-emerald-400' : isToday ? 'bg-rose-500 text-white animate-pulse' : isClose ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'}
                                    `}>
                                        {isPast ? 'Completed' : isToday ? 'Today!' : `${daysLeft} Days Left`}
                                    </div>
                                </div>

                                {/* Subject Chips */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {exam.subjectIds && exam.subjectIds.map(sid => {
                                        const sub = subjects.find(s => s.id === sid);
                                        if (!sub) return null;
                                        return (
                                            <div key={sid} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300 font-medium">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isHexColor(sub.color) ? '' : sub.color}`} style={isHexColor(sub.color) ? { backgroundColor: sub.color } : {}} />
                                                {sub.name}
                                            </div>
                                        );
                                    })}
                                    {/* Fallback for legacy single subject */}
                                    {/* @ts-ignore */}
                                    {!exam.subjectIds && exam.subjectId && (
                                         <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300 font-medium">
                                            {/* @ts-ignore */}
                                            {(() => { const sub = subjects.find(s => s.id === exam.subjectId); return sub ? <><div className={`w-1.5 h-1.5 rounded-full ${isHexColor(sub.color) ? '' : sub.color}`} style={isHexColor(sub.color) ? { backgroundColor: sub.color } : {}} />{sub.name}</> : null; })()}
                                        </div>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <button 
                                    onClick={() => handleDeleteExam(exam.id)}
                                    className="absolute top-4 right-4 p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
