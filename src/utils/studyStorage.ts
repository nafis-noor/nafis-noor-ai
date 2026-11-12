import {
  Subject,
  Topic,
  Flashcard,
  FlashcardRating,
  QuizResult,
  StudyNote,
  StudyTask,
  StudySessionRecord,
  StudyDocument,
  StudyActivity,
  SmartRecommendation,
  StudyPlan,
  StudyPlanTask,
  StudyTab,
} from '../types/study';
import { getActiveSession } from './accountManager';

const STORAGE_KEY_PREFIX = 'noor_study_data_';

export interface StudyStorageData {
  subjects: Subject[];
  topics: Topic[];
  flashcards: Flashcard[];
  notes: StudyNote[];
  quizResults: QuizResult[];
  tasks: StudyTask[];
  sessions: StudySessionRecord[];
  documents: StudyDocument[];
  activities: StudyActivity[];
  studyPlan?: StudyPlan | null;
}

export type StudyData = StudyStorageData;

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-math', name: 'Mathematics', color: '#3B82F6', createdAt: '2026-01-01' },
  { id: 'sub-english', name: 'English', color: '#10B981', createdAt: '2026-01-01' },
  { id: 'sub-science', name: 'Science', color: '#8B5CF6', createdAt: '2026-01-01' },
  { id: 'sub-biology', name: 'Biology', color: '#059669', createdAt: '2026-01-01' },
  { id: 'sub-chemistry', name: 'Chemistry', color: '#D97706', createdAt: '2026-01-01' },
  { id: 'sub-physics', name: 'Physics', color: '#6366F1', createdAt: '2026-01-01' },
  { id: 'sub-arabic', name: 'Arabic', color: '#C9A063', createdAt: '2026-01-01' },
  { id: 'sub-history', name: 'History', color: '#B45309', createdAt: '2026-01-01' },
  { id: 'sub-geography', name: 'Geography', color: '#0D9488', createdAt: '2026-01-01' },
  { id: 'sub-cs', name: 'Computer Science', color: '#2563EB', createdAt: '2026-01-01' },
];

export const DEFAULT_TOPICS: Topic[] = [
  { id: 'top-algebra', subjectId: 'sub-math', name: 'Algebra & Linear Equations', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-quadratics', subjectId: 'sub-math', name: 'Quadratic Equations', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-cells', subjectId: 'sub-biology', name: 'Cell Structure & Function', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-photosynthesis', subjectId: 'sub-biology', name: 'Photosynthesis & Cellular Respiration', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-genetics', subjectId: 'sub-biology', name: 'Mendelian Genetics & DNA', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-reactions', subjectId: 'sub-chemistry', name: 'Chemical Reactions & Stoichiometry', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-mechanics', subjectId: 'sub-physics', name: 'Newtonian Mechanics & Force', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-grammar', subjectId: 'sub-english', name: 'Advanced Grammar & Syntax', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-algorithms', subjectId: 'sub-cs', name: 'Data Structures & Algorithms', masteryStatus: 'not_started', createdAt: '2026-01-01' },
  { id: 'top-nahw', subjectId: 'sub-arabic', name: 'Arabic Grammar (Nahw)', masteryStatus: 'not_started', createdAt: '2026-01-01' },
];

function getStorageKey(): string {
  const activeSession = getActiveSession();
  const userId = activeSession?.id || activeSession?.stats?.accountId || 'default_student';
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function loadStudyData(): StudyStorageData {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) {
      return {
        subjects: DEFAULT_SUBJECTS,
        topics: DEFAULT_TOPICS,
        flashcards: [],
        notes: [],
        quizResults: [],
        tasks: [],
        sessions: [],
        documents: [],
        activities: [],
      };
    }
    const parsed = JSON.parse(raw);
    return {
      subjects: parsed.subjects?.length ? parsed.subjects : DEFAULT_SUBJECTS,
      topics: parsed.topics?.length ? parsed.topics : DEFAULT_TOPICS,
      flashcards: parsed.flashcards || [],
      notes: parsed.notes || [],
      quizResults: parsed.quizResults || [],
      tasks: parsed.tasks || [],
      sessions: parsed.sessions || [],
      documents: parsed.documents || [],
      activities: parsed.activities || [],
      studyPlan: parsed.studyPlan || null,
    };
  } catch (e) {
    console.error('Failed to load study data', e);
    return {
      subjects: DEFAULT_SUBJECTS,
      topics: DEFAULT_TOPICS,
      flashcards: [],
      notes: [],
      quizResults: [],
      tasks: [],
      sessions: [],
      documents: [],
      activities: [],
      studyPlan: null,
    };
  }
}

