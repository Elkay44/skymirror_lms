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

    // Check if the user is logged in
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to view lesson content' },
        { status: 401 }
      );
    }

    // First check if the user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to view lesson content' },
        { status: 403 }
      );
    }

    // Fetch the lesson with its details
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        module: {
          courseId,
        },
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            position: true,
          },
        },
        progress: {
          where: {
            userId,
          },
          select: {
            completed: true,
            completedAt: true,
          },
        },
      },
    });

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
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration ? `${lesson.duration} min` : 'Unknown',
      position: lesson.position,
      moduleId: lesson.module.id,
      moduleName: lesson.module.title,
      completed: lesson.progress[0]?.completed || false,
      completedAt: lesson.progress[0]?.completedAt,
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
