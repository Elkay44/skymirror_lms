import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { invalidateCache } from '@/lib/cache';

// Schema for course approval actions
const courseApprovalSchema = z.object({
  courseId: z.string(),
  action: z.enum(['approve', 'reject', 'request-changes']),
  comments: z.string().optional(),
  publishOnApproval: z.boolean().default(true)
});

// Schema for bulk approval actions
const bulkApprovalSchema = z.object({
  courseIds: z.array(z.string()).min(1),
  action: z.enum(['approve', 'reject', 'request-changes']),
  comments: z.string().optional(),
  publishOnApproval: z.boolean().default(true)
});

// GET /api/admin/courses/approval - Get courses pending approval
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true }
    });
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse query parameters for pagination and filtering
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || 'PENDING_APPROVAL';
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || 'createdAt';
    const order = url.searchParams.get('order') || 'desc';
    
    // Validate status parameter
    const validStatuses = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'ALL'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Calculate pagination offsets
    const skip = (page - 1) * limit;
    
    // Build where clause for filtering
    let whereClause: any = {};
    
    if (status !== 'ALL') {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructor: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Determine sort field and order
    let orderBy: any = {};
    switch (sort) {
      case 'title':
      case 'createdAt':
      case 'updatedAt':
      case 'price':
        orderBy[sort] = order;
        break;
      case 'instructor':
        orderBy = { instructor: { name: order } };
        break;
      default:
        orderBy.createdAt = 'desc';
    }
    
    // Get total count for pagination
    const totalCount = await prisma.course.count({
      where: whereClause
    });
    
    // Fetch courses pending approval
    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            modules: true,
            enrollments: true
          }
        },
        approvalHistory: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy,
      skip,
      take: limit
    });
    
    // Transform the data for the response
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      imageUrl: course.imageUrl,
      price: course.price,
      category: course.category,
      level: course.level,
      language: course.language,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      status: course.status,
      instructor: course.instructor,
      moduleCount: course._count.modules,
      enrollmentCount: course._count.enrollments,
      lastReview: course.approvalHistory.length > 0 ? {
        action: course.approvalHistory[0].action,
        comments: course.approvalHistory[0].comments,
        reviewedAt: course.approvalHistory[0].createdAt,
        reviewedBy: course.approvalHistory[0].adminName
      } : null
    }));
    
    return NextResponse.json({
      courses: formattedCourses,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      },
      filters: {
        status,
        search: search || null,
        sort,
        order
      }
    });
  } catch (error) {
    console.error('[GET_COURSES_APPROVAL_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses pending approval' },
      { status: 500 }
    );
  }
}

// POST /api/admin/courses/approval - Process a course approval action
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true, name: true }
    });
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const adminId = Number(session.user.id);
    const adminName = user.name || 'Admin';
    
    // Parse request body
    const body = await req.json();
    
    // Check if this is a bulk operation or a single course operation
    if (Array.isArray(body.courseIds)) {
      // Handle bulk operation
      const { courseIds, action, comments, publishOnApproval } = bulkApprovalSchema.parse(body);
      
      // Process each course
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const courseId of courseIds) {
        try {
          // Get the course and instructor
          const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
              id: true,
              title: true,
              instructorId: true
            }
          });
          
          if (!course) {
            results.failed++;
            results.errors.push(`Course with ID ${courseId} not found`);
            continue;
          }
          
          // Determine new status based on action
          let newStatus: string;
          let notificationType: string;
          let notificationMessage: string;
          
          switch (action) {
            case 'approve':
              newStatus = 'APPROVED';
              notificationType = 'COURSE_APPROVED';
              notificationMessage = `Your course "${course.title}" has been approved${comments ? `: ${comments}` : '.'}`;
              break;
            case 'reject':
              newStatus = 'REJECTED';
              notificationType = 'COURSE_REJECTED';
              notificationMessage = `Your course "${course.title}" has been rejected${comments ? `: ${comments}` : '.'}`;
              break;
            case 'request-changes':
              newStatus = 'CHANGES_REQUESTED';
              notificationType = 'COURSE_CHANGES_REQUESTED';
              notificationMessage = `Changes have been requested for your course "${course.title}"${comments ? `: ${comments}` : '.'}`;
              break;
          }
          
          // Update course status
          await prisma.course.update({
            where: { id: courseId },
            data: {
              status: newStatus,
              isPublished: action === 'approve' && publishOnApproval,
              publishedAt: action === 'approve' && publishOnApproval ? new Date() : undefined
            }
          });
          
          // Record the approval action in history
          await prisma.courseApprovalHistory.create({
            data: {
              courseId,
              action,
              comments: comments || '',
              adminId,
              adminName
            }
          });
          
          // Send notification to the instructor
          await prisma.notification.create({
            data: {
              userId: course.instructorId,
              title: `Course ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Changes Requested'}`,
              message: notificationMessage,
              type: 'COURSE'
            }
          });
          
          // Invalidate course cache
          await invalidateCache('course', courseId);
          
          results.success++;
        } catch (error) {
          console.error(`Error processing course ${courseId}:`, error);
          results.failed++;
          results.errors.push(`Failed to process course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      return NextResponse.json({
        message: `Processed ${results.success} of ${courseIds.length} courses`,
        results
      });
    } else {
      // Handle single course operation
      const { courseId, action, comments, publishOnApproval } = courseApprovalSchema.parse(body);
      
      // Get the course and instructor
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          instructorId: true
        }
      });
      
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
      
      // Determine new status based on action
      let newStatus: string;
      let notificationType: string;
      let notificationMessage: string;
      
      switch (action) {
        case 'approve':
          newStatus = 'APPROVED';
          notificationType = 'COURSE_APPROVED';
          notificationMessage = `Your course "${course.title}" has been approved${comments ? `: ${comments}` : '.'}`;
          break;
        case 'reject':
          newStatus = 'REJECTED';
          notificationType = 'COURSE_REJECTED';
          notificationMessage = `Your course "${course.title}" has been rejected${comments ? `: ${comments}` : '.'}`;
          break;
        case 'request-changes':
          newStatus = 'CHANGES_REQUESTED';
          notificationType = 'COURSE_CHANGES_REQUESTED';
          notificationMessage = `Changes have been requested for your course "${course.title}"${comments ? `: ${comments}` : '.'}`;
          break;
      }
      
      // Update course status
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
          status: newStatus,
          isPublished: action === 'approve' && publishOnApproval,
          publishedAt: action === 'approve' && publishOnApproval ? new Date() : undefined
        }
      });
      
      // Record the approval action in history
      await prisma.courseApprovalHistory.create({
        data: {
          courseId,
          action,
          comments: comments || '',
          adminId,
          adminName
        }
      });
      
      // Send notification to the instructor
      await prisma.notification.create({
        data: {
          userId: course.instructorId,
          title: `Course ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Changes Requested'}`,
          message: notificationMessage,
          type: 'COURSE'
        }
      });
      
      // Invalidate course cache
      await invalidateCache('course', courseId);
      
      return NextResponse.json({
        message: `Course ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes requested'} successfully`,
        course: {
          id: updatedCourse.id,
          status: updatedCourse.status,
          isPublished: updatedCourse.isPublished
        }
      });
    }
  } catch (error) {
    console.error('[COURSE_APPROVAL_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process course approval' },
      { status: 500 }
    );
  }
}
