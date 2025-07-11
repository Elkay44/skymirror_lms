/**
 * Activity Logger - Utility for logging important system activities
 * 
 * This module provides functionality to log various types of activities
 * in the system, particularly for audit trails and analytics.
 */

import { PrismaClient } from '@prisma/client';

export type ActivityType = 
  // Course related activities
  | 'course.created'
  | 'course.updated'
  | 'course.deleted'
  | 'course.published'
  | 'course.unpublished'
  | 'course.archived'
  | 'course.submitted_for_review'
  | 'course.approved'
  | 'course.rejected'
  | 'course.changes_requested';

interface ActivityLogParams {
  // Required fields
  courseId?: string;
  userId: number;
  type: ActivityType;
  
  // Optional fields
  details?: Record<string, any>;
  moduleId?: string;
  lessonId?: string;
  enrollmentId?: string;
}

/**
 * Logs an activity related to a course
 * 
 * @param prisma - Prisma client instance or transaction
 * @param params - Activity parameters
 * @returns The created activity log entry
 */
export async function logCourseActivity(
  prisma: PrismaClient | any, // Allow transaction objects
  params: ActivityLogParams
) {
  try {
    // Extract parameters
    const { courseId, userId, type, details, moduleId, lessonId, enrollmentId } = params;
    
    // Create the activity log
    return await prisma.activityLog.create({
      data: {
        userId,
        courseId,
        moduleId,
        lessonId,
        enrollmentId,
        type,
        details: details ? JSON.stringify(details) : null,
      }
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    // We don't want to throw errors from logging as it's a non-critical operation
    return null;
  }
}

/**
 * Retrieves activity logs for a specific course
 * 
 * @param prisma - Prisma client instance
 * @param courseId - ID of the course
 * @param limit - Maximum number of logs to return
 * @returns Array of activity logs
 */
export async function getCourseActivityLogs(
  prisma: PrismaClient,
  courseId: string,
  limit: number = 100
) {
  return await prisma.activityLog.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      }
    }
  });
}
