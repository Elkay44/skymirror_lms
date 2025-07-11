import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { invalidateCache } from '@/lib/cache';

// Define schema for batch course operations
const batchOperationSchema = z.object({
  courseIds: z.array(z.string()).min(1, 'At least one course ID is required'),
  operation: z.enum([
    'delete',
    'publish',
    'unpublish',
    'archive',
    'set-featured',
    'unset-featured',
    'set-category',
    'set-status',
    'update-settings'
  ]),
  data: z.object({
    category: z.string().optional(),
    status: z.string().optional(),
    featured: z.boolean().optional(),
    level: z.string().optional(),
    language: z.string().optional(),
    price: z.number().optional(),
    requiresApproval: z.boolean().optional(),
  }).optional(),
});

// Dynamic route to ensure data is not cached
export const dynamic = 'force-dynamic';

// POST /api/courses/batch - Perform batch operations on multiple courses
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Parse the request body
    const body = await req.json();
    const { courseIds, operation, data } = batchOperationSchema.parse(body);
    
    // Check user permission - must be an instructor or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const isAdmin = user?.role === 'ADMIN';
    
    // For non-admins, verify ownership of all courses
    if (!isAdmin) {
      // Check if the user is the instructor for all courses in the batch
      const coursesCount = await prisma.course.count({
        where: {
          id: { in: courseIds },
          instructorId: userId
        }
      });
      
      // If the count doesn't match the number of course IDs, some courses are not owned by the user
      if (coursesCount !== courseIds.length) {
        return NextResponse.json(
          { error: 'You do not have permission to modify one or more of these courses' },
          { status: 403 }
        );
      }
    }
    
    // Prepare the result object
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      courseIds: [] as string[]
    };
    
    // Process based on operation type
    switch (operation) {
      case 'delete':
        // Check if any courses have active enrollments
        const coursesWithEnrollments = await prisma.course.findMany({
          where: {
            id: { in: courseIds },
            enrollments: {
              some: {
                status: 'ACTIVE'
              }
            }
          },
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                enrollments: true
              }
            }
          }
        });
        
        // For non-admins, prevent deletion of courses with active enrollments
        if (coursesWithEnrollments.length > 0 && !isAdmin) {
          return NextResponse.json({
            error: 'Some courses have active enrollments and cannot be deleted',
            coursesWithEnrollments: coursesWithEnrollments.map(c => ({
              id: c.id,
              title: c.title,
              enrollments: c._count.enrollments
            })),
            suggestion: 'Consider archiving these courses instead'
          }, { status: 400 });
        }
        
        // Delete courses one by one to handle errors individually
        for (const courseId of courseIds) {
          try {
            await prisma.course.delete({
              where: { id: courseId }
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to delete course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
        
      case 'publish':
        // Update all courses to published status
        for (const courseId of courseIds) {
          try {
            await prisma.course.update({
              where: { id: courseId },
              data: {
                isPublished: true,
                status: 'PUBLISHED',
                publishedAt: new Date()
              }
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to publish course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
        
      case 'unpublish':
        // Update all courses to unpublished status
        for (const courseId of courseIds) {
          try {
            await prisma.course.update({
              where: { id: courseId },
              data: {
                isPublished: false,
                status: 'DRAFT'
              }
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to unpublish course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
        
      case 'archive':
        // Update all courses to archived status
        for (const courseId of courseIds) {
          try {
            await prisma.course.update({
              where: { id: courseId },
              data: {
                status: 'ARCHIVED'
              }
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to archive course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
        
      case 'set-featured':
        // Update all courses to featured status
        for (const courseId of courseIds) {
          try {
            await prisma.course.update({
              where: { id: courseId },
              data: {
                featured: true
              }
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to set featured status for course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
        
      case 'unset-featured':
        // Update all courses to not featured status
        for (const courseId of courseIds) {
          try {
            await prisma.course.update({
              where: { id: courseId },
              data: {
                featured: false
              }
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to unset featured status for course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
        
      case 'set-category':
        // Validate that category is provided
        if (!data?.category) {
          return NextResponse.json(
            { error: 'Category must be provided for set-category operation' },
            { status: 400 }
          );
        }
        
        // Update category for all courses
        for (const courseId of courseIds) {
          try {
            await prisma.course.update({
              where: { id: courseId },
              data: {
                category: data.category
              }
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to update category for course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
        
      case 'set-status':
        // Validate that status is provided
        if (!data?.status) {
          return NextResponse.json(
            { error: 'Status must be provided for set-status operation' },
            { status: 400 }
          );
        }
        
        // Validate the status value
        const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'PENDING_APPROVAL', 'REJECTED'];
        if (!validStatuses.includes(data.status)) {
          return NextResponse.json(
            { error: `Status must be one of: ${validStatuses.join(', ')}` },
            { status: 400 }
          );
        }
        
        // Update status for all courses
        for (const courseId of courseIds) {
          try {
            // If status is PUBLISHED, also set isPublished to true
            const updateData: any = {
              status: data.status
            };
            
            if (data.status === 'PUBLISHED') {
              updateData.isPublished = true;
              updateData.publishedAt = new Date();
            } else if (data.status === 'DRAFT' || data.status === 'ARCHIVED') {
              updateData.isPublished = false;
            }
            
            await prisma.course.update({
              where: { id: courseId },
              data: updateData
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to update status for course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
        
      case 'update-settings':
        // Validate that some settings are provided
        if (!data || Object.keys(data).length === 0) {
          return NextResponse.json(
            { error: 'At least one setting must be provided for update-settings operation' },
            { status: 400 }
          );
        }
        
        // Prepare the update data
        const updateData: any = {};
        
        if (data.level !== undefined) updateData.level = data.level;
        if (data.language !== undefined) updateData.language = data.language;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval;
        
        // Update settings for all courses
        for (const courseId of courseIds) {
          try {
            await prisma.course.update({
              where: { id: courseId },
              data: updateData
            });
            
            // Invalidate cache for this course
            await invalidateCache('course', courseId);
            
            result.success++;
            result.courseIds.push(courseId);
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to update settings for course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        break;
    }
    
    // Create an activity log entry for this batch operation
    await prisma.activityLog.create({
      data: {
        userId,
        action: `BATCH_${operation.toUpperCase()}`,
        resourceType: 'COURSE',
        resourceId: 'BATCH',
        details: JSON.stringify({
          operation,
          courseIds: result.courseIds,
          data: data || null,
          success: result.success,
          failed: result.failed
        })
      }
    });
    
    // Also invalidate the courses list cache
    await invalidateCache('courses', 'list');
    
    // Return the result
    return NextResponse.json({
      message: `Successfully processed ${result.success} of ${courseIds.length} courses`,
      result
    });
  } catch (error) {
    console.error('[BATCH_OPERATION_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process batch operation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
