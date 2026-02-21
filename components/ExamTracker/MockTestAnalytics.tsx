import React, { useState, useEffect } from 'react';
import { Subject, MockTest, isHexColor } from '../../types';
import { dbService } from '../../services/db';
import { useTheme } from '../../contexts/ThemeContext';
import { MockTestForm } from './MockTestForm';
import { TestAttemptCharts } from './TestAttemptCharts';
import { Plus, BarChart3, Trash2, History, Edit3, CheckCircle2, Calendar, X, Save, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface MockTestAnalyticsProps {
    subjects: Subject[];
}

export const MockTestAnalytics: React.FC<MockTestAnalyticsProps> = ({ subjects }) => {
    const { accent } = useTheme();
    const [tests, setTests] = useState<MockTest[] | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTest, setEditingTest] = useState<MockTest | null>(null);
    const [filterExamType, setFilterExamType] = useState<string>('ALL');
    const [deletingTest, setDeletingTest] = useState<MockTest | null>(null);

    useEffect(() => {
        loadTests();
    }, []);

    const loadTests = async () => {
        const data = await dbService.getMockTests();
        setTests(data);
    };

    const handleSaveSetup = async (newTest: MockTest) => {
        await dbService.saveMockTest(newTest);
        setTests(prevTests => (prevTests ? [...prevTests, newTest] : [newTest]));
        setIsAdding(false);
    };

    const handleDeleteTest = async (testSetup: MockTest) => {
        const idToDelete = testSetup?.id;
        if (!idToDelete) {
            console.error("Attempted to delete a test without an ID.");
            setDeletingTest(null);
            return;
        }

        setDeletingTest(null);

        try {
            await dbService.deleteMockTest(idToDelete);
            // 4. State Management: Update UI after successful deletion
            setTests(prev => prev ? prev.filter(t => t.id !== idToDelete && t.setupId !== idToDelete) : null);
        } catch (error) {
            console.error("Failed to delete test:", error);
        }
    };

    const handleUpdateScore = async (testId: string, attemptDate: string, attemptTime: string, scores: Record<string, number>) => {
        if (!tests) return;
        const setup = tests.find(t => t.id === testId);
        if (!setup) return;

        let totalScore = 0;
        Object.values(scores).forEach((s: number) => totalScore += s);
        const percentage = setup.totalMaxMarks > 0 ? (totalScore / setup.totalMaxMarks) * 100 : 0;

        const attemptTimestamp = new Date(`${attemptDate}T${attemptTime}`).getTime();

        const attemptRecord: MockTest = {
            ...setup,
            id: crypto.randomUUID(),
            setupId: setup.id,
            attemptDate,
            attemptTime,
            attemptTimestamp,
            subjectScores: scores,
            totalScore,
            percentage: Math.round(percentage * 10) / 10,
            createdAt: Date.now()
        };

        await dbService.saveMockTest(attemptRecord);
        setTests(prev => prev ? [...prev, attemptRecord] : [attemptRecord]);
        setEditingTest(null);
    };

    // 1. The 'No-Crash' Filter & 4. The 'indexOf' Specific Fix
    const examTypes = ['ALL', ...new Set((tests || []).map(t => t?.examType).filter(type => type && typeof type === 'string' && type !== 'ALL'))];

    const { attempts: chartTests, setups: historyTests } = React.useMemo(() => {
        if (!tests) return { attempts: [], setups: [] };

        const allAttempts = tests.filter(t => t?.attemptTimestamp !== undefined);
        const allSetups = tests.filter(t => t?.attemptTimestamp === undefined);

        if (filterExamType === 'ALL') {
            return {
                attempts: allAttempts,
                setups: allSetups.sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime()),
            };
        }
        
        const filteredAttempts = allAttempts.filter(test => {
            if (!test || !test.examType) return false;
            return test.examType.includes(filterExamType);
        });
        const filteredSetups = allSetups.filter(test => {
            if (!test || !test.examType) return false;
            return test.examType.includes(filterExamType);
        });

        return {
            attempts: filteredAttempts,
            setups: filteredSetups.sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime()),
        };
    }, [tests, filterExamType]);

    const [expandedChartId, setExpandedChartId] = useState<string | null>(null);

    if (!tests) {
        return <div>Loading tests...</div>; // Or a spinner
    }

    return (
        <div className="space-y-8">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${accent}-500/20 flex items-center justify-center text-${accent}-400 shadow-lg shadow-${accent}-500/10`}>
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none mb-1">Mock Test Ecosystem</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Setup → Attempt → Analyze</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900/50 border border-white/10 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filter:</span>
                        <select 
                            value={filterExamType}
                            onChange={(e) => setFilterExamType(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-200 outline-none appearance-none cursor-pointer"
                        >
                            {examTypes.map((type, idx) => (
                                <option key={`exam-type-${type}-${idx}`} value={type} className="bg-slate-900">{type}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button 
                        onClick={() => setIsAdding(true)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all
                            ${isAdding ? 'hidden' : `bg-${accent}-500 hover:bg-${accent}-600 text-white shadow-lg shadow-${accent}-500/20`}
                        `}
                    >
                        <Plus size={16} /> Define New Test
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isAdding ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <MockTestForm 
                            subjects={subjects} 
                            onSave={handleSaveSetup} 
                            onCancel={() => setIsAdding(false)} 
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-10"
                    >
                        {/* Test Setup Cards */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <History size={14} /> Test Inventory
                                </h4>
                                <span className="text-[10px] text-slate-600 font-mono">{historyTests.length} Setups</span>
                            </div>
                            
                            {historyTests.length === 0 ? (
                                <div className="text-center py-12 bg-slate-900/20 border border-dashed border-white/5 rounded-3xl text-slate-600 text-xs italic">
                                    No test setups defined for this filter. Change the filter or define a new test.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {/* 2. The 'Safe Render' Mapping */}
                                    {historyTests.map((test) => {
                                        if (!test?.id) return null;

                                        const testAttempts = chartTests.filter(a => a.setupId === test.id);
                                        const latestAttempt = testAttempts.sort((a, b) => (b.attemptTimestamp || 0) - (a.attemptTimestamp || 0))[0];
                                        const isExpanded = expandedChartId === test.id;

                                        return (
                                            <div key={test.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 group hover:border-white/10 transition-all shadow-xl relative overflow-hidden flex flex-col">
                                                <div className="flex-grow">
                                                    {latestAttempt && (
                                                        <div className={`absolute -top-10 -right-10 w-20 h-20 bg-${accent}-500/10 blur-3xl rounded-full`} />
                                                    )}
                                                    
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-${accent}-500/10 text-${accent}-400 border border-${accent}-500/20`}>
                                                                    {test.examType}
                                                                </span>
                                                                <h5 className="font-bold text-slate-100 text-base group-hover:text-white transition-colors">{test.title}</h5>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                                <Calendar size={10} />
                                                                Scheduled: {test.date ? new Date(test.date).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setDeletingTest(test)}
                                                            className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5 mb-6">
                                                        {(test.subjectIds || []).map((sid, sidIdx) => {
                                                            const sub = subjects.find(s => s.id === sid);
                                                            if (!sub) return null;
                                                            return (
                                                                <div key={`subject-tag-${test.id}-${sid}-${sidIdx}`} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] text-slate-400 font-bold uppercase">
                                                                    <div className={`w-1 h-1 rounded-full ${isHexColor(sub.color) ? '' : sub.color}`} style={isHexColor(sub.color) ? { backgroundColor: sub.color } : {}} />
                                                                    {sub.name}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <div className="text-xs">
                                                        {latestAttempt ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last Attempt</span>
                                                                <span className="text-slate-200 font-mono">
                                                                    {latestAttempt.attemptDate ? new Date(latestAttempt.attemptDate).toLocaleDateString() : 'N/A'} {latestAttempt.attemptTime || ''}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-600 italic text-[10px]">Not attempted yet</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        {testAttempts.length > 0 && (
                                                            <button 
                                                                onClick={() => setExpandedChartId(isExpanded ? null : test.id)}
                                                                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
                                                            >
                                                                <BarChart3 size={12} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => setEditingTest(test)}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all
                                                                ${latestAttempt 
                                                                    ? `bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10` 
                                                                    : `bg-${accent}-500 text-white shadow-lg shadow-${accent}-500/20 hover:bg-${accent}-600`
                                                                }
                                                            `}
                                                        >
                                                            {latestAttempt ? <Edit3 size={12} /> : <CheckCircle2 size={12} />}
                                                            {latestAttempt ? 'Update Score' : 'Input Score'}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                        animate={{ height: 'auto', opacity: 1, marginTop: '24px' }}
                                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <TestAttemptCharts tests={testAttempts} subjects={subjects} />
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Score Input Modal */}
            <AnimatePresence>
                {editingTest && (
                    <ScoreInputModal 
                        test={editingTest}
                        subjects={subjects}
                        onClose={() => setEditingTest(null)}
                        onSave={handleUpdateScore}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deletingTest && (
                    <DeleteConfirmationModal 
                        testTitle={deletingTest.title}
                        onConfirm={() => handleDeleteTest(deletingTest)}
                        onClose={() => setDeletingTest(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

interface ScoreInputModalProps {
    test: MockTest;
    subjects: Subject[];
    onClose: () => void;
    onSave: (testId: string, attemptDate: string, attemptTime: string, scores: Record<string, number>) => void;
}

const ScoreInputModal: React.FC<ScoreInputModalProps> = ({ test, subjects, onClose, onSave }) => {
    const { accent } = useTheme();
    const [attemptDate, setAttemptDate] = useState(test.attemptDate || new Date().toISOString().split('T')[0]);
    const [attemptTime, setAttemptTime] = useState(test.attemptTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    const [scores, setScores] = useState<Record<string, number>>(test.subjectScores || {});

    const handleScoreChange = (sid: string, val: number) => {
        setScores(prev => ({ ...prev, [sid]: val }));
    };

    const totalScored = Object.values(scores).reduce((acc: number, s: number) => acc + s, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
                <div className={`absolute -top-20 -left-20 w-40 h-40 bg-${accent}-500/10 blur-[100px] rounded-full`} />
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Input Scores</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{test.title} ({test.examType})</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Date of Attempt</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    type="date" 
                                    value={attemptDate}
                                    onChange={(e) => setAttemptDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:border-white/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Time of Attempt</label>
                            <input 
                                type="time" 
                                value={attemptTime}
                                onChange={(e) => setAttemptTime(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Subject Breakdown</label>
                        <div className="grid gap-3">
                            {test.subjectIds.map((sid, idx) => {
                                const sub = subjects.find(s => s.id === sid);
                                if (!sub) return null;
                                const max = test.subjectMaxMarks[sid] || 100;
                                const score = scores[sid] || 0;
                                return (
                                    <div key={`score-input-${sid}-${idx}`} className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isHexColor(sub.color) ? '' : sub.color}`} style={isHexColor(sub.color) ? { backgroundColor: sub.color } : {}} />
                                            <span className="text-sm font-bold text-slate-200">{sub.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="number" 
                                                value={score}
                                                onChange={(e) => handleScoreChange(sid, parseFloat(e.target.value) || 0)}
                                                className="w-20 bg-slate-900 border border-white/10 rounded-xl p-2 text-sm text-white text-center font-mono focus:border-emerald-500/50 outline-none transition-all"
                                            />
                                            <span className="text-slate-600 font-mono text-sm">/ {max}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`bg-${accent}-500/5 border border-${accent}-500/10 rounded-2xl p-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <BarChart3 size={16} className={`text-${accent}-400`} />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Scored</span>
                        </div>
                        <div className="text-xl font-mono font-bold text-white">
                            {totalScored} <span className="text-slate-600 text-sm">/ {test.totalMaxMarks}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => onSave(test.id, attemptDate, attemptTime, scores)}
                        className={`w-full py-4 rounded-2xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 bg-${accent}-500 hover:bg-${accent}-600 shadow-${accent}-500/20`}
                    >
                        <Save size={18} /> Save Attempt Data
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
