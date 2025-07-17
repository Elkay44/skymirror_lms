export interface CourseSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  lessons: CourseLesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  completed: boolean;
  order: number;
  videoUrl?: string;
  content?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  isPublished?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnailUrl?: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  modules: Module[];
  createdAt: string | Date;
  updatedAt: string | Date;
  isPublished?: boolean;
  progress?: number;
  projects?: any[];
}

export interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'download';
  contentUrl?: string;
  contentText?: string;
  duration?: number;
  order: number;
  isPublished: boolean;
  isFree: boolean;
  isPreview: boolean;
}

export interface CourseFormData {
  // Course ID (used for edit mode)
  id?: string;
  
  // Step 1: Course Basics
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  
  // Step 2: Course Media
  imageFile?: File | null;
  imagePreview?: string;
  imageUrl?: string;
  promoVideoUrl?: string;
  
  // Step 3: Course Structure
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  
  // Step 4: Curriculum
  sections?: CourseSection[];
  
  // Step 5: Pricing & Marketing
  price: number;
  isFree: boolean;
  hasDiscount: boolean;
  discountedPrice: number;
  saleEndDate?: string;
  hasEnrollmentLimit?: boolean;
  enrollmentLimit?: number;
  hasAccessLimit?: boolean;
  accessDuration?: number;
  accessPeriod?: 'days' | 'weeks' | 'months' | 'years';
  availableInBundles?: boolean;
  offersCertificate?: boolean;
  
  // Step 6: SEO & Discoverability
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  slug?: string;
  socialTitle?: string;
  socialDescription?: string;
  socialImageUrl?: string;
  
  // Step 7: Settings
  isPublished: boolean;
  isPrivate: boolean;
}

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  courseCount?: number;
}

export interface DifficultyLevel {
  value: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  label: string;
  description?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName?: string;
}
