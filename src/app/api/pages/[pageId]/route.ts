/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable caching for this route
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Log page activity
const logPageActivity = async (userId: string | number, action: string, pageId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: 'page',
        entityId: pageId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log page activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET handler - Get a specific lesson page
type RouteParams = {
  pageId: string;
};

type RouteHandler = (
  request: NextRequest,
  context: { params: RouteParams }
) => Promise<Response | NextResponse>;

const GET: RouteHandler = async (request, { params }) => {
  try {
    const { pageId } = params;
    const searchParams = request.nextUrl.searchParams;
    const includeContent = searchParams.get('includeContent') === 'true';
    const session = await getServerSession(authOptions);
    
    // Get the lesson with optional content
    const lesson = await prisma.lesson.findUnique({
      where: { 
        id: pageId,
        isPublished: true, // Only fetch published lessons
      },
      include: {
        _count: {
          select: {
            views: true,
            likes: true,
          },
        },
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

    // Track view if user is authenticated
    if (session?.user?.id) {
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
    }

    // Return the lesson data
    const responseData = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration,
      order: lesson.order,
      isPreview: lesson.isPreview,
      content: includeContent ? lesson.content : undefined,
      module: lesson.module,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      _count: {
        views: lesson._count?.views || 0,
        likes: lesson._count?.likes || 0
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

// PATCH handler - Update a lesson
const PATCH: RouteHandler = async (request, { params }) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { pageId } = params;
    const body = await request.json();

    // Validate request body
    const schema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      videoUrl: z.string().url().optional().or(z.literal('')),
      duration: z.number().int().positive().optional(),
      content: z.string().optional(),
      isPublished: z.boolean().optional(),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error },
        { status: 400 }
      );
    }

    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: pageId },
      include: { module: true },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user is the course instructor
    const isInstructor = await prisma.course.findFirst({
      where: {
        id: existingLesson.module.courseId,
        instructorId: session.user.id,
      },
    });

    if (!isInstructor) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: { id: pageId },
      data: {
        title: body.title,
        description: body.description,
        videoUrl: body.videoUrl,
        duration: body.duration,
        content: body.content,
        isPublished: body.isPublished,
      },
    });

    // Log the update
    await logPageActivity(
      session.user.id,
      'UPDATE_LESSON',
      updatedLesson.id,
      { 
        title: updatedLesson.title,
        isPublished: updatedLesson.isPublished,
      }
    );

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete a lesson
const DELETE: RouteHandler = async (request, { params }) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { pageId } = params;

    // Check if lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: pageId },
      include: { module: true },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user is the course instructor
    const isInstructor = await prisma.course.findFirst({
      where: {
        id: existingLesson.module.courseId,
        instructorId: session.user.id,
      },
    });

    if (!isInstructor) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the lesson
    await prisma.lesson.delete({
      where: { id: pageId },
    });

    // Log the deletion
    await logPageActivity(
      session.user.id,
      'DELETE_LESSON',
      pageId,
      { 
        title: existingLesson.title,
        moduleId: existingLesson.moduleId,
      }
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
