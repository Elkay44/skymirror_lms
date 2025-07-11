import { Prisma } from '@prisma/client';

// Type definitions for models that might not be fully reflected in the generated Prisma client

// CourseApprovalHistory
declare global {
  namespace PrismaJson {
    type CourseApprovalHistoryDetails = {
      previousStatus?: string;
      reviewerId?: number;
      comments?: string;
      timestamp?: string;
    }
  }
}

// ActivityLog
declare global {
  namespace PrismaJson {
    type ActivityLogDetails = Record<string, any>;
  }
}

// Notification extensions
declare global {
  namespace PrismaJson {
    type NotificationMetadata = {
      courseId?: string;
      lessonId?: string;
      discussionId?: string;
      commentId?: string;
      actionType?: string;
      actorId?: number;
      actorName?: string;
      resourceUrl?: string;
    }
  }
}

// InstructorProfile extensions
declare global {
  namespace PrismaJson {
    type InstructorProfileSettings = {
      payoutPreferences?: {
        method: string;
        details: Record<string, any>;
      };
      notificationSettings?: {
        email: boolean;
        push: boolean;
        courseEnrollments: boolean;
        courseReviews: boolean;
        discussions: boolean;
      };
      customBranding?: {
        colors: {
          primary: string;
          secondary: string;
          accent: string;
        };
        logo?: string;
      };
    }
  }
}

// Cache-related types
export type CacheableResource = 
  | 'course'
  | 'courses'
  | 'module'
  | 'lesson'
  | 'user'
  | 'enrollment'
  | 'discussion'
  | 'comment'
  | 'analytics';

export interface CacheOptions {
  ttl?: number;
  invalidateOn?: string[];
}