export function saveStudyData(data: StudyStorageData): void {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save study data', e);
  }
}

// -------------------------------------------------------------
// Real Activity Logging (No fake data!)
// -------------------------------------------------------------
export function recordStudyActivity(
  type: StudyActivity['type'],
  title: string,
  details: string,
  subjectId?: string,
  topicId?: string
): void {
  const data = loadStudyData();
  const activity: StudyActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    title,
    details,
    timestamp: new Date().toISOString(),
    subjectId,
    topicId,
  };
  data.activities = [activity, ...data.activities].slice(0, 100);
  saveStudyData(data);
}

// -------------------------------------------------------------
// Subjects & Topics CRUD
// -------------------------------------------------------------
export function addCustomSubject(name: string, color = '#6366F1'): Subject {
  const data = loadStudyData();
  const newSubject: Subject = {
    id: `sub-custom-${Date.now()}`,
    name: name.trim(),
    color,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  data.subjects.push(newSubject);
  saveStudyData(data);
  recordStudyActivity('notes', `Created subject: ${newSubject.name}`, 'Added custom subject to workspace', newSubject.id);
  return newSubject;
}

export function deleteCustomSubject(subjectId: string): void {
  const data = loadStudyData();
  data.subjects = data.subjects.filter(s => s.id !== subjectId);
  data.topics = data.topics.filter(t => t.subjectId !== subjectId);
  saveStudyData(data);
}

export function addTopic(subjectId: string, name: string, description?: string): Topic {
  const data = loadStudyData();
  const newTopic: Topic = {
    id: `top-${Date.now()}`,
    subjectId,
    name: name.trim(),
    description: description?.trim(),
    masteryStatus: 'not_started',
    createdAt: new Date().toISOString(),
  };
  data.topics.push(newTopic);
  saveStudyData(data);
  return newTopic;
}

export const addCustomTopic = addTopic;

export function updateTopicMastery(topicId: string, status: Topic['masteryStatus']): void {
  const data = loadStudyData();
  const topic = data.topics.find(t => t.id === topicId);
  if (topic) {
    topic.masteryStatus = status;
    saveStudyData(data);
  }
}

// -------------------------------------------------------------
// Flashcards CRUD & Spaced Repetition Rating
// -------------------------------------------------------------
export function saveFlashcard(card: Omit<Flashcard, 'id' | 'createdAt' | 'repetitions' | 'intervalDays' | 'nextReviewDate' | 'difficulty'> & { id?: string }): Flashcard {
  const data = loadStudyData();
  if (card.id) {
    const existingIdx = data.flashcards.findIndex(f => f.id === card.id);
    if (existingIdx >= 0) {
      data.flashcards[existingIdx] = {
        ...data.flashcards[existingIdx],
        ...card,
        id: card.id,
      };
      saveStudyData(data);
      return data.flashcards[existingIdx];
    }
  }

  const newCard: Flashcard = {
    id: `fc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    subjectId: card.subjectId,
    topicId: card.topicId,
    front: card.front,
    back: card.back,
    difficulty: 'good',
    repetitions: 0,
    intervalDays: 1,
    nextReviewDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  data.flashcards.unshift(newCard);
  saveStudyData(data);
  recordStudyActivity('flashcards', 'Created flashcard', `Added card: "${newCard.front.slice(0, 40)}..."`, newCard.subjectId, newCard.topicId);
  return newCard;
}

export function saveBatchFlashcards(cards: Array<{ front: string; back: string; subjectId: string; topicId?: string }>): Flashcard[] {
  const data = loadStudyData();
  const created: Flashcard[] = cards.map(c => ({
    id: `fc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    subjectId: c.subjectId,
    topicId: c.topicId,
    front: c.front,
    back: c.back,
    difficulty: 'good',
    repetitions: 0,
    intervalDays: 1,
    nextReviewDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));

  data.flashcards = [...created, ...data.flashcards];
  saveStudyData(data);
  if (created.length > 0) {
    recordStudyActivity(
      'flashcards',
      `Generated ${created.length} flashcards`,
      `Batch generated for ${data.subjects.find(s => s.id === created[0].subjectId)?.name || 'study'}`,
      created[0].subjectId,
      created[0].topicId
    );
  }
  return created;
}

