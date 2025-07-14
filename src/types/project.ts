import { User } from './user';

export interface Project {
  id: string;
  title: string;
  description: string;
  content?: string;
  moduleId: string;
  courseId: string;
  dueDate?: string | Date;
  isPublished: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  order?: number;
  _count?: {
    submissions: number;
  };
  instructor?: User;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  content?: string;
  dueDate?: string | Date;
  isPublished?: boolean;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  content?: string;
  dueDate?: string | Date;
  isPublished?: boolean;
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  submittedAt: string | Date;
  grade?: number;
  feedback?: string;
  user?: User;
}

export interface SubmitProjectRequest {
  content: string;
}

export interface GradeProjectRequest {
  grade: number;
  feedback?: string;
}
