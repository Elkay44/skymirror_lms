import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'; // Using next-auth/next for App Router
import { authOptions } from '@/lib/auth';

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/instructor/courses - Get instructor courses data
export async function GET() {
  try {
    // Get the user session to check if they're authenticated
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is an instructor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    if (!user || user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Only instructors can access this endpoint' },
        { status: 403 }
      );
    }
    
    // Get the instructor's courses
    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
        modules: {
          include: {
            lessons: {
              include: {
                progress: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    // Calculate stats
    let totalStudents = 0;
    let totalRevenue = 0;
    let totalCompletedLessons = 0;
    let totalLessons = 0;
    
    // Transform courses data and calculate statistics
    const transformedCourses = courses.map(course => {
      // Get unique students enrolled in this course
      const uniqueStudentIds = new Set<string>();
      course.enrollments.forEach((enrollment: { user: { id: string } }) => {
        uniqueStudentIds.add(enrollment.user.id);
      });
      
      const enrollmentCount = uniqueStudentIds.size;
      totalStudents += enrollmentCount;
      
      // Calculate revenue (price * students)
      const courseRevenue = (course.price || 0) * enrollmentCount / 100; // Convert cents to dollars
      totalRevenue += courseRevenue;
      
      // Calculate completion rate
      let courseCompletedLessons = 0;
      let courseTotalLessons = 0;
      
      course.modules.forEach((module: { lessons: Array<{ progress: Array<{ completed: boolean }> }> }) => {
        module.lessons.forEach((lesson: { progress: Array<{ completed: boolean }> }) => {
          courseTotalLessons++;
          totalLessons++;
          
          // Count completed lessons
          const completedCount = lesson.progress.filter((p: { completed: boolean }) => p.completed).length;
          if (completedCount > 0) {
            courseCompletedLessons += completedCount;
            totalCompletedLessons += completedCount;
          }
        });
      });
      
      // Calculate completion rate as percentage
      const completionRate = courseTotalLessons > 0 && enrollmentCount > 0
        ? Math.round((courseCompletedLessons / (courseTotalLessons * enrollmentCount)) * 100)
        : 0;
      
      return {
        id: course.id,
        title: course.title,
        description: course.description || '',
        imageUrl: course.imageUrl,
        isPublished: course.isPublished,
        enrollmentCount,
        completionRate,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      };
    });
    
    // Calculate overall completion rate
    const overallCompletionRate = totalLessons > 0 && totalStudents > 0
      ? Math.round((totalCompletedLessons / (totalLessons * totalStudents)) * 100)
      : 0;
    
    return NextResponse.json({
      courses: transformedCourses,
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalRevenue,
        completionRate: overallCompletionRate,
      },
    });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructor courses' },
      { status: 500 }
    );
  }
}

// POST /api/instructor/courses - Create a new course
export async function POST(request: Request) {
  try {
    // Get the user session to check if they're authenticated
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is an instructor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    if (!user || user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Only instructors can create courses' },
        { status: 403 }
      );
    }
    
    // Get course data from request body
    const { title, description, difficulty = 'BEGINNER', imageUrl = null } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Course title is required' },
        { status: 400 }
      );
    }
    
    // Create the course
    const course = await prisma.course.create({
      data: {
        title,
        description,
        difficulty,
        imageUrl,
        instructor: { connect: { id: userId } },
      },
    });
    
    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        imageUrl: course.imageUrl,
        isPublished: course.isPublished,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
