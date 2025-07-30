import type { LucideIcon } from 'lucide-react';
import { Users, Check, Star, MessageSquareText, FileCheck, MessageSquare } from 'lucide-react';
import React from 'react';

// Define course status types for student view
export type StudentCourseStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';

export interface StudentCourse {
  id: string;
  title: string;
  imageUrl?: string;
  status: StudentCourseStatus;
  enrollmentCount: number;
  completionPercentage: number;
  nextLesson?: {
    id: string;
    title: string;
  };
}

export type ActivityType = 'STUDY_SESSION' | 'COURSE_ENROLLMENT' | 'PROJECT_SUBMISSION' | 'QUIZ_COMPLETION';

export interface StudentActivity {
  id: string;
  type: ActivityType;
  courseTitle: string;
  message: string;
  timestamp: string;
}

export interface MentorSession {
  id: string;
  title: string;
  mentorName: string;
  scheduledAt: string;
  duration: number;
  attendees: number;
  maxAttendees: number;
  meetingUrl?: string;
}

export interface StudentDashboardStats {
  totalStudyHours: number;
  totalCertificates: number;
  currentStreak: number;
  activeStudents: number;
}

export interface StudentDashboardData {
  instructorName: string;
  recentCourses: StudentCourse[];
  recentActivity: StudentActivity[];
  upcomingSessions: MentorSession[];
  overallStats: StudentDashboardStats;
}
