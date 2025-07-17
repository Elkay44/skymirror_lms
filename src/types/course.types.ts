import { CourseFormData, CourseCategory, DifficultyLevel, Language } from './course';

export interface Instructor {
  id: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  bio?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration: number | null;
  formattedDuration: string;
  order: number;
  moduleId: string;
  completed: boolean;
  completedAt: Date | null;
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  submissionUrl?: string;
  grade?: number;
  feedback?: string;
  courseId: string;
  studentId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Grade {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  weight: number;
  type: 'quiz' | 'assignment' | 'exam' | 'project';
  courseId: string;
  studentId: string;
  feedback?: string;
  gradedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Course extends Omit<CourseFormData, 'imageFile' | 'imagePreview' | 'promoVideoUrl'> {
  // Core fields
  id: string;
  slug: string;
  imageUrl: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  instructor: Instructor;
  
  // Stats
  rating: number;
  reviewCount: number;
  studentCount: number;
  lessonCount: number;
  duration: number; // in minutes
  
  // Status flags
  isEnrolled: boolean;
  isFavorite: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  
  // Progress tracking
  progress: number; // 0-100
  
  // Course content
  modules: Module[];
  projects?: Project[];
  grades?: Grade[];
  
  // Media
  promoVideo: string;
  
  // Make sure to include all required fields from CourseFormData
  // These are already included via the Omit<CourseFormData> but we can list them for clarity
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  price: number;
  isFree: boolean;
  hasDiscount: boolean;
  discountedPrice: number;
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  isPublished: boolean;
  isPrivate: boolean;
}

export type { CourseCategory, DifficultyLevel, Language };
