import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[courseId]/modules/[moduleId]/lessons - Get all lessons for a module
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to view lessons' },
        { status: 401 }
      );
    }
    
    // Verify the module exists and belongs to the course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId: courseId
      },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
            isPublished: true
          }
        }
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (instructor or enrolled student)
    const isInstructor = module.course.instructorId === userId;
    let hasAccess = isInstructor;
    
    if (!isInstructor) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId
        }
      });
      hasAccess = !!enrollment && module.course.isPublished;
    }
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Get lessons for this module
    const lessons = await prisma.lesson.findMany({
      where: {
        moduleId: moduleId
      },
      orderBy: {
        order: 'asc'
      },
      include: {
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
    
    // Format lessons data
    const formattedLessons = lessons.map((lesson, index) => {
      const progress = lesson.progress[0];
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration || 0,
        order: lesson.order,
        isPublished: true, // TODO: Add isPublished field to Lesson model
        isPreview: false, // TODO: Add isPreview field to Lesson model
        completionStatus: progress?.completed ? 'COMPLETED' : 'NOT_STARTED',
        videoUrl: lesson.videoUrl,
        nextLesson: index < lessons.length - 1 ? lessons[index + 1].id : null,
        previousLesson: index > 0 ? lessons[index - 1].id : null
      };
    });
    
    return NextResponse.json({
      success: true,
      data: formattedLessons,
      module: {
        id: module.id,
        title: module.title,
        isPublished: true, // TODO: Add isPublished field to Module model
        courseId: module.courseId
      },
      canEdit: isInstructor
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch lessons',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/lessons - Create a new lesson
export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    const body = await request.json();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to create lessons' },
        { status: 401 }
      );
    }
    
    // Verify the module exists and user is the instructor
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId: courseId,
        course: {
          instructorId: userId
        }
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get the highest order number for lessons in this module
    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    
    const newOrder = (lastLesson?.order || 0) + 1;
    
    // Create the lesson
    const lesson = await prisma.lesson.create({
      data: {
        title: body.title || 'New Lesson',
        description: body.description || '',
        moduleId: moduleId,
        order: newOrder,
        duration: body.duration || 0,
        videoUrl: body.videoUrl || null
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Lesson created successfully',
      data: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        order: lesson.order,
        videoUrl: lesson.videoUrl,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
