import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { dbService } from '../services/db';
import { StudySession, Task, Subject, DailyNote } from '../types';
import { ReportCard } from './ReportCard';
import { useTheme } from '../contexts/ThemeContext';

interface ReportAlbumProps {
    subjects: Subject[];
    onClose: () => void;
}

export const ReportAlbum: React.FC<ReportAlbumProps> = ({ subjects, onClose }) => {
    const { accent } = useTheme();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<DailyNote[]>([]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const allSessions = await dbService.getAllSessions();
            const allTasks = await dbService.getTasks();
            const allNotes = await dbService.getAllDailyNotes();
            
            setSessions(allSessions);
            setTasks(allTasks);
            setNotes(allNotes);

            const dates = new Set<string>();
            allSessions.forEach(s => dates.add(s.dateString));
            allTasks.forEach(t => { if (t.dateString) dates.add(t.dateString); });
            allNotes.forEach(n => dates.add(n.dateString));

            setAvailableDates(Array.from(dates).sort().reverse());
        };
        loadData();
    }, []);

    const getDayData = (date: string) => {
        const note = notes.find(n => n.dateString === date);
        return {
            dateString: date,
            sessions: sessions.filter(s => s.dateString === date),
            tasks: tasks.filter(t => t.dateString === date),
            subjects: subjects,
            dayStartTime: note?.dayStartTime
        };
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-[#0f172a] flex flex-col"
        >
            {/* Header */}
            <div className="flex-none p-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Report Album</h1>
                    <p className="text-slate-400 text-sm">Your journey, archived.</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {availableDates.map(date => {
                        const dayData = getDayData(date);
                        const totalMs = dayData.sessions.reduce((acc, s) => acc + s.durationMs, 0);
                        const hours = Math.floor(totalMs / 3600000);
                        const mins = Math.floor((totalMs % 3600000) / 60000);
                        const note = notes.find(n => n.dateString === date);

                        return (
                            <motion.div
                                key={date}
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedDate(date)}
                                className="bg-slate-900 border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/10 transition-all group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 p-16 bg-${accent}-500/5 rounded-full blur-2xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity`} />
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-white/5 rounded-lg text-slate-300">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="text-xs font-mono text-slate-500">
                                        {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <div className="text-2xl font-bold text-white">
                                        {hours}h <span className="text-lg text-slate-500">{mins}m</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Focus Time</div>
                                </div>

                                {note && (
                                    <div className="mt-3 pt-3 border-t border-white/5">
                                        <p className="text-xs text-slate-400 line-clamp-2 italic">"{note.content}"</p>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedDate && (
                    <ReportCard 
                        {...getDayData(selectedDate)}
                        onClose={() => setSelectedDate(null)}
                        isEditable={true} // Allow editing past notes? Yes.
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
