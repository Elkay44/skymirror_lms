import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Define the supported batch operations as string literals
const BatchOperations = {
  PUBLISH: 'publish',
  UNPUBLISH: 'unpublish',
  ARCHIVE: 'archive',
  UNARCHIVE: 'unarchive',
  FEATURE: 'feature',
  UNFEATURE: 'unfeature',
  CHANGE_CATEGORY: 'changeCategory',
  CHANGE_LEVEL: 'changeLevel',
  CHANGE_VISIBILITY: 'changeVisibility',
  CHANGE_PRICE: 'changePrice',
} as const;

type BatchOperation = typeof BatchOperations[keyof typeof BatchOperations];

// Course status as string literals to match the database schema
const CourseStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

type CourseStatusType = typeof CourseStatus[keyof typeof CourseStatus];

// Course visibility as string literals to match the database schema
const CourseVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
} as const;

type CourseVisibilityType = typeof CourseVisibility[keyof typeof CourseVisibility];

// User role as string literals to match the database schema
const UserRole = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;

type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Validation schema for batch operations
const batchOperationSchema = z.object({
  courseIds: z.array(z.string().uuid()).min(1, 'At least one course ID is required'),
  operation: z.enum([
    BatchOperations.PUBLISH,
    BatchOperations.UNPUBLISH,
    BatchOperations.ARCHIVE,
    BatchOperations.UNARCHIVE,
    BatchOperations.FEATURE,
    BatchOperations.UNFEATURE,
    BatchOperations.CHANGE_CATEGORY,
    BatchOperations.CHANGE_LEVEL,
    BatchOperations.CHANGE_VISIBILITY,
    BatchOperations.CHANGE_PRICE,
  ]),
  categoryId: z.string().uuid().optional(),
  levelId: z.string().uuid().optional(),
  visibility: z.enum([
    CourseVisibility.PUBLIC,
    CourseVisibility.PRIVATE, 
    CourseVisibility.UNLISTED
  ]).optional(),
  price: z.number().nonnegative().optional(),
  isPaid: z.boolean().optional(),
});

type BatchOperationPayload = z.infer<typeof batchOperationSchema>;

// Type for activity logging
type ActivityLogData = {
  userId: string;
  courseId: string;
  action: string;
  details?: Record<string, any>;
};

/**
 * Log activity for a single course
 */
async function logCourseActivity(data: ActivityLogData): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        action: data.action,
        details: data.details,
      },
    });
  } catch (error) {
    console.error('Failed to log course activity:', error);
  }
}

/**
 * Log activity for a batch operation
 */
async function logBatchActivity(userId: string, operation: string, courseIds: string[], details?: Record<string, any>): Promise<void> {
  try {
    // Log the batch operation itself
    await prisma.activityLog.create({
      data: {
        userId,
        action: `batch_${operation}`,
        details: {
          courseIds,
          ...details,
        },
      },
    });
    
    // Log individual course activities
    await Promise.all(courseIds.map(courseId => 
      logCourseActivity({
        userId,
        courseId,
        action: operation,
        details,
      })
    ));
  } catch (error) {
    console.error('Failed to log batch activity:', error);
  }
}

/**
 * Process a batch operation on courses
 */
