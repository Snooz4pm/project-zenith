/**
 * quiz-data - Stubbed for build compatibility
 * Academy quiz data (feature removed)
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const ACADEMY_QUIZZES: Record<string, Record<string, QuizQuestion[]>> = {};
