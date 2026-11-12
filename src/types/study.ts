export type MasteryStatus = 'not_started' | 'learning' | 'understood';

export interface Subject {
  id: string;
  name: string;
  iconName?: string;
  color: string;
  isCustom?: boolean;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  masteryStatus: MasteryStatus;
  createdAt: string;
}

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  subjectId: string;
  topicId?: string;
  front: string;
  back: string;
  difficulty: FlashcardRating;
  repetitions: number;
  intervalDays: number;
  nextReviewDate: string;
  createdAt: string;
  lastReviewedAt?: string;
}

export type QuizType = 'multiple_choice' | 'true_false' | 'short_answer' | 'mixed';
export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'exam';

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResult {
  id: string;
  quizTitle: string;
  subjectId: string;
  topicId?: string;
  difficulty: QuizDifficulty;
  totalQuestions: number;
  score: number; // percentage 0-100
  correctCount: number;
  incorrectCount: number;
  completedAt: string;
  userAnswers: Record<string, string>;
  questions: QuizQuestion[];
  weakAreas: string[];
}

export interface PracticeQuestion {
  id: string;
  subjectId: string;
  topicId?: string;
  question: string;
  type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: QuizDifficulty;
  followUpPrompt?: string;
}

export interface StudyNote {
  id: string;
  subjectId: string;
  topicId?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subjectId: string;
  topicId?: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface StudySessionRecord {
  id: string;
  subjectId: string;
  topicId?: string;
  durationMinutes: number;
  date: string;
  notes?: string;
}

export interface StudyDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  sizeFormatted: string;
  uploadedAt: string;
  base64Data: string;
  mimeType: string;
  summary?: string;
  extractedConcepts?: string[];
}

export type ActivityType =
  | 'quiz'
  | 'flashcards'
  | 'live_study'
  | 'practice'
  | 'notes'
  | 'focus_session'
  | 'document_study'
  | 'explain'
  | 'planner';

export type StudyTab =
  | 'tutor'
  | 'flashcards'
  | 'quiz'
  | 'practice'
  | 'explain'
  | 'teach_me'
  | 'documents'
  | 'notes'
  | 'planner'
  | 'focus'
  | 'knowledge_map';

export interface StudyPlanTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  subjectId: string;
  completed: boolean;
  estimatedMinutes: number;
}

export interface StudyPlan {
  id: string;
  targetGoal: string;
  examDate: string;
  dailyHoursAvailable: number;
  tasks: StudyPlanTask[];
  createdAt: string;
}

export interface StudyActivity {
  id: string;
  type: ActivityType;
  title: string;
  details: string;
  timestamp: string;
  subjectId?: string;
  topicId?: string;
}

export interface SmartRecommendation {
  id: string;
  type: 'flashcards' | 'practice' | 'quiz' | 'notes' | 'topic';
  title: string;
  reason: string;
  actionLabel: string;
  subjectId: string;
  topicId?: string;
  targetId?: string;
}
