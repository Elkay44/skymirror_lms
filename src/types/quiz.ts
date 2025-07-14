import { User } from './user';

// Quiz Question Type
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'MATCHING';

// Quiz Question
export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  order: number;
  points: number;
  options?: string[];
  correctAnswers?: string[];
  explanation?: string;
  quizId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz Attempt
export interface QuizAttempt {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  timeSpent?: number; // in seconds
  quizId: string;
  userId: number;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz Answer
export interface QuizAnswer {
  id: string;
  answer: string;
  isCorrect?: boolean;
  points?: number;
  feedback?: string;
  questionId: string;
  attemptId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Main Quiz Interface
export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  timeLimit: number | null; // in minutes
  passingScore: number;
  maxAttempts: number | null;
  isPublished: boolean;
  isRandomized: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  moduleId: string;
  courseId: string;
  questions: QuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

// Create Quiz Request
export interface CreateQuizRequest {
  title: string;
  description?: string;
  instructions?: string;
  timeLimit?: number;
  passingScore?: number;
  maxAttempts?: number;
  isPublished?: boolean;
  isRandomized?: boolean;
  showCorrectAnswers?: boolean;
  showExplanations?: boolean;
  questions?: {
    question: string;
    type: QuestionType;
    order?: number;
    points: number;
    options?: string[];
    correctAnswers?: string[];
    explanation?: string;
  }[];
}

// Update Quiz Request
export interface UpdateQuizRequest extends Partial<CreateQuizRequest> {}