export function deleteFlashcard(cardId: string): void {
  const data = loadStudyData();
  data.flashcards = data.flashcards.filter(f => f.id !== cardId);
  saveStudyData(data);
}

export function rateFlashcard(cardId: string, rating: FlashcardRating): Flashcard | null {
  const data = loadStudyData();
  const card = data.flashcards.find(f => f.id === cardId);
  if (!card) return null;

  card.difficulty = rating;
  card.lastReviewedAt = new Date().toISOString();
  card.repetitions = (card.repetitions || 0) + 1;

  let intervalDays = 1;
  if (rating === 'again') {
    intervalDays = 0; // immediate review needed
  } else if (rating === 'hard') {
    intervalDays = Math.max(1, Math.round(card.intervalDays * 1.2));
  } else if (rating === 'good') {
    intervalDays = Math.max(2, Math.round((card.intervalDays || 1) * 2.5));
  } else if (rating === 'easy') {
    intervalDays = Math.max(4, Math.round((card.intervalDays || 1) * 3.5));
  }
  card.intervalDays = intervalDays;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  card.nextReviewDate = nextDate.toISOString();

  saveStudyData(data);

  // If user rated this card, if it belongs to a topic, check if topic is now learning or understood
  if (card.topicId && rating === 'good') {
    const topic = data.topics.find(t => t.id === card.topicId);
    if (topic && topic.masteryStatus === 'not_started') {
      topic.masteryStatus = 'learning';
      saveStudyData(data);
    }
  }

  return card;
}

// -------------------------------------------------------------
// Notes CRUD
// -------------------------------------------------------------
export function saveStudyNote(note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): StudyNote {
  const data = loadStudyData();
  const now = new Date().toISOString();

  if (note.id) {
    const idx = data.notes.findIndex(n => n.id === note.id);
    if (idx >= 0) {
      data.notes[idx] = {
        ...data.notes[idx],
        ...note,
        id: note.id,
        updatedAt: now,
      };
      saveStudyData(data);
      recordStudyActivity('notes', `Updated note: ${note.title}`, `Modified study notes`, note.subjectId, note.topicId);
      return data.notes[idx];
    }
  }

  const newNote: StudyNote = {
    id: `note-${Date.now()}`,
    subjectId: note.subjectId,
    topicId: note.topicId,
    title: note.title.trim(),
    content: note.content,
    tags: note.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  data.notes.unshift(newNote);
  saveStudyData(data);
  recordStudyActivity('notes', `Created note: ${newNote.title}`, `Saved structured notes`, newNote.subjectId, newNote.topicId);
  return newNote;
}

export function deleteStudyNote(noteId: string): void {
  const data = loadStudyData();
  data.notes = data.notes.filter(n => n.id !== noteId);
  saveStudyData(data);
}

// -------------------------------------------------------------
// Quizzes & Results
// -------------------------------------------------------------
export function saveQuizResult(result: Omit<QuizResult, 'id' | 'completedAt'>): QuizResult {
  const data = loadStudyData();
  const newResult: QuizResult = {
    ...result,
    id: `quiz-${Date.now()}`,
    completedAt: new Date().toISOString(),
  };

  data.quizResults.unshift(newResult);

  // Auto-update topic mastery based on real performance!
  if (newResult.topicId) {
    const topic = data.topics.find(t => t.id === newResult.topicId);
    if (topic) {
      if (newResult.score >= 80) {
        topic.masteryStatus = 'understood';
      } else if (newResult.score >= 40) {
        topic.masteryStatus = 'learning';
      }
    }
  }

  saveStudyData(data);
  recordStudyActivity(
    'quiz',
    `Completed Quiz: ${newResult.quizTitle}`,
    `Score: ${newResult.score}% (${newResult.correctCount}/${newResult.totalQuestions} correct)`,
    newResult.subjectId,
    newResult.topicId
  );

  return newResult;
}

// -------------------------------------------------------------
// Study Planner Tasks
// -------------------------------------------------------------
export function addStudyTask(title: string, subjectId: string, dueDate: string, priority: StudyTask['priority'] = 'medium', topicId?: string): StudyTask {
  const data = loadStudyData();
  const newTask: StudyTask = {
    id: `task-${Date.now()}`,
    title: title.trim(),
    subjectId,
    topicId,
    dueDate,
    completed: false,
    priority,
    createdAt: new Date().toISOString(),
  };
  data.tasks.push(newTask);
  saveStudyData(data);
  return newTask;
}

export function toggleStudyTask(taskId: string): void {
  const data = loadStudyData();
  const task = data.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveStudyData(data);
    if (task.completed) {
      recordStudyActivity('focus_session', `Completed task: ${task.title}`, 'Checked off from study planner', task.subjectId, task.topicId);
    }
  }
}

