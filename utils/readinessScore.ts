import { Exam, StudySession, SyllabusSubject } from '../types';

export interface ReadinessBreakdown {
  total: number; // 0-100
  syllabusScore: number; // 0-40
  studyTimeScore: number; // 0-25
  consistencyScore: number; // 0-20
  timeBufferScore: number; // 0-15
  syllabusPercent: number; // raw % for display
  studyTimePercent: number; // raw % for display
  consistencyPercent: number; // raw % for display
  timeBufferPercent: number; // raw % for display
  daysRemaining: number;
  totalTopics: number;
  doneTopics: number;
}

export function calculateReadiness(
  exam: Exam,
  sessions: StudySession[],
  syllabusSubjects: SyllabusSubject[],
  targetHoursPerDay: number
): ReadinessBreakdown {

  const today = new Date();
  today.setHours(0,0,0,0);
  const examDate = new Date(exam.date + 'T00:00:00');
  examDate.setHours(0,0,0,0);
  const daysRemaining = Math.max(0, Math.ceil(
    (examDate.getTime() - today.getTime()) / (1000*60*60*24)
  ));

  // --- COMPONENT 1: Syllabus Completion (40 points) ---
  let totalTopics = 0;
  let doneTopics = 0;

  exam.subjectIds.forEach(subjectId => {
    const sylSub = syllabusSubjects.find(
      s => s.subjectId === subjectId);
    if (!sylSub) return;
    sylSub.chapters.forEach(ch => {
      totalTopics += ch.topics.length;
      doneTopics += ch.topics.filter(
        t => t.status === 'done').length;
    });
  });

  const syllabusPercent = totalTopics > 0 
    ? (doneTopics / totalTopics) * 100 : 0;
  const syllabusScore = (syllabusPercent / 100) * 40;

  // --- COMPONENT 2: Study Time vs Target (25 points) ---
  // Look at last 14 days of sessions for exam subjects
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenDaysAgoStr = fourteenDaysAgo
    .toISOString().split('T')[0];

  const recentSessions = sessions.filter(s => 
    exam.subjectIds.includes(s.subjectId) &&
    s.dateString >= fourteenDaysAgoStr
  );

  const totalStudyMs = recentSessions.reduce(
    (acc, s) => acc + s.durationMs, 0);
  const targetMs = targetHoursPerDay * 3600000 * 14 * 
    (exam.subjectIds.length / Math.max(1, 3)); 
  // proportional to number of exam subjects

  const studyTimePercent = Math.min(100, 
    (totalStudyMs / Math.max(1, targetMs)) * 100);
  const studyTimeScore = (studyTimePercent / 100) * 25;

  // --- COMPONENT 3: Consistency/Streak (20 points) ---
  // Count unique study days in last 14 days
  const uniqueStudyDays = new Set(
    recentSessions.map(s => s.dateString)
  ).size;
  const consistencyPercent = Math.min(100, 
    (uniqueStudyDays / 14) * 100);
  const consistencyScore = (consistencyPercent / 100) * 20;

  // --- COMPONENT 4: Time Buffer (15 points) ---
  // More days = higher score, but also need enough time
  // Sweet spot: 20-60 days is ideal
  let timeBufferPercent = 0;
  if (daysRemaining === 0) {
    timeBufferPercent = 0;
  } else if (daysRemaining >= 60) {
    timeBufferPercent = 100; // Plenty of time
  } else if (daysRemaining >= 30) {
    timeBufferPercent = 80;
  } else if (daysRemaining >= 14) {
    timeBufferPercent = 60;
  } else if (daysRemaining >= 7) {
    timeBufferPercent = 35;
  } else {
    timeBufferPercent = 15; // Very little time
  }
  const timeBufferScore = (timeBufferPercent / 100) * 15;

  const total = Math.round(
    syllabusScore + studyTimeScore + 
    consistencyScore + timeBufferScore
  );

  return {
    total: Math.min(100, total),
    syllabusScore, studyTimeScore,
    consistencyScore, timeBufferScore,
    syllabusPercent: Math.round(syllabusPercent),
    studyTimePercent: Math.round(studyTimePercent),
    consistencyPercent: Math.round(consistencyPercent),
    timeBufferPercent: Math.round(timeBufferPercent),
    daysRemaining,
    totalTopics,
    doneTopics
  };
}

export function getReadinessColor(score: number): string {
  if (score <= 30) return '#ef4444'; // red
  if (score <= 50) return '#f97316'; // orange
  if (score <= 70) return '#f59e0b'; // amber
  if (score <= 85) return '#06b6d4'; // cyan
  return '#10b981'; // emerald
}

export function getReadinessLabel(score: number): string {
  if (score <= 30) return 'Critical';
  if (score <= 50) return 'Needs Work';
  if (score <= 70) return 'On Track';
  if (score <= 85) return 'Looking Good';
  return 'Exam Ready!';
}

export function getReadinessMessage(score: number): string {
  if (score <= 30) 
    return "⚠️ Significant work needed. Start grinding now!";
  if (score <= 50) 
    return "📚 You're behind. Intensify your sessions.";
  if (score <= 70) 
    return "💪 On track! Stay consistent and keep going.";
  if (score <= 85) 
    return "🔥 Looking great! Maintain the momentum.";
  return "🎯 You're ready! Light revision mode now.";
}