async function processBatchOperation(payload: BatchOperationPayload, userId: string): Promise<{ success: boolean; message: string; updatedCount?: number }> {
  const { courseIds, operation } = payload;
  
  // Verify all courses exist
  const coursesCount = await prisma.course.count({
    where: { id: { in: courseIds } },
  });
  
  if (coursesCount !== courseIds.length) {
    return { success: false, message: 'One or more courses not found' };
  }
  
  try {
    let updateData: Record<string, any> = {};
    let result;
    
    // Process based on operation type
    switch (operation) {
      case BatchOperations.PUBLISH:
        updateData = { status: CourseStatus.PUBLISHED };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        await logBatchActivity(userId, 'publish', courseIds);
        break;
        
      case BatchOperations.UNPUBLISH:
        updateData = { status: CourseStatus.DRAFT };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        await logBatchActivity(userId, 'unpublish', courseIds);
        break;
        
      case BatchOperations.ARCHIVE:
        updateData = { status: CourseStatus.ARCHIVED };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        await logBatchActivity(userId, 'archive', courseIds);
        break;
        
      case BatchOperations.UNARCHIVE:
        updateData = { status: CourseStatus.DRAFT };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        await logBatchActivity(userId, 'unarchive', courseIds);
        break;
        
      case BatchOperations.FEATURE:
        updateData = { featured: true };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        await logBatchActivity(userId, 'feature', courseIds);
        break;
        
      case BatchOperations.UNFEATURE:
        updateData = { featured: false };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        await logBatchActivity(userId, 'unfeature', courseIds);
        break;
        
      case BatchOperations.CHANGE_CATEGORY:
        if (!payload.categoryId) {
          return { success: false, message: 'Category ID is required' };
        }
        
        // We'll skip explicit validation and let Prisma's foreign key constraints handle it
        // If the categoryId doesn't exist, Prisma will throw an error during the update
        
        updateData = { categoryId: payload.categoryId };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        
        await logBatchActivity(
          userId, 
          'change_category', 
          courseIds, 
          { categoryId: payload.categoryId }
        );
        break;
        
      case BatchOperations.CHANGE_LEVEL:
        if (!payload.levelId) {
          return { success: false, message: 'Level ID is required' };
        }
        
        // We'll skip explicit validation and let Prisma's foreign key constraints handle it
        // If the levelId doesn't exist, Prisma will throw an error during the update
        
        updateData = { levelId: payload.levelId };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        
        await logBatchActivity(
          userId, 
          'change_level', 
          courseIds, 
          { levelId: payload.levelId }
        );
        break;
        
      case BatchOperations.CHANGE_VISIBILITY:
        if (!payload.visibility) {
          return { success: false, message: 'Visibility is required' };
        }
        
        updateData = { visibility: payload.visibility };
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        
        await logBatchActivity(
          userId, 
          'change_visibility', 
          courseIds, 
          { visibility: payload.visibility }
        );
        break;
        
      case BatchOperations.CHANGE_PRICE:
        if (payload.isPaid === undefined) {
          return { success: false, message: 'isPaid flag is required' };
        }
        
        if (payload.isPaid && (payload.price === undefined || payload.price < 0)) {
          return { success: false, message: 'Valid price is required for paid courses' };
        }
        
        updateData = payload.isPaid 
          ? { price: payload.price, free: false }
          : { price: 0, free: true };
          
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: updateData,
        });
        
        await logBatchActivity(
          userId, 
          'change_price', 
          courseIds, 
          { isPaid: payload.isPaid, price: payload.price }
        );
        break;
        
      default:
        return { success: false, message: `Unsupported operation: ${operation}` };
    }
    
    return { 
      success: true, 
      message: `Successfully processed ${operation} operation on ${result.count} courses`, 
      updatedCount: result.count 
    };
    
  } catch (error) {
    console.error(`Error processing batch operation ${operation}:`, error);
    return { success: false, message: `Failed to process operation: ${(error as Error).message}` };
  }
}

/**
 * POST /api/admin/courses/batch
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Get user session
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check if user has admin role
  if (session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
  }
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = batchOperationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const payload = validationResult.data;
    const userId = session.user.id;
    
    // Process the batch operation
    const result = await processBatchOperation(payload, userId);
    
    // If operation failed, return error response
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    
    // Revalidate course paths to update the UI
    revalidatePath('/admin/courses');
    revalidatePath('/courses');
    
    return NextResponse.json({
      message: result.message,
      updatedCount: result.updatedCount,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error in batch operation:', error);
    return NextResponse.json(
      { error: 'Failed to process batch operation' },
      { status: 500 }
    );
  }
}
