export interface TooltipConfig {
  targetId: string;
  title: string;
  description: string;
  position?: 'top'|'bottom'|'left'|'right';
}

export const TUTORIAL_TOOLTIPS: Record<string, TooltipConfig[]> = {
  dashboard: [
    {
      targetId: 'dashboard-start-btn',
      title: 'Start a Session',
      description: 'Tap here to begin a focus session. Your time will be tracked and saved automatically.',
      position: 'bottom'
    },
    {
      targetId: 'dashboard-goal-ring',
      title: 'Daily Goal',
      description: 'This ring shows your progress toward today\'s study goal. Set your target in Settings.',
      position: 'bottom'
    },
    {
      targetId: 'dashboard-quick-actions',
      title: 'Quick Actions',
      description: 'Jump to any feature from here. Timer, Planner, Syllabus — all one tap away.',
      position: 'top'
    },
  ],
  timer: [
    {
      targetId: 'timer-modes',
      title: 'Timer Modes',
      description: 'Choose Pomodoro (25 min focus), Short Break, Long Break, or Stopwatch mode.',
      position: 'bottom'
    },
    {
      targetId: 'timer-subject-picker',
      title: 'Select Subject',
      description: 'Pick what you\'re studying so your time is tracked by subject in Stats.',
      position: 'bottom'
    },
  ],
  syllabus: [
    {
      targetId: 'syllabus-import-btn',
      title: 'Import Syllabus',
      description: 'Click Browse Presets to import the complete JEE or NEET syllabus in one click!',
      position: 'bottom'
    },
    {
      targetId: 'syllabus-topic-status',
      title: 'Track Topics',
      description: 'Click any topic dot to cycle through: Not Started → In Progress → Done → Needs Revision.',
      position: 'right'
    },
  ],
  social: [
    {
      targetId: 'social-study-room-btn',
      title: 'Study Rooms',
      description: 'Create or join a room to study with friends. Share the 6-digit code with anyone!',
      position: 'bottom'
    },
    {
      targetId: 'social-add-friend-btn',
      title: 'Add Friends',
      description: 'Search by username to add friends. See when they\'re online and studying in real-time.',
      position: 'bottom'
    },
  ],
  calendar: [
    {
      targetId: 'plan-add-exam',
      title: 'Add Your Exam',
      description: 'Add your exam date here and the app will help you track readiness and plan your study schedule.',
      position: 'bottom'
    },
    {
      targetId: 'plan-goals',
      title: 'Daily Goals',
      description: 'Set daily tasks here. Uncompleted tasks automatically move to Backlog the next day.',
      position: 'left'
    },
  ],
  habits: [
    {
      targetId: 'habits-add-btn',
      title: 'Build Habits',
      description: 'Add daily habits like revision, exercise, or sleep. Track your streak over time.',
      position: 'bottom'
    },
  ],
  journal: [
    {
      targetId: 'journal-mood',
      title: 'Log Your Mood',
      description: 'Track how you feel each day. Spot patterns between mood and study performance in Stats.',
      position: 'bottom'
    },
  ],
  exams: [
    {
      targetId: 'exam-countdown',
      title: 'Exam Countdown',
      description: 'See how many days until your exam. Your Readiness Score updates automatically as you study.',
      position: 'bottom'
    },
  ],
};
