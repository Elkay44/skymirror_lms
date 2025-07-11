import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for course submission request
const courseSubmissionSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  submissionNotes: z.string().optional(),
});

// Schema for course review decision
const courseReviewSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  decision: z.enum(['approve', 'reject']),
  feedback: z.string().optional(),
});

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// POST /api/courses/approval/submit - Submit a course for approval
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userIdNum = Number(session.user.id);
    
    // Parse and validate the request body
    const body = await req.json();
    const { courseId, submissionNotes } = courseSubmissionSchema.parse(body);
    
    // Check if the course exists and belongs to the current instructor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
        title: true,
        status: true,
        approvalStatus: true,
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Only the instructor can submit their own course for approval
    if (course.instructorId !== userIdNum) {
      return NextResponse.json(
        { error: 'You can only submit your own courses for approval' },
        { status: 403 }
      );
    }
    
    // Check course's current approval status
    if (course.approvalStatus === 'PENDING') {
      return NextResponse.json(
        { error: 'Course is already pending approval' },
        { status: 400 }
      );
    }
    
    // Update course approval status and record submission
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        approvalStatus: 'PENDING',
        status: 'PENDING_APPROVAL', // Custom course status for pending approval
        submittedForApprovalAt: new Date(),
        submissionNotes: submissionNotes || '',
      }
    });
    
    // Find admin users to notify
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true
      }
    });
    
    // Create notifications for all admin users
    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Course Awaiting Approval',
          message: `Course "${course.title}" has been submitted for approval.`,
          type: 'COURSE_APPROVAL',
          linkUrl: `/admin/courses/approval/${courseId}`,
        }
      });
    }
    
    return NextResponse.json({
      message: 'Course submitted for approval successfully',
      course: {
        id: updatedCourse.id,
        status: updatedCourse.status,
        approvalStatus: updatedCourse.approvalStatus,
        submittedAt: updatedCourse.submittedForApprovalAt,
      }
    });
  } catch (error) {
    console.error('[COURSE_SUBMISSION_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit course for approval' },
      { status: 500 }
    );
  }
}

// GET /api/courses/approval - Get pending course approvals (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
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
    
    // Parse query parameters for filtering and pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || 'PENDING';
    
    // Calculate offset for pagination
    const skip = (page - 1) * limit;
    
    // Build where clause based on status filter
    const whereClause: any = {};
    if (status === 'PENDING') {
      whereClause.approvalStatus = 'PENDING';
    } else if (status === 'APPROVED') {
      whereClause.approvalStatus = 'APPROVED';
    } else if (status === 'REJECTED') {
      whereClause.approvalStatus = 'REJECTED';
    }
    
    // Get total count for pagination
    const totalCount = await prisma.course.count({
      where: whereClause
    });
    
    // Get pending approvals with course and instructor details
    const pendingApprovals = await prisma.course.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        submittedForApprovalAt: 'desc'
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });
    
    return NextResponse.json({
      pendingApprovals: pendingApprovals.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        instructor: course.instructor,
        submittedAt: course.submittedForApprovalAt,
        submissionNotes: course.submissionNotes,
        approvalStatus: course.approvalStatus,
        adminFeedback: course.adminFeedback,
      })),
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + pendingApprovals.length < totalCount
      }
    });
  } catch (error) {
    console.error('[GET_PENDING_APPROVALS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}
