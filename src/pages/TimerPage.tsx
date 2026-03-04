
import React from 'react';
import { 
    Maximize2, Target, PanelLeftClose, PanelLeftOpen, 
    CheckSquare, GraduationCap 
} from 'lucide-react';
import { useGlobalContext } from '../contexts/GlobalContext';
import { useTheme } from '../contexts/ThemeContext';
import { SubjectPicker } from '../components/SubjectPicker';
import { TimerDisplay } from '../components/TimerDisplay';
import { MobileDrawer } from '../components/MobileDrawer';
import { GoalChecklist } from '../components/GoalChecklist';
import { ExamList } from '../components/ExamList';
import { getLocalDateString } from '../types';

import { useTimer } from '../contexts/TimerContext';

export const TimerPage: React.FC = () => {
    const { 
        subjects, 
        enableZenMode, wallpaper, isZenActive, setIsZenActive,
        isSidePanelCollapsed, setIsSidePanelCollapsed,
        sidePanelTab, setSidePanelTab,
        dailyTotalMs, todaysTasks, loadTasks, targetHours,
        exams, handleDeleteExam, loadExams
    } = useGlobalContext();

    const { 
        currentSubjectId, setSubjectId, status, 
        elapsedMs, mode, isOvertime, currentSubjectTodayTotal, currentSubject,
        handleStartRequest, pause, handleStopRequest, setMode, 
        timerDurations, setTimerDurations
    } = useTimer();

    const { accent: themeAccent } = useTheme();

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className="flex-none py-2 flex justify-center relative z-20">
                <div className="bg-slate-900/30 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-xl max-w-[95%]">
                    <SubjectPicker 
                        subjects={subjects} 
                        selectedId={currentSubjectId} 
                        onSelect={setSubjectId} 
                        disabled={status !== 'idle'} 
                        variant="horizontal" 
                    />
                </div>
            </div>
            <div className="flex-1 flex flex-col relative rounded-3xl mt-6 z-10 justify-center items-center">
                <TimerDisplay 
                    elapsedMs={elapsedMs} 
                    status={status} 
                    mode={mode}
                    isOvertime={isOvertime}
                    todaySubjectTotal={currentSubjectTodayTotal}
                    subjectColor={currentSubject.color} 
                    onStart={handleStartRequest} 
                    onPause={pause} 
                    onStop={handleStopRequest} 
                    onSetMode={setMode}
                    durations={timerDurations}
                    onUpdateDurations={setTimerDurations}
                    isWallpaperMode={false}
                    sidePanel={
                        <div className={`hidden md:flex transition-all duration-500 ease-in-out flex-col bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden ${isSidePanelCollapsed ? 'w-14' : 'w-80'} h-full hover:bg-slate-900/40`}>
                            <div className="flex-none flex items-center justify-between p-3 border-b border-white/5">
                                {!isSidePanelCollapsed && (
                                    <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-white/5">
                                        <button 
                                            onClick={() => setSidePanelTab('goals')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${sidePanelTab === 'goals' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Goals
                                        </button>
                                        <button 
                                            onClick={() => setSidePanelTab('exams')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${sidePanelTab === 'exams' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Exams
                                        </button>
                                    </div>
                                )}
                                <button onClick={() => setIsSidePanelCollapsed(!isSidePanelCollapsed)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 ml-auto" title={isSidePanelCollapsed ? "Expand" : "Collapse"}>
                                    {isSidePanelCollapsed ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                                </button>
                            </div>
                            {!isSidePanelCollapsed ? (
                                <div className="flex-1 overflow-hidden relative">
                                    <div className="absolute inset-0 p-4 overflow-y-auto custom-scrollbar">
                                        {sidePanelTab === 'goals' ? (
                                            <GoalChecklist dailyTotalMs={dailyTotalMs} tasks={todaysTasks} onTaskUpdate={loadTasks} selectedDate={getLocalDateString()} targetHours={targetHours} variant="compact" />
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><GraduationCap size={14}/> Upcoming Exams</span>
                                                </div>
                                                <ExamList exams={exams} subjects={subjects} variant="compact" onDelete={handleDeleteExam} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center gap-4 pt-4">
                                    <button onClick={() => { setSidePanelTab('goals'); setIsSidePanelCollapsed(false); }} className={`p-2 rounded-xl hover:bg-white/10 ${sidePanelTab === 'goals' ? `text-${themeAccent}-400` : 'text-slate-400'}`} title="Goals"><CheckSquare size={20} /></button>
                                    <button onClick={() => { setSidePanelTab('exams'); setIsSidePanelCollapsed(false); }} className={`p-2 rounded-xl hover:bg-white/10 ${sidePanelTab === 'exams' ? `text-${themeAccent}-400` : 'text-slate-400'}`} title="Exams"><GraduationCap size={20} /></button>
                                </div>
                            )}
                        </div>
                    }
                />
                {enableZenMode && wallpaper && status === 'running' && !isZenActive && (
                    <button onClick={() => setIsZenActive(true)} className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-${themeAccent}-500/10 text-${themeAccent}-400 border border-${themeAccent}-500/20 text-xs font-semibold hover:bg-${themeAccent}-500/20 transition-all`}>
                        <Maximize2 size={14} /> Enter Zen Mode
                    </button>
                )}
            </div>
            
            <div className="md:hidden">
                <MobileDrawer />
            </div>
        </div>
    );
};
