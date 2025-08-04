import prisma from '@/lib/prisma-extensions';


// Create a simple getUserById function since the module doesn't exist yet
async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true
    }
  });
}
// Import individual cache functions
import { getFromCache, setCache, invalidateCache } from '@/lib/cache';

export type NotificationType = 
  | 'course_approval'
  | 'course_rejection'
  | 'course_changes_requested'
  | 'course_published'
  | 'instructor_approved'
  | 'instructor_rejected'
  | 'instructor_suspended'
  | 'enrollment'
  | 'comment'
  | 'reply'
  | 'course_featured'
  | 'course_review'
  | 'assignment_graded'
  | 'quiz_completed';

export interface NotificationMetadata {
  courseId?: string;
  lessonId?: string;
  discussionId?: string;
  commentId?: string;
  actionType?: string;
  actorId?: number;
  actorName?: string;
  resourceUrl?: string;
  [key: string]: any;
}

/**
 * Creates a notification for a specific user
 */
export async function createNotification(
  userId: string,
  type: string,
  message: string,
  metadata: NotificationMetadata = {}
) {
  try {
    // Construct notification data based on actual schema fields
    const notificationData = {
      userId,
      type,
      title: message.substring(0, 100), 
      message,
      isRead: false,
      metadata: JSON.stringify(metadata)
    };
    
    const notification = await prisma.notification.create({
      data: notificationData
    });

    // Invalidate the user's notifications cache
    await invalidateCache('user', `notifications:${userId}`);
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Creates notifications for multiple users
 */
export async function createNotificationForMany(
  userIds: string[],
  type: string,
  message: string,
  metadata: NotificationMetadata = {}
) {
  try {
    const uniqueUserIds = [...new Set(userIds)];
    
    // Create notifications for all users using createMany for better performance
    const notificationsData = uniqueUserIds.map(userId => ({
      userId,
      type,
      title: message.substring(0, 100),
      message,
      isRead: false,
      metadata: JSON.stringify(metadata)
    }));
    
    const result = await prisma.notification.createMany({
      data: notificationsData
    });
    
    // Return the count from createMany result
    const notifications = {
      count: result.count
    };
    
    // Invalidate cache for all affected users
    await Promise.all(
      uniqueUserIds.map(userId => 
        invalidateCache('user', `notifications:${userId}`)
      )
    );
    
    return notifications;
  } catch (error) {
    console.error('Failed to create notifications for multiple users:', error);
    return null;
  }
}

/**
 * Creates a notification for course instructors
 */
export async function notifyCourseInstructor(
  courseId: string,
  type: NotificationType,
  message: string,
  metadata: NotificationMetadata = {}
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    
    if (!course) return null;
    
    return await createNotification(
      course.instructorId,
      type,
      message,
      { ...metadata, courseId }
    );
  } catch (error) {
    console.error('Failed to notify course instructor:', error);
    return null;
  }
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(id: string, userId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });
    
    if (!notification || notification.userId !== userId) {
      return null;
    }
    
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    
    // Invalidate the user's notifications cache
    await invalidateCache('user', `notifications:${userId}`);
    
    return updated;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return null;
  }
}

/**
 * Marks all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await prisma.notification.updateMany({
      where: { 
        userId
      },
      data: { isRead: true }
    });
    
    // Invalidate the user's notifications cache
    await invalidateCache('user', `notifications:${userId}`);
    
    return result;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return null;
  }
}

/**
 * Gets user notifications with pagination
 */
export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 10,
  unreadOnly: boolean = false
) {
  try {
    // Try to get from cache first
    const cacheKey = `notifications:${userId}:${page}:${limit}:${unreadOnly ? 'unread' : 'all'}`;
    const cached = await getFromCache<any>('user', cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const whereClause: any = {
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    };
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where: whereClause })
    ]);
    
    const result = {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    };
    
    // Store in cache
    await setCache('user', cacheKey, result, 300); // Cache for 5 minutes
    
    return result;
  } catch (error) {
    console.error('Failed to get user notifications:', error);
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
 * Sends a notification about course approval status
 */
export async function sendCourseApprovalNotification(
  courseId: string,
  action: 'approve' | 'reject' | 'request-changes',
  comments?: string
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        title: true,
        instructorId: true 
      }
    });
    
    if (!course) return null;
    
    let message = '';
    let type: NotificationType;
    
    switch (action) {
      case 'approve':
        message = `Your course "${course.title}" has been approved and is now published`;
        type = 'course_approval';
        break;
      case 'reject':
        message = `Your course "${course.title}" has been rejected${comments ? ': ' + comments : ''}`;
        type = 'course_rejection';
        break;
      case 'request-changes':
        message = `Changes requested for your course "${course.title}"${comments ? ': ' + comments : ''}`;
        type = 'course_changes_requested';
        break;
    }
    
    return await createNotification(
      course.instructorId,
      type,
      message,
      { 
        courseId,
        actionType: action,
        comments,
        resourceUrl: `/instructor/courses/${courseId}`
      }
    );
  } catch (error) {
    console.error('Failed to send course approval notification:', error);
    return null;
  }
}

/**
 * Sends a notification about instructor status
 */
export async function sendInstructorStatusNotification(
  instructorId: string,
  action: 'approve' | 'reject' | 'suspend' | 'activate',
  message?: string
) {
  try {
    const instructor = await getUserById(instructorId);
    
    if (!instructor) return null;
    
    let notificationMsg = '';
    let type: NotificationType;
    
    switch (action) {
      case 'approve':
        notificationMsg = 'Your instructor application has been approved. You can now create courses!';
        type = 'instructor_approved';
        break;
      case 'reject':
        notificationMsg = `Your instructor application has been rejected${message ? ': ' + message : ''}`;
        type = 'instructor_rejected';
        break;
      case 'suspend':
        notificationMsg = `Your instructor account has been suspended${message ? ': ' + message : ''}`;
        type = 'instructor_suspended';
        break;
      case 'activate':
        notificationMsg = 'Your instructor account has been activated again. You can now continue creating courses!';
        type = 'instructor_approved';
        break;
    }
    
    return await createNotification(
      instructorId,
      type,
      notificationMsg,
      { 
        actionType: action,
        message,
        resourceUrl: `/instructor/dashboard`
      }
    );
  } catch (error) {
    console.error('Failed to send instructor status notification:', error);
    return null;
  }
}
