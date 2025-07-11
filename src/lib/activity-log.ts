import prismaBase from '@/lib/prisma';
import { Session } from 'next-auth';

// FIXME: The activityLog model appears to be missing from TypeScript types
// We're using a type assertion to work around this issue
// This should be properly fixed by ensuring the Prisma schema includes the ActivityLog model
// and that it's properly generated in the Prisma client

// Define a minimal interface for activity log operations to satisfy TypeScript
interface ActivityLogClient {
  activityLog: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    count: (args: any) => Promise<number>;
  };
}

// Apply the interface to our client with type assertion
const prisma = prismaBase as unknown as ActivityLogClient;

export type ActivityEntity = 
  | 'course'
  | 'module'
  | 'lesson'
  | 'quiz'
  | 'question'
  | 'user'
  | 'instructor'
  | 'enrollment'
  | 'discussion'
  | 'comment'
  | 'review'
  | 'system';

export type ActivityAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'restore'
  | 'duplicate'
  | 'approve'
  | 'reject'
  | 'suspend'
  | 'activate'
  | 'enroll'
  | 'unenroll'
  | 'complete'
  | 'feature'
  | 'unfeature'
  | 'restore_version'
  | 'batch_operation'
  | 'login'
  | 'logout'
  | 'import'
  | 'export';

export interface ActivityLogDetails {
  entityId?: string | number;
  entityType?: ActivityEntity;
  action?: ActivityAction;
  previousState?: any;
  newState?: any;
  metadata?: Record<string, any>;
  success?: boolean;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Log an activity performed by a user
 */
export async function logActivity(
  userId: number,
  action: ActivityAction,
  entity: ActivityEntity,
  entityId: string | number,
  details: ActivityLogDetails = {}
) {
  try {
    const activityLog = await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: entity,
        entityId: String(entityId),
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
      }
    });
    
    return activityLog;
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
}

/**
 * Log an activity from a session
 */
export async function logActivityFromSession(
  session: Session | null,
  action: ActivityAction,
  entity: ActivityEntity,
  entityId: string | number,
  details: ActivityLogDetails = {}
) {
  if (!session?.user?.id) {
    return null;
  }
  
  return await logActivity(
    Number(session.user.id), // Properly convert string ID to number
    action,
    entity,
    entityId,
    details
  );
}

/**
 * Log course related activity
 */
export async function logCourseActivity(
  userId: number,
  courseId: string,
  action: ActivityAction,
  details: ActivityLogDetails = {}
) {
  return await logActivity(
    userId,
    action,
    'course',
    courseId,
    details
  );
}

/**
 * Log instructor related activity
 */
export async function logInstructorActivity(
  adminId: number,
  instructorId: number,
  action: ActivityAction,
  details: ActivityLogDetails = {}
) {
  return await logActivity(
    adminId,
    action,
    'instructor',
    instructorId,
    details
  );
}

/**
 * Get activity logs with filtering and pagination
 */
export async function getActivityLogs(
  options: {
    userId?: number;
    entityType?: ActivityEntity;
    entityId?: string;
    action?: ActivityAction;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}
) {
  const {
    userId,
    entityType,
    entityId,
    action,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = options;

  const where: any = {};
  
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  
  try {
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.activityLog.count({ where })
    ]);
    
    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Failed to get activity logs:', error);
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    };
  }
}

/**
 * Get recent activities for a specific user
 */
export async function getUserRecentActivities(
  userId: number,
  limit: number = 10
) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return logs;
  } catch (error) {
    console.error('Failed to get user recent activities:', error);
    return [];
  }
}

/**
 * Get recent activities for a specific course
 */
export async function getCourseActivities(
  courseId: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { 
          entityType: 'course',
          entityId: courseId
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      }),
      prisma.activityLog.count({
        where: { 
          entityType: 'course',
          entityId: courseId
        }
      })
    ]);
    
    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Failed to get course activities:', error);
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    };
  }
}
