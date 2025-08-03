import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId] - Get a specific lesson
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { courseId, moduleId, lessonId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to view lessons' },
        { status: 401 }
      );
    }
    
    // Get the lesson with module and course info
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId: moduleId,
        module: {
          courseId: courseId
        }
      },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                instructorId: true,
                isPublished: true
              }
            }
          }
        },
        progress: {
          where: {
            userId: userId
          },
          select: {
            completed: true,
            completedAt: true
          }
        }
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (instructor or enrolled student)
    const isInstructor = lesson.module.course.instructorId === userId;
    let hasAccess = isInstructor;
    
    if (!isInstructor) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId
        }
      });
      hasAccess = !!enrollment && lesson.module.course.isPublished;
    }
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Get next and previous lessons
    const allLessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true }
    });
    
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;
    const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
    
    const progress = lesson.progress[0];
    
    return NextResponse.json({
      success: true,
      data: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: '', // TODO: Add content field to Lesson model
        videoUrl: lesson.videoUrl,
        duration: lesson.duration || 0,
        order: lesson.order,
        isPublished: true, // TODO: Add isPublished field to Lesson model
        isPreview: false, // TODO: Add isPreview field to Lesson model
        resources: [], // TODO: Add resources relation to Lesson model
        quizId: null, // TODO: Add quizId field to Lesson model
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
        module: {
          id: lesson.module.id,
          title: lesson.module.title,
          isPublished: true, // TODO: Add isPublished field to Module model
          courseId: lesson.module.courseId
        },
        completionStatus: progress?.completed ? 'COMPLETED' : 'NOT_STARTED',
        nextLesson,
        previousLesson,
        canEdit: isInstructor
      }
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId] - Update a lesson
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { courseId, moduleId, lessonId } = await params;
    const body = await request.json();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to update lessons' },
        { status: 401 }
      );
    }
    
    // Verify the lesson exists and user is the instructor
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId: moduleId,
        module: {
          courseId: courseId,
          course: {
            instructorId: userId
          }
        }
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found or access denied' },
        { status: 404 }
      );
    }
    
    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.order !== undefined && { order: body.order })
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Lesson updated successfully',
      data: {
        id: updatedLesson.id,
        title: updatedLesson.title,
        description: updatedLesson.description,
        duration: updatedLesson.duration,
        videoUrl: updatedLesson.videoUrl,
        order: updatedLesson.order,
        updatedAt: updatedLesson.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId] - Delete a lesson
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { courseId, moduleId, lessonId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to delete lessons' },
        { status: 401 }
      );
    }
    
    // Verify the lesson exists and user is the instructor
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId: moduleId,
        module: {
          courseId: courseId,
          course: {
            instructorId: userId
          }
        }
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found or access denied' },
        { status: 404 }
      );
    }
    
    // Delete the lesson (this will cascade delete progress records)
    await prisma.lesson.delete({
      where: { id: lessonId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
