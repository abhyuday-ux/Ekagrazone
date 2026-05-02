import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronLeft, Sparkles, CheckCircle2, Circle, SkipForward, Trash2, RefreshCw, Clock, BookOpen, Target } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Exam, Subject, SyllabusSubject, StudyPlan, StudyPlanDay, StudyPlanTopic, getLocalDateString } from '../types';
import { dbService } from '../services/db';

function generateStudyPlan(
  exam: Exam,
  syllabusSubjects: SyllabusSubject[],
  subjects: Subject[],
  hoursPerDay: number,
  skipWeekends: boolean,
  topicsPerDay: number
): StudyPlanDay[] {

  const today = new Date();
  today.setHours(0,0,0,0);
  const examDate = new Date(exam.date + 'T00:00:00');
  examDate.setHours(0,0,0,0);

  // Step 1: Get all available study days
  const studyDays: string[] = [];
  const current = new Date(today);
  current.setDate(current.getDate() + 1); // Start from tomorrow
  while (current < examDate) {
    const dayOfWeek = current.getDay();
    if (!skipWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
      studyDays.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  if (studyDays.length === 0) return [];

  // Step 2: Get incomplete topics per subject
  interface SubjectTopics {
    subjectId: string;
    topics: StudyPlanTopic[];
    weight: number;
  }

  const subjectTopicsList: SubjectTopics[] = exam.subjectIds
    .map(subjectId => {
      const sylSub = syllabusSubjects.find(s => s.subjectId === subjectId);
      if (!sylSub) return null;

      const incompleteTopics: StudyPlanTopic[] = [];
      sylSub.chapters.forEach(ch => {
        ch.topics.forEach(t => {
          if (t.status !== 'done') {
            incompleteTopics.push({
              topicId: t.id,
              topicName: t.name,
              chapterId: ch.id,
              chapterName: ch.name,
              subjectId,
              done: false
            });
          }
        });
      });

      const totalTopics = sylSub.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
      const doneTopics = sylSub.chapters.reduce((acc, ch) => acc + ch.topics.filter(t => t.status === 'done').length, 0);
      const completion = totalTopics > 0 ? doneTopics / totalTopics : 0;
      const weight = totalTopics > 0 ? (1 - completion) * totalTopics : 0;

      return { subjectId, topics: incompleteTopics, weight };
    })
    .filter(Boolean) as SubjectTopics[];

  // Step 3: Calculate total weight and days per subject
  const totalWeight = subjectTopicsList.reduce((acc, s) => acc + s.weight, 0);
  
  if (totalWeight === 0) return studyDays.map(date => ({
    date,
    subjectId: exam.subjectIds[0] || '',
    topics: [],
    hoursAllocated: hoursPerDay,
    isSkipped: false,
    note: 'All topics completed! Use for revision.'
  }));

  // Step 4: Distribute topics across days
  const planDays: StudyPlanDay[] = [];
  
  const topicQueues = subjectTopicsList.map(s => ({
    subjectId: s.subjectId,
    queue: [...s.topics],
    daysAllocated: Math.max(1, Math.round((s.weight / totalWeight) * studyDays.length))
  }));

  let dayIndex = 0;
  let subjectRotation = 0;

  for (const date of studyDays) {
    if (dayIndex >= studyDays.length) break;

    let attempts = 0;
    let chosenSubject = topicQueues[subjectRotation % topicQueues.length];
    
    while (chosenSubject.queue.length === 0 && attempts < topicQueues.length) {
      subjectRotation++;
      attempts++;
      chosenSubject = topicQueues[subjectRotation % topicQueues.length];
    }

    const dayTopics = chosenSubject.queue.splice(0, topicsPerDay);

    planDays.push({
      date,
      subjectId: chosenSubject.subjectId,
      topics: dayTopics,
      hoursAllocated: hoursPerDay,
      isSkipped: false
    });

    subjectRotation++;
    dayIndex++;
  }

  return planDays;
}

interface SmartPlannerProps {
  exams: Exam[];
  subjects: Subject[];
  syllabusSubjects: SyllabusSubject[];
  targetHours: number;
}

export const SmartPlanner: React.FC<SmartPlannerProps> = ({ exams, subjects, syllabusSubjects, targetHours }) => {
  const { accent } = useTheme();
  
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string|null>(null);
  const [view, setView] = useState<'plans'|'create'|'detail'>('plans');
  const [loading, setLoading] = useState(true);

  const [selectedExamId, setSelectedExamId] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(targetHours || 6);
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [topicsPerDay, setTopicsPerDay] = useState(3);
  const [generating, setGenerating] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    const data = await dbService.getStudyPlans();
    setPlans(data);
    setLoading(false);
  };
  
  useEffect(() => { loadPlans(); }, []);

  const handleGenerate = async () => {
    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;
    setGenerating(true);
    
    const days = generateStudyPlan(
      exam, syllabusSubjects, subjects,
      hoursPerDay, skipWeekends, topicsPerDay
    );

    const plan: StudyPlan = {
      id: crypto.randomUUID(),
      examId: exam.id,
      examTitle: exam.title,
      examDate: exam.date,
      days,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      hoursPerDay,
      skipWeekends
    };

    await dbService.saveStudyPlan(plan);
    await loadPlans();
    setSelectedPlanId(plan.id);
    setView('detail');
    setGenerating(false);
    
    // Reset form
    setSelectedExamId('');
    setHoursPerDay(targetHours || 6);
    setSkipWeekends(false);
    setTopicsPerDay(3);
  };

  const handleMarkTopicDone = async (planId: string, dayIndex: number, topicIndex: number) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    const updated = {...plan, updatedAt: Date.now()};
    updated.days = [...plan.days];
    updated.days[dayIndex] = {...updated.days[dayIndex]};
    updated.days[dayIndex].topics = [...updated.days[dayIndex].topics];
    updated.days[dayIndex].topics[topicIndex] = {
      ...updated.days[dayIndex].topics[topicIndex],
      done: !updated.days[dayIndex].topics[topicIndex].done
    };
    
    await dbService.saveStudyPlan(updated);
    setPlans(prev => prev.map(p => p.id === planId ? updated : p));
  };

  const handleToggleSkipDay = async (planId: string, dayIndex: number) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const updated = {...plan, updatedAt: Date.now()};
    updated.days = [...plan.days];
    updated.days[dayIndex] = {
      ...updated.days[dayIndex],
      isSkipped: !updated.days[dayIndex].isSkipped
    };
    await dbService.saveStudyPlan(updated);
    setPlans(prev => prev.map(p => p.id === planId ? updated : p));
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm("Are you sure you want to delete this study plan?")) {
      await dbService.deleteStudyPlan(planId);
      await loadPlans();
      if (selectedPlanId === planId) {
        setView('plans');
        setSelectedPlanId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-slate-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  const upcomingExams = exams.filter(e => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const examDate = new Date(e.date + 'T00:00:00');
    return examDate >= today;
  });

  if (view === 'plans') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6 pt-4"
      >
        <div className="flex justify-between items-center px-2">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <Sparkles className={`text-${accent}-400`} size={20} />
                 Smart Planner
             </h2>
             <p className="text-sm text-slate-400 mt-1">AI-generated day-by-day schedules.</p>
          </div>
          {plans.length > 0 && (
             <button
               onClick={() => setView('create')}
               className={`flex items-center gap-2 px-4 py-2 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-xl transition-all shadow-lg shadow-${accent}-500/20 text-sm font-bold`}
             >
               <PlusIcon /> New Plan
             </button>
          )}
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
             <div className={`w-20 h-20 bg-${accent}-500/10 border border-${accent}-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(var(--${accent}-500),0.2)]`}>
                <CalendarDays size={36} className={`text-${accent}-400`} />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">No study plans yet</h3>
             <p className="text-slate-400 max-w-sm mb-8">Generate a personalized day-by-day plan to ensure you cover all topics before your exam.</p>
             <button
               onClick={() => setView('create')}
               className={`flex items-center gap-2 px-6 py-3 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-xl transition-all shadow-lg shadow-${accent}-500/20 font-bold text-lg group`}
             >
               Create My First Plan <Sparkles size={18} className="group-hover:scale-110 transition-transform" />
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => {
               const completedTopics = plan.days.flatMap(d => d.topics).filter(t => t.done).length;
               const totalTopics = plan.days.flatMap(d => d.topics).length;
               const progress = totalTopics > 0 ? Math.round((completedTopics/totalTopics)*100) : 0;
               
               const today = new Date();
               today.setHours(0,0,0,0);
               const examDate = new Date(plan.examDate + 'T00:00:00');
               const daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));

               return (
                 <motion.div
                   key={plan.id}
                   whileHover={{ y: -2 }}
                   className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col group relative overflow-hidden"
                 >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                       <div>
                         <h3 className="font-bold text-lg text-white mb-1">{plan.examTitle}</h3>
                         <div className="flex items-center gap-2 text-xs text-slate-400">
                           <CalendarDays size={14} />
                           {plan.examDate} • {daysRemaining} days remaining
                         </div>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-red-400 p-2 transition-colors">
                           <Trash2 size={16} />
                       </button>
                    </div>

                    <div className="mt-auto pt-4 relative z-10">
                       <div className="flex justify-between text-xs mb-2">
                           <span className="text-slate-400">Progress</span>
                           <span className={`text-${accent}-400 font-bold`}>{progress}% ({completedTopics}/{totalTopics})</span>
                       </div>
                       <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
                           <div className={`bg-${accent}-500 h-full rounded-full`} style={{ width: `${progress}%` }} />
                       </div>
                       
                       <button 
                         onClick={() => { setSelectedPlanId(plan.id); setView('detail'); }}
                         className={`w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all border border-white/5 flex items-center justify-center gap-2 group-hover:border-${accent}-500/30`}
                       >
                         View Plan <ChevronLeft size={16} className="rotate-180" />
                       </button>
                    </div>
                 </motion.div>
               );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  if (view === 'create') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-2xl mx-auto pt-4 pb-12"
      >
         <button onClick={() => setView('plans')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium">
             <ChevronLeft size={16} /> Back
         </button>

         <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Sparkles className={`text-${accent}-400`} /> Create Study Plan
         </h2>

         <div className="space-y-8">
            {/* Step 1 */}
            <section className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
               <div className="flex items-center gap-3 mb-6">
                 <div className={`w-8 h-8 rounded-full bg-${accent}-500/20 text-${accent}-400 flex items-center justify-center font-bold`}>1</div>
                 <h3 className="text-lg font-bold text-white">Which exam are you preparing for?</h3>
               </div>

               {upcomingExams.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 border border-white/5 rounded-2xl bg-white/5 text-sm">
                    No upcoming exams found. <br />
                    Add one in the Exam Tracker first!
                  </div>
               ) : (
                 <div className="grid grid-cols-1 gap-3">
                   {upcomingExams.map(exam => {
                     const isSelected = selectedExamId === exam.id;
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     const examDate = new Date(exam.date + 'T00:00:00');
                     const daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
                     
                     return (
                       <button
                         key={exam.id}
                         onClick={() => setSelectedExamId(exam.id)}
                         className={`flex flex-col text-left p-4 rounded-2xl transition-all border ${isSelected ? `bg-${accent}-500/10 border-${accent}-500 shadow-[0_0_20px_rgba(var(--${accent}-500),0.1)]` : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                       >
                         <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-white">{exam.title}</span>
                           {isSelected && <CheckCircle2 size={18} className={`text-${accent}-500`} />}
                         </div>
                         <span className="text-xs text-slate-400">{exam.date} • {daysRemaining} days remaining</span>
                       </button>
                     );
                   })}
                 </div>
               )}
            </section>

            {/* Step 2 */}
            <section className={`bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl transition-opacity ${selectedExamId ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
               <div className="flex items-center gap-3 mb-6">
                 <div className={`w-8 h-8 rounded-full bg-${accent}-500/20 text-${accent}-400 flex items-center justify-center font-bold`}>2</div>
                 <h3 className="text-lg font-bold text-white">Configure your plan</h3>
               </div>

               <div className="space-y-6">
                 <div>
                   <label className="flex justify-between text-sm font-medium text-slate-300 mb-4">
                     <span>Study hours per day</span>
                     <span className={`text-${accent}-400 font-bold`}>{hoursPerDay}h</span>
                   </label>
                   <input 
                     type="range"
                     min="1" max="12" step="0.5"
                     value={hoursPerDay}
                     onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                     className={`w-full accent-${accent}-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer`}
                   />
                 </div>

                 <div className="pt-4 border-t border-white/5">
                   <label className="block text-sm font-medium text-slate-300 mb-3">Topics per study day</label>
                   <div className="flex gap-2">
                     {[ {v: 2, l: '2 (Easy)'}, {v: 3, l: '3 (Balanced)'}, {v: 5, l: '5 (Intensive)'} ].map(opt => (
                       <button
                         key={opt.v}
                         onClick={() => setTopicsPerDay(opt.v)}
                         className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${topicsPerDay === opt.v ? `bg-${accent}-500/20 border-${accent}-500/50 text-${accent}-300` : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                       >
                         {opt.l}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                   <div>
                     <div className="text-sm font-medium text-white mb-0.5">Skip weekends</div>
                     <div className="text-xs text-slate-500">Don't schedule topics on Sat/Sun</div>
                   </div>
                   <button
                     onClick={() => setSkipWeekends(!skipWeekends)}
                     className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${skipWeekends ? `bg-${accent}-500` : 'bg-slate-700'}`}
                   >
                     <motion.div 
                       className="w-4 h-4 bg-white rounded-full bg-white shadow-sm absolute left-1"
                       animate={{ x: skipWeekends ? 24 : 0 }}
                       transition={{ type: "spring", stiffness: 500, damping: 30 }}
                     />
                   </button>
                 </div>
               </div>
            </section>

            {/* Step 3 */}
            <div className={`transition-opacity ${selectedExamId ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedExamId}
                className={`w-full py-4 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(var(--${accent}-500),0.2)] hover:shadow-[0_0_50px_rgba(var(--${accent}-500),0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group`}
              >
                {generating ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <>Generate My Study Plan <Sparkles className="group-hover:scale-110 transition-transform" /></>
                )}
              </button>
            </div>
         </div>
      </motion.div>
    );
  }

  // Detail View
  const plan = plans.find(p => p.id === selectedPlanId);
  if (view === 'detail' && plan) {
    const completedTopics = plan.days.flatMap(d => d.topics).filter(t => t.done).length;
    const totalTopics = plan.days.flatMap(d => d.topics).length;
    const progress = totalTopics > 0 ? Math.round((completedTopics/totalTopics)*100) : 0;
    const todayStr = getLocalDateString();
    
    // Group days by week
    const weeks: { weekNum: number; days: StudyPlanDay[] }[] = [];
    let currentWeekNum = 1;
    let currentWeekDays: StudyPlanDay[] = [];
    
    plan.days.forEach((day, index) => {
       if (index > 0 && index % 7 === 0) {
           weeks.push({ weekNum: currentWeekNum, days: currentWeekDays });
           currentWeekNum++;
           currentWeekDays = [];
       }
       currentWeekDays.push(day);
    });
    if (currentWeekDays.length > 0) weeks.push({ weekNum: currentWeekNum, days: currentWeekDays });

    const todayPlan = plan.days.find(d => d.date === todayStr);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-3xl mx-auto pt-4 pb-12"
      >
         <div className="flex justify-between items-start mb-8">
             <div>
                <button onClick={() => { setView('plans'); setSelectedPlanId(null); }} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors text-sm font-medium">
                    <ChevronLeft size={16} /> Back to Plans
                </button>
                <div className="flex items-center gap-3 mb-2">
                   <h2 className="text-2xl font-bold text-white tracking-tight">{plan.examTitle}</h2>
                   <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-slate-300 font-medium">Until {plan.examDate}</span>
                </div>
                
                <div className="flex items-center gap-4 mt-4 w-64">
                   <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                      <div className={`bg-${accent}-500 h-full rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                   </div>
                   <div className={`text-sm font-bold text-${accent}-400`}>{progress}%</div>
                </div>
             </div>

             <div className="flex gap-2">
               <button onClick={() => handleDeletePlan(plan.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
               </button>
             </div>
         </div>

         {/* Today Section */}
         {todayPlan && (
           <div className={`mb-10 bg-slate-900/60 backdrop-blur-xl border-2 border-${accent}-500/30 p-6 rounded-3xl shadow-[0_0_30px_rgba(var(--${accent}-500),0.1)] relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${accent}-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>
              
              <div className="flex items-center gap-2 mb-6">
                 <CalendarDays className={`text-${accent}-400`} size={20} />
                 <h3 className="text-lg font-bold text-white">Today's Plan</h3>
                 {todayPlan.isSkipped && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">Skipped</span>}
              </div>

              {!todayPlan.isSkipped ? (
                 <div className="space-y-4">
                    {todayPlan.topics.map((topic, i) => {
                       const subject = subjects.find(s => s.id === topic.subjectId);
                       const originalDayIndex = plan.days.findIndex(d => d.date === todayStr);

                       return (
                         <div key={topic.topicId} className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${topic.done ? 'bg-white/5' : 'bg-slate-800/80 hover:bg-slate-800'}`}>
                           <button 
                             onClick={() => handleMarkTopicDone(plan.id, originalDayIndex, i)}
                             className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${topic.done ? `bg-${accent}-500 border-${accent}-500 text-white` : 'border-slate-500 text-transparent hover:border-slate-400'}`}
                           >
                             <CheckCircle2 size={14} className={topic.done ? "opacity-100" : "opacity-0"} />
                           </button>
                           <div className="min-w-0 flex-1">
                             <div className={`text-sm font-medium truncate ${topic.done ? 'text-slate-400 line-through' : 'text-white'}`}>{topic.topicName}</div>
                             <div className="flex items-center gap-2 mt-0.5">
                               {subject && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />}
                               <span className="text-[10px] text-slate-500 truncate">{subject?.name || 'Subject'} • {topic.chapterName}</span>
                             </div>
                           </div>
                         </div>
                       );
                    })}
                    {todayPlan.topics.length === 0 && (
                      <div className="text-sm text-slate-400 py-2 italic">{todayPlan.note || "No topics scheduled today."}</div>
                    )}
                 </div>
              ) : (
                <div className="text-sm text-slate-500 py-4 italic">You skipped today's study plan.</div>
              )}
           </div>
         )}


         {/* Timeline */}
         <div className="space-y-12">
            {weeks.map((week, weekIndex) => (
               <div key={weekIndex}>
                  <div className="flex items-center gap-4 mb-6">
                     <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest pl-2">Week {week.weekNum}</h4>
                     <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="space-y-4 pl-4 border-l-2 border-white/5 ml-2">
                     {week.days.map((day, dayIndexInWeek) => {
                        const originalDayIndex = weekIndex * 7 + dayIndexInWeek;
                        const isPast = day.date < todayStr;
                        const isToday = day.date === todayStr;
                        const allDone = day.topics.length > 0 && day.topics.every(t => t.done);
                        const isEmpty = day.topics.length === 0;

                        return (
                          <div key={day.date} className="relative pl-6">
                             {/* Timeline dot */}
                             <div className={`absolute w-3 h-3 rounded-full -left-[23px] top-4 border-2 border-slate-950 ${
                                isToday ? `bg-${accent}-400` : 
                                allDone ? 'bg-emerald-500' : 
                                isPast ? 'bg-slate-700' : 'bg-slate-500'
                             }`} />

                             <div className={`bg-slate-900/40 border border-white/5 p-4 rounded-2xl transition-all ${isPast && !allDone && !isEmpty ? 'opacity-70' : ''} ${isToday ? `border-${accent}-500/30 bg-${accent}-500/5` : ''}`}>
                                <div className="flex justify-between items-center mb-3 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`font-mono text-xs font-bold px-2 py-1 rounded-md ${isToday ? `bg-${accent}-500/20 text-${accent}-300` : isPast ? 'bg-white/5 text-slate-500' : 'bg-white/10 text-slate-300'}`}>
                                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                      {isToday && " (Today)"}
                                    </div>
                                    {!day.isSkipped && allDone && !isEmpty && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10} /> Complete</span>}
                                    {day.isSkipped && <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><SkipForward size={10} /> Skipped</span>}
                                    {isPast && !allDone && !day.isSkipped && !isEmpty && <span className="text-amber-500 text-[10px] font-bold">Incomplete</span>}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                     <button 
                                       onClick={() => handleToggleSkipDay(plan.id, originalDayIndex)}
                                       className="text-[10px] text-slate-500 hover:text-slate-300 font-medium px-2 py-1 rounded bg-white/5 transition-colors"
                                     >
                                       {day.isSkipped ? 'Unskip' : 'Skip Day'}
                                     </button>
                                  </div>
                                </div>

                                {!day.isSkipped && (
                                   <div className="space-y-2">
                                      {day.topics.map((topic, i) => {
                                         const subject = subjects.find(s => s.id === topic.subjectId);
                                         return (
                                           <div key={topic.topicId} className="flex items-start gap-3 group">
                                             <button 
                                               onClick={() => handleMarkTopicDone(plan.id, originalDayIndex, i)}
                                               className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${topic.done ? `bg-${accent}-500/20 border-${accent}-500 text-${accent}-400` : 'border-slate-600 text-transparent hover:border-slate-400'}`}
                                             >
                                               {topic.done && <CheckCircle2 size={10} />}
                                             </button>
                                             <div className="min-w-0 flex-1 flex flex-col">
                                                <span className={`text-sm block truncate group-hover:whitespace-normal transition-all ${topic.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                                  {topic.topicName}
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                  {subject && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />}
                                                  <span className="text-[10px] text-slate-500">{topic.chapterName}</span>
                                                </div>
                                             </div>
                                           </div>
                                         );
                                      })}
                                      {day.topics.length === 0 && <span className="text-xs text-slate-500 italic">{day.note || "Free day"}</span>}
                                   </div>
                                )}
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </div>
            ))}
         </div>
      </motion.div>
    );
  }

  return null;
};

// Simple Plus icon helper
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <line x1="12" y1="5" x2="12" y2="19"></line>
       <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
