import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/enrollment - Get current user's enrollments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 });
    }
    const userId = Number(session.user.id);
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });
    // Optionally compute progress if you have a progress field/model
    const formatted = enrollments.map((enrollment: any) => ({
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      course: enrollment.course,
      progress: typeof enrollment.progress === 'number' ? enrollment.progress : 0,
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('FULL ERROR OBJECT (GET /api/enrollment):', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/enrollment - Enroll in a course
export async function POST(request: Request) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to enroll in a course' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    // Get the course ID from the request body
    const { courseId } = await request.json();
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is already enrolled in this course
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId,
      },
    });
    
    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 400 }
      );
    }
    
    // Create the enrollment record
    const enrollment = await prisma.enrollment.create({
      data: {
        user: { connect: { id: userId } },
        course: { connect: { id: courseId } },
        status: 'ACTIVE'
      }
    });

    // Get the updated course with enrollment data
    const updatedCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: true
      }
    });
    
    // Award points to the user for enrolling in a new course
    await prisma.user.update({
      where: { id: String(userId) },
      data: {
        points: { increment: 10 }, // Add 10 points for enrolling in a course
      },
    });
    
    return NextResponse.json({ success: true, enrollmentId: enrollment.id });
  } catch (error) {
    console.error('FULL ERROR OBJECT (POST /api/enrollment):', error);
    // Return the real error message for debugging
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
