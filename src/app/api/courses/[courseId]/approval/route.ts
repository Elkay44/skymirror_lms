import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, withErrorHandling, CommonErrors } from '@/lib/api-utils';
import { authOptions } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { logCourseActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

// Schema for course approval request
const courseApprovalSchema = z.object({
  status: z.enum(['SUBMIT_FOR_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  comments: z.string().optional(),
});

// Schema for course approval history
const approvalHistorySchema = z.object({
  action: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  comments: z.string().optional(),
});

/**
 * GET /api/courses/[courseId]/approval - Get course approval status and history
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { courseId: string } }) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const courseId = params.courseId;

    // Fetch the course with approval history
    const course = await prisma.course.findUnique({
      where: {
        id: courseId
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        approvalHistory: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return createErrorResponse('Course not found', 404);
    }

    // Check access permissions
    const userId = session.user.id;
    const userRole = session.user.role;

    const isInstructor = course.instructorId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isInstructor && !isAdmin) {
      return createErrorResponse('You do not have permission to view this course approval information', 403);
    }

    return Response.json({
      success: true,
      data: {
        id: course.id,
        title: course.title,
        status: course.status,
        instructor: course.instructor,
        approvalHistory: course.approvalHistory
      }
    });
  }
);

/**
 * POST /api/courses/[courseId]/approval - Update course approval status
 */
export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: { courseId: string } }) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const courseId = params.courseId;
    const userId = session.user.id;
    const userRole = session.user.role;

    // Parse and validate the request body
    const requestBody = await req.json();
    const validationResult = courseApprovalSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return createErrorResponse('Invalid request data', 400);
    }

    const { status, comments } = validationResult.data;

    // Fetch the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        instructorId: true
      }
    });

    if (!course) {
      return createErrorResponse('Course not found', 404);
    }

    // Check permissions based on action
    const isInstructor = course.instructorId === userId;
    const isAdmin = userRole === 'ADMIN';

    // Only instructors can submit courses for review
    if (status === 'SUBMIT_FOR_REVIEW' && !isInstructor) {
      return createErrorResponse('Only instructors can submit courses for review', 403);
    }

    // Only admins can approve, reject or request changes
    if (['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status) && !isAdmin) {
      return createErrorResponse('Only administrators can approve or reject courses', 403);
    }

    // Determine the new course status
    let newCourseStatus;
    let action;

    switch (status) {
      case 'SUBMIT_FOR_REVIEW':
        newCourseStatus = 'UNDER_REVIEW';
        action = 'SUBMITTED';
        break;
      case 'APPROVED':
        newCourseStatus = 'PUBLISHED';
        action = 'APPROVED';
        break;
      case 'REJECTED':
        newCourseStatus = 'DRAFT';
        action = 'REJECTED';
        break;
      case 'CHANGES_REQUESTED':
        newCourseStatus = 'DRAFT';
        action = 'CHANGES_REQUESTED';
        break;
    }

    // Update course status and create approval history entry in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update course status
      const updatedCourse = await tx.course.update({
        where: { id: courseId },
        data: { 
          status: newCourseStatus,
          updatedAt: new Date()
        }
      });

      // Create approval history entry
      const historyEntry = await tx.courseApprovalHistory.create({
        data: {
          courseId,
          action,
          comments,
          reviewerId: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status) ? userId : null
        }
      });

      return { updatedCourse, historyEntry };
    });

    // Log the activity
    await logCourseActivity({
      courseId,
      userId,
      action: `course_${action.toLowerCase()}`,
      details: { comments }
    });

    // Invalidate cache for this course
    await cache.invalidate(`course:${courseId}`);
    await cache.invalidate('courses:list');

    return Response.json({
      success: true,
      message: `Course ${action.toLowerCase()} successfully`,
      data: {
        id: result.updatedCourse.id,
        title: result.updatedCourse.title,
        status: result.updatedCourse.status,
        historyEntry: result.historyEntry
      }
    });
  }
);

/**
 * DELETE /api/courses/[courseId]/approval/[historyId] - Delete a course approval history entry (Admin only)
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: { courseId: string, historyId?: string } }) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userRole = session.user.role;

    // Only admins can delete approval history entries
    if (userRole !== 'ADMIN') {
      return createErrorResponse('Only administrators can delete approval history', 403);
    }

    const courseId = params.courseId;
    
    // Extract the historyId from the URL
    const url = new URL(req.url);
    const historyId = url.pathname.split('/').pop();

    if (!historyId) {
      return createErrorResponse('History ID is required', 400);
    }

    // Check if the history entry exists and belongs to the specified course
    const historyEntry = await prisma.courseApprovalHistory.findFirst({
      where: {
        id: historyId,
        courseId: courseId
      }
    });

    if (!historyEntry) {
      return createErrorResponse('Approval history entry not found', 404);
    }

    // Delete the history entry
    await prisma.courseApprovalHistory.delete({
      where: { id: historyId }
    });

    return Response.json({
      success: true,
      message: 'Approval history entry deleted successfully'
    });
  }
);
