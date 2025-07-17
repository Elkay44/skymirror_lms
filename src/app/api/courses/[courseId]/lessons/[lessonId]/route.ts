import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next'; // Using next-auth/next for App Router
import { authOptions } from '@/lib/auth';

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/courses/[courseId]/lessons/[lessonId] - Get a specific lesson with its details
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const { courseId, lessonId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    // Check if the user is logged in
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to view lesson content' },
        { status: 401 }
      );
    }

    console.log(`Lesson access request - User ID: ${userId}, Role: ${userRole}, Course: ${courseId}, Lesson: ${lessonId}`);

    let hasAccess = false;

    // Check if user is an instructor for this course or an admin
    if (userRole === 'INSTRUCTOR' || userRole === 'ADMIN') {
      if (userRole === 'ADMIN') {
        hasAccess = true;
        console.log('Admin access granted to lesson');
      } else {
        // Check if instructor teaches this course
        const course = await prisma.course.findUnique({
          where: {
            id: courseId,
            instructorId: parseInt(userId.toString(), 10)
          }
        });
        
        if (course) {
          hasAccess = true;
          console.log('Instructor access granted - owns course');
        }
      }
    }
    
    // If not an instructor/admin with access, check enrollment
    if (!hasAccess) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: parseInt(userId),
          courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
      });
      
      if (enrollment) {
        hasAccess = true;
        console.log('Student access granted - enrolled in course');
      }
    }
    
    if (!hasAccess) {
      console.log('Access denied - user not enrolled and not authorized');
      return NextResponse.json(
        { error: 'You must be enrolled in this course to view lesson content' },
        { status: 403 }
      );
    }

    // Fetch the lesson with its details
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        moduleId: {
          not: null,
        },
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            order: true, // Using order instead of position
            courseId: true, // Include courseId for validation
          },
        },
        progress: {
          where: {
            userId: parseInt(userId),
          },
          select: {
            completed: true,
            completedAt: true,
          },
        },
      },
    });
    
    // Verify the lesson belongs to the requested course
    if (lesson && lesson.module?.courseId !== courseId) {
      console.log('Lesson does not belong to requested course');
      return NextResponse.json(
        { error: 'Lesson not found in this course' },
        { status: 404 }
      );
    }

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Transform the data to include progress information
    const transformedLesson = {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration ? `${Math.floor(lesson.duration / 60)}m ${Math.floor(lesson.duration % 60)}s` : '0m 0s',
      completed: lesson.progress?.[0]?.completed || false,
      order: lesson.order,
      moduleId: lesson.moduleId || '',
    };

    return NextResponse.json(transformedLesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson details' },
      { status: 500 }
    );
  }
}