export function deleteStudyTask(taskId: string): void {
  const data = loadStudyData();
  data.tasks = data.tasks.filter(t => t.id !== taskId);
  saveStudyData(data);
}

export function saveStudyPlan(plan: StudyPlan): void {
  const data = loadStudyData();
  data.studyPlan = plan;
  saveStudyData(data);
}

export function togglePlanTaskCompleted(taskId: string): void {
  const data = loadStudyData();
  if (data.studyPlan) {
    const task = data.studyPlan.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      saveStudyData(data);
      if (task.completed) {
        recordStudyActivity('planner', `Completed: ${task.title}`, 'Checked off milestone in study plan', task.subjectId);
      }
    }
  }
}

// -------------------------------------------------------------
// Study & Focus Sessions
// -------------------------------------------------------------
export function recordStudySession(subjectId: string, durationMinutes: number, topicId?: string, notes?: string): void {
  const data = loadStudyData();
  const newSession: StudySessionRecord = {
    id: `sess-${Date.now()}`,
    subjectId,
    topicId,
    durationMinutes,
    date: new Date().toISOString(),
    notes,
  };
  data.sessions.unshift(newSession);

  // Mark topic as learning if not started
  if (topicId) {
    const topic = data.topics.find(t => t.id === topicId);
    if (topic && topic.masteryStatus === 'not_started') {
      topic.masteryStatus = 'learning';
    }
  }

  saveStudyData(data);
  recordStudyActivity(
    'focus_session',
    `Deep Focus Session (${durationMinutes} min)`,
    `Subject: ${data.subjects.find(s => s.id === subjectId)?.name || 'Study'}`,
    subjectId,
    topicId
  );
}

export function recordFocusStudySession(durationMinutes: number, taskGoal: string, subjectId: string, topicId?: string): void {
  recordStudySession(subjectId, durationMinutes, topicId, taskGoal);
}

// -------------------------------------------------------------
// Documents (PDF & Images)
// -------------------------------------------------------------
export function saveStudyDocument(doc: Omit<StudyDocument, 'id' | 'uploadedAt'>): StudyDocument {
  const data = loadStudyData();
  const newDoc: StudyDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    uploadedAt: new Date().toISOString(),
  };
  data.documents.unshift(newDoc);
  saveStudyData(data);
  recordStudyActivity('document_study', `Uploaded ${doc.type.toUpperCase()}: ${doc.name}`, `Processed study material (${doc.sizeFormatted})`);
  return newDoc;
}

export function deleteStudyDocument(docId: string): void {
  const data = loadStudyData();
  data.documents = data.documents.filter(d => d.id !== docId);
  saveStudyData(data);
}

// -------------------------------------------------------------
// Real Academic Progress Calculation (Zero Fake Data)
// -------------------------------------------------------------
export interface AcademicProgressSummary {
  topicsStudiedCount: number;
  topicsTotalCount: number;
  topicsUnderstoodCount: number;
  topicsLearningCount: number;
  quizzesTakenCount: number;
  quizAverageScore: number | null;
  flashcardsReviewedCount: number;
  flashcardsTotalCount: number;
  totalFocusTimeMinutes: number;
  areasNeedingImprovement: string[];
  strongAreas: string[];
}

