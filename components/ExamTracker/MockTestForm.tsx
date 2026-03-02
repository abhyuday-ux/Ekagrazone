import React, { useState, useEffect } from 'react';
import { Subject, MockTest, isHexColor, getLocalDateString } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { Save, X, Check, AlertCircle } from 'lucide-react';

interface MockTestFormProps {
    subjects: Subject[];
    onSave: (test: MockTest) => void;
    onCancel: () => void;
}

export const MockTestForm: React.FC<MockTestFormProps> = ({ subjects, onSave, onCancel }) => {
    const { accent } = useTheme();
    const [title, setTitle] = useState('');
    const [examType, setExamType] = useState('JEE');
    const [date, setDate] = useState(getLocalDateString());
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
    const [subjectMaxMarks, setSubjectMaxMarks] = useState<Record<string, number>>({});

    // Initialize max marks when subjects are selected
    useEffect(() => {
        const newMaxMarks = { ...subjectMaxMarks };
        selectedSubjectIds.forEach(sid => {
            if (!newMaxMarks[sid]) {
                newMaxMarks[sid] = 100; // Default max marks
            }
        });
        setSubjectMaxMarks(newMaxMarks);
    }, [selectedSubjectIds]);

    const toggleSubject = (id: string) => {
        setSelectedSubjectIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleMaxMarksChange = (sid: string, value: number) => {
        setSubjectMaxMarks(prev => ({
            ...prev,
            [sid]: value
        }));
    };

    const handleSubmit = () => {
        if (!title || !date || selectedSubjectIds.length === 0) return;

        let totalMax = 0;
        selectedSubjectIds.forEach(sid => {
            totalMax += subjectMaxMarks[sid] || 0;
        });

        const newTest: MockTest = {
            id: crypto.randomUUID(),
            title,
            examType,
            date,
            subjectIds: selectedSubjectIds,
            subjectMaxMarks,
            totalMaxMarks: totalMax,
            createdAt: Date.now()
        };

        onSave(newTest);
    };

    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-${accent}-500/20 flex items-center justify-center text-${accent}-400`}>
                        <Save size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Step 1: Define Test Setup</h3>
                </div>
                <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Test Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. JEE Advanced Mock #1"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white/20 outline-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Exam Type</label>
                            <select 
                                value={examType}
                                onChange={(e) => setExamType(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white/20 outline-none transition-all appearance-none"
                            >
                                <option value="JEE">JEE</option>
                                <option value="BITSAT">BITSAT</option>
                                <option value="NEET">NEET</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Target Date</label>
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white/20 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Subjects to Include</label>
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
                    {selectedSubjectIds.length === 0 && (
                        <p className="text-[10px] text-rose-400 mt-2 flex items-center gap-1">
                            <AlertCircle size={10} /> Select at least one subject
                        </p>
                    )}
                </div>
            </div>

            {selectedSubjectIds.length > 0 && (
                <div className="border-t border-white/5 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Set Max Marks per Subject</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedSubjectIds.map(sid => {
                            const sub = subjects.find(s => s.id === sid);
                            if (!sub) return null;
                            return (
                                <div key={sid} className="bg-slate-950/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isHexColor(sub.color) ? '' : sub.color}`} style={isHexColor(sub.color) ? { backgroundColor: sub.color } : {}} />
                                        <span className="text-xs font-bold text-slate-300">{sub.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            value={subjectMaxMarks[sid] || 0}
                                            onChange={(e) => handleMaxMarksChange(sid, parseFloat(e.target.value) || 0)}
                                            className="w-16 bg-slate-900 border border-white/10 rounded-lg p-1.5 text-xs text-white text-center font-mono focus:border-white/20 outline-none"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={!title || !date || selectedSubjectIds.length === 0}
                    className={`px-6 py-2 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center gap-2
                        ${(!title || !date || selectedSubjectIds.length === 0) 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : `bg-${accent}-500 hover:bg-${accent}-600 shadow-${accent}-500/20 shadow-lg`
                        }
                    `}
                >
                    Create Test Setup
                </button>
            </div>
        </div>
    );
};
