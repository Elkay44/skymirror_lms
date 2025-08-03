import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[courseId]/enrollment - Check if user is enrolled in a specific course
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ isEnrolled: false });
    }
    
    const userId = Number(session.user.id);
    
    // Check if the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId: courseId,
      },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
      }
    });
    
    return NextResponse.json({
      isEnrolled: !!enrollment,
      enrollment: enrollment ? {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      } : null
    });
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return NextResponse.json(
      { error: 'Failed to check enrollment status' },
      { status: 500 }
    );
  }
}
