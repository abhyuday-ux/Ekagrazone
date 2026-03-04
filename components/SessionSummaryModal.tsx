import React, { useState } from 'react';
import { Save, X, Star, Zap, Brain, Coffee } from 'lucide-react';
import { StudySession, Subject } from '../types';

interface SessionSummaryModalProps {
    session: StudySession;
    onSave: (session: StudySession) => void;
    onDiscard: () => void;
    subjects: Subject[];
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({ session, onSave, onDiscard, subjects }) => {
    const [focusScore, setFocusScore] = useState<1 | 2 | 3>(2);
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        onSave({ ...session, focusScore });
    };

    const subject = subjects.find(s => s.id === session.subjectId);
    const durationMinutes = Math.round(session.durationMs / 60000);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Session Complete!</h2>
                        <p className="text-slate-400 text-sm">Great job staying focused.</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 size={24} className="text-emerald-400" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Subject</div>
                        <div className="text-white font-medium flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${subject?.color.startsWith('#') ? '' : subject?.color}`} style={subject?.color.startsWith('#') ? {backgroundColor: subject?.color} : {}} />
                            {subject?.name || 'Unknown'}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Duration</div>
                        <div className="text-white font-medium">{durationMinutes} min</div>
                    </div>
                </div>

                {/* Focus Score */}
                <div className="mb-6">
                    <label className="text-xs text-slate-400 font-bold uppercase mb-3 block">How was your focus?</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => setFocusScore(1)}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${focusScore === 1 ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-slate-800/50 border-white/5 text-slate-500 hover:bg-slate-800'}`}
                        >
                            <Coffee size={20} />
                            <span className="text-[10px] font-bold">Distracted</span>
                        </button>
                        <button 
                            onClick={() => setFocusScore(2)}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${focusScore === 2 ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800/50 border-white/5 text-slate-500 hover:bg-slate-800'}`}
                        >
                            <Brain size={20} />
                            <span className="text-[10px] font-bold">Good</span>
                        </button>
                        <button 
                            onClick={() => setFocusScore(3)}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${focusScore === 3 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/50 border-white/5 text-slate-500 hover:bg-slate-800'}`}
                        >
                            <Zap size={20} />
                            <span className="text-[10px] font-bold">Deep Work</span>
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onDiscard}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={18} /> Discard
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Save Session
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper for CheckCircle2 since it wasn't imported
const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);
