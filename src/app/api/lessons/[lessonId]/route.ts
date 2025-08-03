import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/lessons/[lessonId]
// Get a specific lesson by ID
type RouteParams = {
  lessonId: string;
};

type RouteHandler = (
  request: Request,
  context: { params: Promise<RouteParams> }
) => Promise<NextResponse>;

export const GET: RouteHandler = async (_, { params }) => {
  const { lessonId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the lesson
    const lesson = await prisma.lesson.findUnique({
      where: { 
        id: lessonId,
        isPublished: true, // Only fetch published lessons
      },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        duration: true,
        order: true,
        isPublished: true,
        isPreview: true,
        // content field removed - not available in Lesson model
        createdAt: true,
        updatedAt: true,
        module: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
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

    // Track view (if needed)
    try {
      await prisma.lessonView.upsert({
        where: { 
          lessonId_userId: {
            lessonId: lesson.id,
            userId: session.user.id,
          },
        },
        update: { viewCount: { increment: 1 } },
        create: { 
          lessonId: lesson.id,
          userId: session.user.id,
          viewCount: 1,
        },
      });
    } catch (error) {
      console.error('Failed to track lesson view:', error);
      // Non-blocking error
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}
