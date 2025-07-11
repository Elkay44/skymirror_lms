import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for updating a lesson
const updateLessonSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
});

// GET /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId] - Get a specific lesson
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; lessonId: string } }
) {
  try {
    const { courseId, moduleId, lessonId } = params;
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
          { error: 'You must be enrolled in this course to view this lesson' },
          { status: 403 }
        );
      }
    }

    // Fetch the lesson
    const lesson = await prisma.lesson.findFirst({
      where: { 
        id: lessonId,
        moduleId
      },
      include: {
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            type: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // For instructors, return all data
    if (isInstructor) {
      return NextResponse.json(lesson);
    }
    
    // For enrolled students, update their progress
    await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: Number(userId),
          lessonId
        }
      },
      update: {},
      create: {
        userId: Number(userId),
        lessonId,
        completed: false
      }
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('[LESSON_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId] - Update a lesson
export async function PATCH(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; lessonId: string } }
) {
  try {
    const { courseId, moduleId, lessonId } = params;
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
        { error: 'You do not have permission to update lessons for this course' },
        { status: 403 }
      );
    }

    // Ensure lesson exists in this module and course
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId,
        module: {
          courseId
        }
      },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validationResult = updateLessonSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        content: body.content !== undefined ? body.content : undefined,
        videoUrl: body.videoUrl !== undefined ? body.videoUrl : undefined,
        duration: body.duration !== undefined ? body.duration : undefined,
        order: body.order !== undefined ? body.order : undefined,
      },
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('[LESSON_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId] - Delete a lesson
export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; lessonId: string } }
) {
  try {
    const { courseId, moduleId, lessonId } = params;
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
        { error: 'You do not have permission to delete lessons for this course' },
        { status: 403 }
      );
    }

    // Ensure lesson exists in this module and course
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId,
        module: {
          courseId
        }
      },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Delete the lesson
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    // Reorder remaining lessons
    const remainingLessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });

    // Update order for remaining lessons
    for (let i = 0; i < remainingLessons.length; i++) {
      await prisma.lesson.update({
        where: { id: remainingLessons[i].id },
        data: { order: i + 1 },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[LESSON_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
