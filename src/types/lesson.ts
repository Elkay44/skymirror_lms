import { User } from './user';

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  duration: number;
  order: number;
  moduleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProgress {
  id: string;
  completed: boolean;
  completedAt: Date | null;
  lastAccessedAt: Date;
  timeSpent: number;
  progress: number;
  lessonId: string;
  userId: number;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLessonRequest {
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order?: number;
}

export interface UpdateLessonRequest extends Partial<CreateLessonRequest> {}
