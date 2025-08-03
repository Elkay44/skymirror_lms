import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify the course belongs to this instructor
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructorId: userId 
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have access to it' },
        { status: 404 }
      );
    }

    // Get all enrolled students for this course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    // Transform the data to include progress information
    const studentsData = enrollments.map((enrollment) => ({
      id: enrollment.id,
      user: enrollment.user,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      progress: enrollment.progress || 0,
      completedLessons: 0, // TODO: Calculate from lesson progress
      totalLessons: 0, // TODO: Calculate from course modules
      grade: null, // TODO: Calculate from submissions and grades
      status: 'active', // All enrolled students are active
    }));

    return NextResponse.json(studentsData);
  } catch (error) {
    console.error('Error fetching course students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students data' },
      { status: 500 }
    );
  }
}
