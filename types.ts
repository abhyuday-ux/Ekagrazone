
export interface Subject {
  id: string;
  name: string;
  color: string;
  isArchived?: boolean;
}

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  dateString: string; // ISO date string YYYY-MM-DD for grouping
  focusScore?: 1 | 2 | 3; // 1: Struggled, 2: Okay, 3: Deep Work
}

export interface DailyGoal {
  id: string;
  text: string;
  isCompleted: boolean;
  dateString: string; // YYYY-MM-DD
  createdAt: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused';
export type TimerMode = 'stopwatch' | 'pomodoro' | 'short-break' | 'long-break';

export interface TimerDurations {
  pomodoro: number;
  'short-break': number;
  'long-break': number;
}

export const DEFAULT_DURATIONS: TimerDurations = {
    pomodoro: 25,
    'short-break': 5,
    'long-break': 15,
};

export interface ActiveTimerState {
  status: TimerStatus;
  mode: TimerMode;
  subjectId: string;
  startTime: number | null; // The timestamp when the CURRENT running segment started
  startPerfTime?: number | null; // Anti-cheat: performance.now() when segment started
  accumulatedTime: number; // Time accrued before the current segment
}

export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  subjectId: string;
  dateString?: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  order: number;
  archived?: boolean;
  isArchived?: boolean;
}

export interface Exam {
  id: string;
  subjectIds: string[]; // Changed from subjectId to subjectIds
  title: string;
  date: string; // ISO Date YYYY-MM-DD
  topics: string;
  createdAt: number;
}

export interface MockTest {
  id: string;
  setupId?: string; // Links an attempt to its original setup
  title: string;
  examType: string; // e.g. 'JEE', 'BITSAT'
  date: string; // Scheduled/Setup Date (YYYY-MM-DD)
  subjectIds: string[];
  subjectMaxMarks: Record<string, number>;
  totalMaxMarks: number;
  
  // Attempt Data (Step 2)
  attemptDate?: string; // Date of Attempt (YYYY-MM-DD)
  attemptTime?: string; // Time of Attempt (HH:mm)
  attemptTimestamp?: number; // Combined timestamp for graphing
  subjectScores?: Record<string, number>; // Raw marks scored per subject
  totalScore?: number;
  percentage?: number;
  
  createdAt: number;
}



export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface DailyNote {
  id: string; // dateString
  dateString: string;
  content: string;
  updatedAt: number;
  dayStartTime?: number;
}

export interface JournalEntry {
  id: string;
  dateString: string; // YYYY-MM-DD
  energy: number; // 1-5
  stress: number; // 1-5
  mood: 'focused' | 'good' | 'average' | 'tired' | 'distracted' | null;
  gratitude: string[];
  wins: string[];
  challenges: string[];
  lessons: string[];
  highlights: string[];
  notes: string;
  tomorrowFocus: string;
  updatedAt: number;
}

export type HabitCategory = 'study' | 'health' | 'morning' | 'night' | 'personal';
export type HabitFrequency = 'daily' | 'interval' | 'weekly';

export interface Habit {
  id: string;
  title: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  energyLevel: 'low' | 'medium' | 'high';
  completedDates: string[]; // ISO date strings YYYY-MM-DD
  createdAt: number;
}

export interface ActiveGroup {
  id: string;
  name: string;
  userName: string;
  joinedAt: number;
}

export interface CustomSound {
  id: string;
  label: string;
  src: string; // URL or Base64
  isCustom: true;
}

// --- Social & Leaderboard Types ---

export interface UserProfile {
  uid: string;
  username?: string; 
  displayName: string;
  email: string;
  photoURL?: string;
  totalFocusMs: number; // Lifetime focus time
  xp?: number; // Total Experience Points
  level?: number; // Current Level
  lastActive: number;
  challengeTitle?: string;
  challengeStartDate?: string; // ISO Date YYYY-MM-DD
  subscriptionType?: 'monthly' | 'yearly' | 'lifetime';
  dailyGoal?: number; // Daily study goal in hours
  companionName?: string; // Name of the AI companion
}

export type FriendStatus = 'pending_sent' | 'pending_received' | 'accepted';

export interface Friend {
  uid: string;
  status: FriendStatus;
  addedAt: number;
  // Hydrated fields (joined from UserProfile)
  profile?: UserProfile;
  // Realtime fields from RTDB (merged in SocialPanel)
  rtStatus?: {
      isOnline: boolean;
      isFocusing: boolean;
      currentTask?: string;
      todayBaseMs: number;
      currentSessionStart?: number;
      lastSeen: number;
  };
}

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', color: '#3b82f6' },
  { id: 'cs', name: 'Computer Science', color: '#10b981' },
  { id: 'lit', name: 'Literature', color: '#f59e0b' },
  { id: 'phys', name: 'Physics', color: '#a855f7' },
  { id: 'chem', name: 'Chemistry', color: '#f43f5e' },
  { id: 'misc', name: 'General', color: '#64748b' },
];

export const SUBJECT_COLORS = [
  '#64748b', // slate
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

export const isHexColor = (color: string | null | undefined): color is string => typeof color === 'string' && color.startsWith('#');

/**
 * Returns a YYYY-MM-DD string for the local timezone.
 * Takes dayStartHour into account (e.g. if dayStartHour is 4, 3 AM is considered previous day).
 */
export const getLocalDateString = (date: Date = new Date()) => {
  const d = new Date(date);
  const dayStartHour = parseInt(localStorage.getItem('ekagrazone_dayStartHour') || '0');
  if (d.getHours() < dayStartHour) {
    d.setDate(d.getDate() - 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
