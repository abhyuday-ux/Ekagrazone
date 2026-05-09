import { StudySession, Subject } from '../types';

export type FocusPersonality = 
  'early_bird' | 'night_owl' | 'sprint_master' | 
  'marathon_runner' | 'deep_worker' | 'weekend_warrior' |
  'consistency_king' | 'balanced_scholar';

export interface FocusDNA {
  personality: FocusPersonality;
  personalityLabel: string;
  personalityEmoji: string;
  personalityDesc: string;
  
  // Core stats
  totalHours: number;
  totalSessions: number;
  avgSessionMins: number;
  longestSessionMins: number;
  bestStreakDays: number;
  currentStreakDays: number;
  
  // Pattern stats
  peakHour: number; // 0-23
  peakHourLabel: string; // "10 AM"
  peakDay: string; // "Tuesday"
  bestSubjectId: string;
  bestSubjectName: string;
  
  // Quality
  deepWorkPercent: number; // % of sessions with score 3
  avgFocusScore: number; // 1-3
  
  // Distributions
  hourlyDistribution: number[]; // 24 values
  dailyDistribution: number[]; // 7 values (Mon-Sun)
  
  sessionCount: number;
  isEnoughData: boolean; // false if < 10 sessions
}

export function calculateFocusDNA(
  sessions: StudySession[],
  subjects: Subject[]
): FocusDNA {
  const MIN_SESSIONS = 10;
  
  if (sessions.length < MIN_SESSIONS) {
    return {
      personality: 'balanced_scholar',
      personalityLabel: 'Still Loading...',
      personalityEmoji: '🔄',
      personalityDesc: 'Keep studying to unlock your Focus DNA!',
      totalHours: 0, totalSessions: sessions.length,
      avgSessionMins: 0, longestSessionMins: 0,
      bestStreakDays: 0, currentStreakDays: 0,
      peakHour: 10, peakHourLabel: '10 AM',
      peakDay: 'Monday', bestSubjectId: '',
      bestSubjectName: '', deepWorkPercent: 0,
      avgFocusScore: 0, hourlyDistribution: Array(24).fill(0),
      dailyDistribution: Array(7).fill(0),
      sessionCount: sessions.length, isEnoughData: false
    };
  }

  // Total hours
  const totalMs = sessions.reduce((a, s) => a + s.durationMs, 0);
  const totalHours = totalMs / 3600000;

  // Session lengths
  const avgSessionMins = totalMs / sessions.length / 60000;
  const longestSessionMins = Math.max(
    ...sessions.map(s => s.durationMs / 60000));

  // Hourly distribution
  const hourlyDistribution = Array(24).fill(0);
  sessions.forEach(s => {
    const hour = new Date(s.startTime).getHours();
    hourlyDistribution[hour] += s.durationMs / 3600000;
  });
  const peakHour = hourlyDistribution.indexOf(
    Math.max(...hourlyDistribution));
  const peakHourLabel = peakHour === 0 ? '12 AM'
    : peakHour < 12 ? `${peakHour} AM`
    : peakHour === 12 ? '12 PM'
    : `${peakHour - 12} PM`;

  // Daily distribution (0=Sun, 1=Mon...6=Sat → reorder to Mon=0)
  const dailyDistribution = Array(7).fill(0);
  sessions.forEach(s => {
    const day = new Date(s.startTime).getDay();
    const monFirst = day === 0 ? 6 : day - 1;
    dailyDistribution[monFirst] += s.durationMs / 3600000;
  });
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const peakDayIdx = dailyDistribution.indexOf(
    Math.max(...dailyDistribution));
  const peakDay = DAYS[peakDayIdx];

  // Best subject
  const subjectMs: Record<string, number> = {};
  sessions.forEach(s => {
    subjectMs[s.subjectId] = (subjectMs[s.subjectId]||0) + s.durationMs;
  });
  const bestSubjectId = Object.entries(subjectMs)
    .sort((a,b) => b[1]-a[1])[0]?.[0] || '';
  const bestSubjectName = subjects.find(
    s => s.id === bestSubjectId)?.name || 'Unknown';

  // Focus quality
  const scoredSessions = sessions.filter(s => s.focusScore);
  const deepWorkSessions = scoredSessions.filter(
    s => s.focusScore === 3);
  const deepWorkPercent = scoredSessions.length > 0
    ? (deepWorkSessions.length / scoredSessions.length) * 100 : 0;
  const avgFocusScore = scoredSessions.length > 0
    ? scoredSessions.reduce((a,s) => a + (s.focusScore||0), 0) 
      / scoredSessions.length : 2;

  // Streak calculation
  const uniqueDates = [...new Set(sessions.map(s => s.dateString))]
    .sort();
  let currentStreakDays = 0;
  let bestStreakDays = 0;
  let tempStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = uniqueDates.length - 1; i >= 0; i--) {
    const expected = new Date();
    expected.setDate(expected.getDate() - 
      (uniqueDates.length - 1 - i));
    const expectedStr = expected.toISOString().split('T')[0];
    if (uniqueDates[i] === expectedStr) {
      currentStreakDays++;
    } else break;
  }

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) { tempStreak = 1; continue; }
    const prev = new Date(uniqueDates[i-1]);
    const curr = new Date(uniqueDates[i]);
    const diff = (curr.getTime() - prev.getTime()) 
      / (1000*60*60*24);
    if (diff === 1) tempStreak++;
    else tempStreak = 1;
    bestStreakDays = Math.max(bestStreakDays, tempStreak);
  }

  // Weekend warrior check
  const weekendMs = (dailyDistribution[5] + dailyDistribution[6]);
  const weekdayMs = dailyDistribution.slice(0,5)
    .reduce((a,b) => a+b, 0);
  const isWeekendWarrior = weekendMs > weekdayMs * 0.6;

  // Determine personality
  let personality: FocusPersonality;
  if (currentStreakDays >= 10) {
    personality = 'consistency_king';
  } else if (isWeekendWarrior) {
    personality = 'weekend_warrior';
  } else if (peakHour >= 21 || peakHour <= 3) {
    personality = 'night_owl';
  } else if (peakHour >= 5 && peakHour <= 9) {
    personality = 'early_bird';
  } else if (avgSessionMins < 30) {
    personality = 'sprint_master';
  } else if (avgSessionMins > 90) {
    personality = 'marathon_runner';
  } else if (deepWorkPercent > 60) {
    personality = 'deep_worker';
  } else {
    personality = 'balanced_scholar';
  }

  const PERSONALITIES: Record<FocusPersonality, {
    label: string; emoji: string; desc: string;
  }> = {
    early_bird: {
      label: 'Early Bird',
      emoji: '🌅',
      desc: 'You rise and grind. Your best work happens before the world wakes up.'
    },
    night_owl: {
      label: 'Night Owl',
      emoji: '🦉',
      desc: 'When everyone sleeps, you peak. Silence is your superpower.'
    },
    sprint_master: {
      label: 'Sprint Master',
      emoji: '⚡',
      desc: 'Short, sharp, intense. You hit hard and recover fast.'
    },
    marathon_runner: {
      label: 'Marathon Runner',
      emoji: '🏃',
      desc: 'You play the long game. Deep immersion is your style.'
    },
    deep_worker: {
      label: 'Deep Worker',
      emoji: '🎯',
      desc: 'Quality over quantity. When you focus, you really focus.'
    },
    weekend_warrior: {
      label: 'Weekend Warrior',
      emoji: '📅',
      desc: 'You save up energy all week and unleash it on weekends.'
    },
    consistency_king: {
      label: 'Consistency King',
      emoji: '🔥',
      desc: 'Never miss a day. Your streak speaks for itself.'
    },
    balanced_scholar: {
      label: 'Balanced Scholar',
      emoji: '⚖️',
      desc: 'Steady and well-rounded. You cover all bases without burning out.'
    },
  };

  return {
    personality,
    ...PERSONALITIES[personality],
    totalHours, totalSessions: sessions.length,
    avgSessionMins, longestSessionMins,
    bestStreakDays, currentStreakDays,
    peakHour, peakHourLabel, peakDay,
    bestSubjectId, bestSubjectName,
    deepWorkPercent, avgFocusScore,
    hourlyDistribution, dailyDistribution,
    sessionCount: sessions.length,
    isEnoughData: true
  };
}
