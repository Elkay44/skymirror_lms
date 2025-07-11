export type ModuleStatus = 'draft' | 'published' | 'scheduled';

export interface LearningObjective {
  id?: string;
  text: string;
}

export interface ModuleBase {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  status: ModuleStatus;
  estimatedDuration: number;
  duration: number;
  isPublished: boolean;
  learningObjectives: LearningObjective[];
  prerequisites: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  deletedAt?: Date;
}

export interface ModuleResource {
  id: string;
  name: string;
  url: string;
  type: 'file' | 'link' | 'embed';
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration: number; // in minutes
  order: number;
  isFreePreview: boolean;
  resources: ModuleResource[];
  createdAt: Date;
  updatedAt: Date;
}

// Content Block Types
export type ContentBlockType = 'text' | 'video' | 'youtube' | 'assignment' | 'project' | 'quiz';

export interface ContentBlockBase {
  id: string;
  type: ContentBlockType;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextBlock extends ContentBlockBase {
  type: 'text';
  content: string;
}

export interface VideoBlock extends ContentBlockBase {
  type: 'video';
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface YouTubeBlock extends ContentBlockBase {
  type: 'youtube';
  videoId: string;
  caption?: string;
  startAt?: number;
}

export interface AssignmentBlock extends ContentBlockBase {
  type: 'assignment';
  title: string;
  description: string;
  dueDate?: Date;
  points?: number;
  instructions: string;
  submissionType: 'text' | 'file' | 'both';
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
}

export interface ProjectBlock extends ContentBlockBase {
  type: 'project';
  title: string;
  description: string;
  requirements: string[];
  resources?: Array<{
    id?: string; // id is optional for new resources
    title: string;
    url: string;
    type: 'link' | 'file' | 'video';
  }>;
  templateUrl?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  dueDate?: Date;
  points?: number;
}

export interface QuizBlock extends ContentBlockBase {
  type: 'quiz';
  title: string;
  description?: string;
  timeLimit?: number; // in minutes
  passingScore?: number;
  questions: Array<{
    id: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    options?: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    points: number;
    explanation?: string;
  }>;
}

export type ContentBlock = TextBlock | VideoBlock | YouTubeBlock | AssignmentBlock | ProjectBlock | QuizBlock;

export interface ModulePage {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  description?: string;
  order: number;
  isPublished: boolean;
  contentBlocks: ContentBlock[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Module extends ModuleBase {
  lessons?: Lesson[]; // Optional, for when we fetch module with lessons
  pages?: ModulePage[]; // Optional, for when we fetch module with pages
}

// API Request/Response types
export interface CreateModuleRequest {
  title: string;
  description: string;
  status?: ModuleStatus;
  learningObjectives?: string[];
  estimatedDuration?: number;
  prerequisites?: string[];
}

export interface UpdateModuleRequest extends Partial<CreateModuleRequest> {
  order?: number;
}

export interface ModuleListResponse {
  data: Module[];
  total: number;
}

// Module Pages API Types
export interface GetModulePagesResponse {
  data: ModulePage[];
  total: number;
}

export interface CreateModulePageRequest {
  title: string;
  description?: string;
  isPublished?: boolean;
}

export interface UpdateModulePageRequest extends Partial<CreateModulePageRequest> {
  order?: number;
  contentBlocks?: ContentBlock[];
}

export interface ReorderPagesRequest {
  updates: Array<{ id: string; order: number }>;
}

export interface ContentBlockRequest {
  type: ContentBlockType;
  order: number;
  [key: string]: any; // For dynamic properties based on block type
}

export interface UpdateContentBlockRequest {
  id: string;
  data: Partial<ContentBlock>;
}

export interface ReorderContentBlocksRequest {
  pageId: string;
  updates: Array<{ id: string; order: number }>;
}
