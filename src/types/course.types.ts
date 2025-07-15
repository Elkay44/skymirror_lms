import { CourseFormData, CourseCategory, DifficultyLevel, Language } from './course';

export interface Instructor {
  id: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  bio?: string;
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
