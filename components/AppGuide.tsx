import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, HelpCircle } from 'lucide-react';

export type TourTab = 'dashboard' | 'stats' | 'exams';

interface Step {
  title: string;
  description: string;
  targetId: string;
}

export const TOUR_DATA: Record<string, Step[]> = {
  dashboard: [
    { title: "Focus Timer", description: "Select a subject and start your focus session here.", targetId: "timer-display" },
    { title: "Daily Goals", description: "Track your daily objectives.", targetId: "daily-goals" }
  ],
  timer: [
    { title: "Focus Mode", description: "Visualize your session progress here.", targetId: "timer-circle" },
    { title: "Choose Mode", description: "Switch between Stopwatch and Timer modes.", targetId: "timer-modes" },
    { title: "Controls", description: "Start, pause, or stop your session.", targetId: "timer-controls" }
  ],
  habits: [
    { title: "Habit List", description: "View and track your daily rituals.", targetId: "habits-list" },
    { title: "New Habit", description: "Forge a new habit to build consistency.", targetId: "habits-add-btn" },
    { title: "Stats", description: "Monitor your streaks and completion rates.", targetId: "habits-stats" }
  ],
  journal: [
    { title: "Daily Entry", description: "Reflect on your day, gratitude, and wins.", targetId: "journal-entry-area" },
    { title: "Mood Tracker", description: "Log your current mood and energy levels.", targetId: "journal-mood" },
    { title: "Save Entry", description: "Don't forget to save your reflections!", targetId: "journal-save-btn" }
  ],
  calendar: [
    { title: "Schedule", description: "View your study sessions and heatmaps.", targetId: "plan-calendar" },
    { title: "Milestones", description: "Add upcoming exams and deadlines.", targetId: "plan-add-exam" },
    { title: "Goals", description: "Set and track your daily study targets.", targetId: "plan-goals" }
  ],
  social: [
    { title: "Leaderboard", description: "Compete with others and see where you rank.", targetId: "arena-leaderboard" },
    { title: "Friends & Global", description: "Switch between global rankings and your friend circle.", targetId: "arena-tabs" }
  ],
  timeline: [ // Mapping 'timeline' tab from App.tsx to 'stats' logic
    { title: "Activity Heatmap", description: "Visualize your consistency over the year.", targetId: "stats-heatmap" }
  ],
  exams: [
    { title: "Exam Countdown", description: "Keep track of upcoming deadlines.", targetId: "exam-countdown" }
  ],
  settings: [
    { title: "Preferences", description: "Customize your app experience here.", targetId: "settings-container" },
    { title: "Reset Tutorials", description: "Need a refresher? Reset all guides here.", targetId: "reset-tutorials-btn" }
  ]
};

interface AppGuideProps {
  activeTab: string;
}

export const AppGuide: React.FC<AppGuideProps> = ({ activeTab }) => {
  const [showTour, setShowTour] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const steps = TOUR_DATA[activeTab];

  useEffect(() => {
    if (!steps) return;

    const visitedTabs = JSON.parse(localStorage.getItem('ekagra_visited_tabs') || '{}');
    if (!visitedTabs[activeTab]) {
      // Small delay to allow UI to render
      const timer = setTimeout(() => {
        setShowTour(true);
        setCurrentStepIndex(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, steps]);

  // Pulse effect logic
  useEffect(() => {
    if (!showTour || !steps) return;
    
    const targetId = steps[currentStepIndex].targetId;
    const element = document.getElementById(targetId);
    
    if (element) {
      // Add a temporary ring class for highlighting
      element.classList.add('ring-4', 'ring-violet-500', 'ring-opacity-50', 'transition-all', 'duration-500');
      
      // Smooth scroll to element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return () => {
        element.classList.remove('ring-4', 'ring-violet-500', 'ring-opacity-50', 'transition-all', 'duration-500');
      };
    }
  }, [showTour, currentStepIndex, steps]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setShowTour(false);
    const visitedTabs = JSON.parse(localStorage.getItem('ekagra_visited_tabs') || '{}');
    visitedTabs[activeTab] = true;
    localStorage.setItem('ekagra_visited_tabs', JSON.stringify(visitedTabs));
  };

  if (!showTour || !steps) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <AnimatePresence>
      {showTour && (
        <>
          {/* Mobile Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] md:hidden"
            onClick={handleFinish}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50, x: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[100] md:max-w-sm w-auto md:w-full"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 rounded-2xl shadow-2xl overflow-hidden relative">
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
                <div 
                  className="h-full bg-violet-500 transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                      <HelpCircle size={20} />
                    </div>
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                      Tip {currentStepIndex + 1}/{steps.length}
                    </span>
                  </div>
                  <button 
                    onClick={handleFinish}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {currentStep.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  {currentStep.description}
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    disabled={currentStepIndex === 0}
                    className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                      currentStepIndex === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all"
                  >
                    {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                    {currentStepIndex !== steps.length - 1 && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const resetTours = () => {
  localStorage.removeItem('ekagra_visited_tabs');
  window.location.reload();
};
