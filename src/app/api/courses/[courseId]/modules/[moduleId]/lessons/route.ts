import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new lesson
const createLessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
});

// GET /api/courses/[courseId]/modules/[moduleId]/lessons - Get all lessons for a module
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is instructor or enrolled in the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    const isInstructor = course?.instructorId === Number(userId);

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: Number(userId), 
          courseId, 
          status: { in: ['ACTIVE', 'COMPLETED'] } 
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to view lessons' },
          { status: 403 }
        );
      }
    }

    // Fetch lessons
    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        duration: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        // Don't include full content for list view
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('[LESSONS_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/lessons - Create a new lesson
export async function POST(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user is an instructor for this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: Number(userId),
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You do not have permission to create lessons for this course' },
        { status: 403 }
      );
    }

    // Ensure module belongs to the course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId,
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found in this course' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validationResult = createLessonSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Get the highest lesson order in this module to set the new lesson's order
    const highestOrderLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = highestOrderLesson ? highestOrderLesson.order + 1 : 1;

    // Create the new lesson
    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        description: body.description || "",
        content: body.content || "",
        videoUrl: body.videoUrl || null,
        duration: body.duration || 0,
        order: body.order !== undefined ? body.order : nextOrder,
        moduleId,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('[LESSONS_POST]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
