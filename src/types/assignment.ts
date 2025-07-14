// Import User type from the correct location
import { User } from '@/types/user';

// Resource Type Enum
export type ResourceType = 'LINK' | 'FILE' | 'VIDEO';

// Assignment Resource
export interface AssignmentResource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  order: number;
  assignmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rubric criteria level
export interface CriteriaLevel {
  id: string;
  title: string;
  points: number;
  description: string;
  rubricItemId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rubric item
export interface RubricItem {
  id: string;
  title: string;
  description: string;
  points: number;
  order: number;
  assignmentId: string;
  levels: CriteriaLevel[];
  createdAt: Date;
  updatedAt: Date;
}

// Submission type enum
export type SubmissionType = 'TEXT' | 'FILE' | 'LINK' | 'MULTIPLE_FILES';

// Main Assignment Interface
export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: string | null;
  maxScore: number; // Changed from pointsValue to match database schema
  submissionType: SubmissionType; // Added to match database schema
  isPublished: boolean;
  allowLateSubmissions: boolean;
  moduleId: string;
  courseId?: string; // Made optional as it might be retrieved through relation
  resources: AssignmentResource[];
  rubricItems: RubricItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Assignment submission
export interface AssignmentSubmission {
  id: string;
  content: string | null;
  attachmentUrl: string | null;
  submittedAt: Date;
  status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED';
  grade: number | null;
  feedback: string | null;
  assignmentId: string;
  userId: number;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

// Create Assignment Request
export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  instructions?: string;
  dueDate?: string; // ISO date string
  maxScore?: number; // Changed from pointsValue to match database schema
  submissionType?: SubmissionType; // Added to match database schema
  isPublished?: boolean;
  allowLateSubmissions?: boolean;
  resources?: {
    title: string;
    url: string;
    type: ResourceType;
  }[];
  rubricItems?: {
    title: string;
    description?: string;
    points: number;
    order?: number;
    levels?: {
      title: string;
      points: number;
      description?: string;
    }[];
  }[];
}

// Update Assignment Request
export interface UpdateAssignmentRequest extends Partial<CreateAssignmentRequest> {}
