export interface Instructor {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface Course {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  imageUrl: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isPublished: boolean;
  isPrivate: boolean;
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  createdAt: string;
  updatedAt: string;
  enrollmentCount: number;
  completionRate: number;
  averageRating: number;
  modules: number;
  lessons: number;
  projects: number;
  instructor?: Instructor;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  projects: Project[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  isPreview: boolean;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  isRequiredForCertification: boolean;
  submissionCount: number;
  order: number;
}

export interface CourseDetailProps {
  course: Course;
  modules: Module[];
  isLoading: boolean;
  isPublishing: boolean;
  onPublishToggle: () => Promise<void>;
}
