import type { LucideIcon } from 'lucide-react';
import { Users, Check, Star, MessageSquareText, FileCheck, MessageSquare } from 'lucide-react';
import React from 'react';

// Define course status types
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// Course related types
export interface Course {
  id: string;
  title: string;
  imageUrl?: string;
  averageRating: number;
  enrollments: {
    id: string;
    progress: number;
  }[];
  modules: {
    id: string;
    title: string;
    lessons: number;
  }[];
  status: CourseStatus;
  revenue?: number;
  updatedAt?: string;
}

// Define activity types as a union type
export type ActivityType = 'ENROLLMENT' | 'COMPLETION' | 'REVIEW' | 'QUESTION' | 'SUBMISSION';

export interface Activity {
  id: string;
  studentName: string;
  studentImage?: string | null;
  activityType: ActivityType;
  courseId: string;
  courseTitle: string;
  message?: string;
  timestamp: string;
}

// Define session types
export type SessionType = 'LECTURE' | 'OFFICE_HOURS' | 'WORKSHOP' | 'OTHER';

export interface Session {
  id: string;
  title: string;
  type: SessionType;
  date: string;
  time: string;
  duration: number;
  attendees: number;
  maxAttendees: number;
  meetingLink?: string;
}

// Define project status types
export type ProjectStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED';

export interface ProjectStats {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  submissions: number;
  pendingReview: number;
  averageScore: number;
  status: ProjectStatus;
  approvalRate?: number;
  averageFeedbackTime?: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  newEnrollments: number;
  completionRate: number;
  averageRating: number;
}

export interface DashboardData {
  instructorName: string;
  recentCourses: Course[];
  recentActivity: Activity[];
  upcomingSessions: Session[];
  projectPerformance: ProjectStats[];
  overallStats: DashboardStats;
  earningsData?: Array<{
    month: string;
    amount: number;
  }>;
  projectAnalytics?: {
    labels: string[];
    data: number[];
  };
}

// Helper functions
export const getStatusColor = (status: CourseStatus | ProjectStatus): string => {
  switch (status) {
    case 'PUBLISHED':
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-800';
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-800';
    case 'IN_REVIEW':
      return 'bg-blue-100 text-blue-800';
    case 'SUBMITTED':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getActivityIcon = (type: ActivityType): React.ReactElement<{ className?: string }, string | React.JSXElementConstructor<any>> => {
  const className = "h-5 w-5";
  const IconComponent: Record<ActivityType | 'DEFAULT', LucideIcon> = {
    'ENROLLMENT': Users,
    'COMPLETION': Check,
    'REVIEW': Star,
    'QUESTION': MessageSquareText,
    'SUBMISSION': FileCheck,
    'DEFAULT': MessageSquare
  };
  
  const IconComponentToUse = IconComponent[type] || IconComponent['DEFAULT'];
  
  const colorClasses: Record<ActivityType | 'DEFAULT', string> = {
    'ENROLLMENT': 'text-blue-500',
    'COMPLETION': 'text-green-500',
    'REVIEW': 'text-yellow-500',
    'QUESTION': 'text-purple-500',
    'SUBMISSION': 'text-indigo-500',
    'DEFAULT': 'text-gray-500'
  };
  
  const colorClass = colorClasses[type] || colorClasses['DEFAULT'];

  // Create the icon component with the correct props
  const IconElement = React.createElement(IconComponentToUse, {
    className: `${className} ${colorClass}`
  });

  return IconElement;
};

export const getSessionTypeColor = (type: SessionType): string => {
  switch (type) {
    case 'LECTURE':
      return 'bg-blue-100 text-blue-800';
    case 'WORKSHOP':
      return 'bg-purple-100 text-purple-800';
    case 'OFFICE_HOURS':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