export function calculateAcademicProgress(): AcademicProgressSummary {
  const data = loadStudyData();

  const topicsStudied = data.topics.filter(t => t.masteryStatus !== 'not_started');
  const topicsUnderstood = data.topics.filter(t => t.masteryStatus === 'understood');
  const topicsLearning = data.topics.filter(t => t.masteryStatus === 'learning');

  const quizzes = data.quizResults;
  const quizAvg = quizzes.length > 0
    ? Math.round(quizzes.reduce((acc, q) => acc + q.score, 0) / quizzes.length)
    : null;

  const reviewedCards = data.flashcards.filter(f => (f.repetitions || 0) > 0);
  const totalFocusTime = data.sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Areas needing improvement based on actual mistakes:
  const weakSet = new Set<string>();
  quizzes.forEach(q => {
    if (q.score < 70) {
      q.weakAreas?.forEach(w => weakSet.add(w));
      const subj = data.subjects.find(s => s.id === q.subjectId);
      if (subj) weakSet.add(subj.name);
    }
  });
  data.flashcards.forEach(f => {
    if (f.difficulty === 'again' || f.difficulty === 'hard') {
      const top = data.topics.find(t => t.id === f.topicId);
      if (top) weakSet.add(top.name);
    }
  });

  // Strong areas based on score >= 80% or mastery 'understood'
  const strongSet = new Set<string>();
  quizzes.forEach(q => {
    if (q.score >= 80) {
      const subj = data.subjects.find(s => s.id === q.subjectId);
      if (subj) strongSet.add(subj.name);
      const top = data.topics.find(t => t.id === q.topicId);
      if (top) strongSet.add(top.name);
    }
  });
  topicsUnderstood.forEach(t => strongSet.add(t.name));

  return {
    topicsStudiedCount: topicsStudied.length,
    topicsTotalCount: data.topics.length,
    topicsUnderstoodCount: topicsUnderstood.length,
    topicsLearningCount: topicsLearning.length,
    quizzesTakenCount: quizzes.length,
    quizAverageScore: quizAvg,
    flashcardsReviewedCount: reviewedCards.length,
    flashcardsTotalCount: data.flashcards.length,
    totalFocusTimeMinutes: totalFocusTime,
    areasNeedingImprovement: Array.from(weakSet),
    strongAreas: Array.from(strongSet),
  };
}

// -------------------------------------------------------------
// Smart Review Recommendations (Real Data-Driven)
// -------------------------------------------------------------
export function getSmartReviewRecommendations(): SmartRecommendation[] {
  const data = loadStudyData();
  const recommendations: SmartRecommendation[] = [];

  // 1. Difficult flashcards
  const hardCards = data.flashcards.filter(f => f.difficulty === 'again' || f.difficulty === 'hard');
  if (hardCards.length > 0) {
    const card = hardCards[0];
    const subj = data.subjects.find(s => s.id === card.subjectId);
    recommendations.push({
      id: 'rec-hard-flashcards',
      type: 'flashcards',
      title: `Review ${hardCards.length} difficult flashcard${hardCards.length > 1 ? 's' : ''}`,
      reason: `You rated these cards as "Again" or "Hard" recently.`,
      actionLabel: 'Review Cards',
      subjectId: card.subjectId,
      topicId: card.topicId,
      targetId: card.id,
    });
  }

  // 2. Low quiz score to retry
  const lowQuiz = data.quizResults.find(q => q.score < 75);
  if (lowQuiz) {
    recommendations.push({
      id: `rec-quiz-${lowQuiz.id}`,
      type: 'quiz',
      title: `Practice concepts from ${lowQuiz.quizTitle}`,
      reason: `Scored ${lowQuiz.score}% on previous attempt. Re-testing solidifies memory.`,
      actionLabel: 'Take Practice Quiz',
      subjectId: lowQuiz.subjectId,
      topicId: lowQuiz.topicId,
    });
  }

  // 3. Topics marked as 'learning' that need completion
  const inProgressTopic = data.topics.find(t => t.masteryStatus === 'learning');
  if (inProgressTopic) {
    recommendations.push({
      id: `rec-topic-${inProgressTopic.id}`,
      type: 'topic',
      title: `Advance mastery in ${inProgressTopic.name}`,
      reason: `Currently in progress on Knowledge Map. Test your comprehension.`,
      actionLabel: 'Study Topic',
      subjectId: inProgressTopic.subjectId,
      topicId: inProgressTopic.id,
    });
  }

  // 4. Overdue or upcoming planner task
  const pendingTask = data.tasks.find(t => !t.completed);
  if (pendingTask) {
    recommendations.push({
      id: `rec-task-${pendingTask.id}`,
      type: 'practice',
      title: `Complete: ${pendingTask.title}`,
      reason: `Scheduled in your study planner.`,
      actionLabel: 'Start Studying',
      subjectId: pendingTask.subjectId,
      topicId: pendingTask.topicId,
    });
  }

  return recommendations;
}

