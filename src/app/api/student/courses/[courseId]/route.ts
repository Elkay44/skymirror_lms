import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/student/courses/[courseId] - Get course details for enrolled student
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is enrolled in this course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE'
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // Fetch course with modules and lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                progress: {
                  where: { userId },
                  select: { completed: true, progress: true }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Calculate progress
    let totalLessons = 0;
    let completedLessons = 0;

    const transformedModules = (course as any).modules?.map((module: any, index: number) => {
      const moduleLessons = module.lessons?.map((lesson: any) => {
        totalLessons++;
        const isCompleted = lesson.progress?.length > 0 && lesson.progress[0].completed;
        if (isCompleted) completedLessons++;

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          duration: lesson.duration || 0,
          order: lesson.order,
          completed: isCompleted,
          videoUrl: lesson.videoUrl,
          type: 'video' as const
        };
      }) || [];

      const moduleProgress = moduleLessons.length > 0 
        ? (moduleLessons.filter((l: any) => l.completed).length / moduleLessons.length) * 100 
        : 0;

      return {
        id: module.id,
        title: module.title,
        description: module.description || '',
        order: module.order,
        lessons: moduleLessons,
        isLocked: index > 0 && moduleProgress === 0,
        progress: moduleProgress
      };
    }) || [];

    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const response = {
      id: course.id,
      title: course.title,
      description: course.description || '',
      imageUrl: course.image,
      instructor: {
        id: (course as any).instructor?.id || '',
        name: (course as any).instructor?.name || 'Unknown Instructor',
        image: (course as any).instructor?.image
      },
      modules: transformedModules,
      progress: overallProgress,
      totalLessons,
      completedLessons,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      status: enrollment.status
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[STUDENT_COURSE_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch course data' },
      { status: 500 }
    );
  }
}
