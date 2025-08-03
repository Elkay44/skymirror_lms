import { PrismaClient } from '@prisma/client';

/**
 * Extended Prisma client with custom models
 */
export interface ExtendedPrismaClient extends PrismaClient {
  // Course versioning
  courseVersion: {
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
  
  // Access control
  modulePrerequisite: {
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
  
  lessonPrerequisite: {
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
  
  discussionPost: any;
  
  courseInstructor: {
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
  
  courseApprovalHistory: {
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
}

/**
 * Extended Module model with access control fields
 */
export interface ModuleWithAccessControl {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  position?: number;
  isPublic?: boolean;
  requiresEnrollment?: boolean;
  availableAfter?: Date | null;
  prerequisites?: ModulePrerequisite[];
  lessons?: LessonWithAccessControl[];
}

/**
 * Extended Lesson model with access control fields
 */
export interface LessonWithAccessControl {
  id: string;
  title: string;
  description: string | null;
  moduleId: string | null;
  order: number;
  content: string | null;
  videoUrl: string | null;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
  sectionId: string | null;
  quizId: string | null;
  position?: number;
  isPublic?: boolean;
  requiresEnrollment?: boolean;
  availableAfter?: Date | null;
  prerequisites?: LessonPrerequisite[];
}

/**
 * Module prerequisite relationship
 */
export interface ModulePrerequisite {
  id: string;
  moduleId: string;
  prerequisiteId: string;
  createdAt: Date;
  updatedAt: Date;
  prerequisite?: ModuleWithAccessControl;
}

/**
 * Lesson prerequisite relationship
 */
export interface LessonPrerequisite {
  id: string;
  lessonId: string;
  prerequisiteId: string;
  prerequisiteType: 'MODULE' | 'LESSON';
  createdAt: Date;
  updatedAt: Date;
  prerequisiteModule?: ModuleWithAccessControl;
  prerequisiteLesson?: LessonWithAccessControl;
}

/**
 * Extended Module with lessons and quizzes for versioning
 */
export interface ModuleWithContent {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  position?: number;
  isPublished?: boolean;
  lessons?: LessonWithContent[];
  quizzes?: QuizWithContent[];
}

/**
 * Extended Lesson with content for versioning
 */
export interface LessonWithContent {
  id: string;
  title: string;
  description: string | null;
  moduleId: string | null;
  order: number;
  content: string | null;
  videoUrl: string | null;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
  sectionId: string | null;
  quizId: string | null;
}

/**
 * Quiz with questions and options for versioning
 */
export interface QuizWithContent {
  id: string;
  title: string;
  description: string | null;
  moduleId: string | null;
  lessonId: string | null;
  timeLimit: number | null;
  passingScore: number;
  attemptsAllowed: number;
  randomizeQuestions: boolean;
  showCorrectAnswers: boolean;
  createdAt: Date;
  updatedAt: Date;
  questions?: QuestionWithOptions[];
}

/**
 * Question with options for versioning
 */
export interface QuestionWithOptions {
  id: string;
  quizId: string;
  text: string;
  type: string;
  points: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  options?: QuestionOption[];
}

/**
 * Question option for versioning
 */
export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Course version with snapshot content
 */
export interface CourseVersionWithContent {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: number;
  isAutosave: boolean;
  snapshotData: any;
}