export function getSmartRecommendations(data?: StudyData): { message: string; actionTab: StudyTab } | null {
  const currentData = data || loadStudyData();
  const recs = getSmartReviewRecommendations();
  if (recs.length > 0) {
    const first = recs[0];
    let actionTab: StudyTab = 'flashcards';
    if (first.type === 'quiz') actionTab = 'quiz';
    else if (first.type === 'flashcards') actionTab = 'flashcards';
    else if (first.type === 'topic') actionTab = 'teach_me';
    else if (first.type === 'practice') actionTab = 'practice';
    return {
      message: `${first.title}: ${first.reason}`,
      actionTab,
    };
  }

  if (currentData.flashcards.length > 0) {
    return {
      message: `Active Recall: You have ${currentData.flashcards.length} flashcards in your deck ready for review.`,
      actionTab: 'flashcards',
    };
  }

  return {
    message: 'Kickstart your session with an interactive Socratic dialogue in Teach Me Mode or practice with AI Tutor.',
    actionTab: 'teach_me',
  };
}

// -------------------------------------------------------------
// Unified Search across the entire Study section
// -------------------------------------------------------------
export interface SearchResultItem {
  id: string;
  type: 'subject' | 'topic' | 'note' | 'flashcard' | 'quiz' | 'document' | 'task';
  title: string;
  subtitle: string;
  subjectId?: string;
  topicId?: string;
}

export function searchStudyData(query: string): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const data = loadStudyData();
  const results: SearchResultItem[] = [];

  // Subjects
  data.subjects.forEach(s => {
    if (s.name.toLowerCase().includes(q)) {
      results.push({
        id: s.id,
        type: 'subject',
        title: s.name,
        subtitle: 'Subject',
        subjectId: s.id,
      });
    }
  });

  // Topics
  data.topics.forEach(t => {
    if (t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
      const subj = data.subjects.find(s => s.id === t.subjectId);
      results.push({
        id: t.id,
        type: 'topic',
        title: t.name,
        subtitle: `Topic in ${subj?.name || 'Subject'}`,
        subjectId: t.subjectId,
        topicId: t.id,
      });
    }
  });

  // Notes
  data.notes.forEach(n => {
    if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
      const subj = data.subjects.find(s => s.id === n.subjectId);
      results.push({
        id: n.id,
        type: 'note',
        title: n.title,
        subtitle: `Study Note in ${subj?.name || 'Subject'}`,
        subjectId: n.subjectId,
        topicId: n.topicId,
      });
    }
  });

  // Flashcards
  data.flashcards.forEach(f => {
    if (f.front.toLowerCase().includes(q) || f.back.toLowerCase().includes(q)) {
      const subj = data.subjects.find(s => s.id === f.subjectId);
      results.push({
        id: f.id,
        type: 'flashcard',
        title: f.front,
        subtitle: `Flashcard • ${subj?.name || 'Subject'}`,
        subjectId: f.subjectId,
        topicId: f.topicId,
      });
    }
  });

  // Quizzes
  data.quizResults.forEach(qr => {
    if (qr.quizTitle.toLowerCase().includes(q)) {
      results.push({
        id: qr.id,
        type: 'quiz',
        title: qr.quizTitle,
        subtitle: `Completed Quiz (${qr.score}%)`,
        subjectId: qr.subjectId,
        topicId: qr.topicId,
      });
    }
  });

  // Documents
  data.documents.forEach(d => {
    if (d.name.toLowerCase().includes(q)) {
      results.push({
        id: d.id,
        type: 'document',
        title: d.name,
        subtitle: `Uploaded ${d.type.toUpperCase()} (${d.sizeFormatted})`,
      });
    }
  });

  return results.slice(0, 20);
}
