import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/progress - Mark a lesson as complete
export async function POST(request: Request) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to track progress' },
        { status: 401 }
      );
    }
    
    // Get the lesson ID from the request body
    const { lessonId } = await request.json();
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: {
                    userId: session.user.id
                  }
                }
              }
            }
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
    
    // Check if the user is enrolled in the course this lesson belongs to
    if (lesson.module.course.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to track progress' },
        { status: 403 }
      );
    }
    
    // Check if progress already exists for this user and lesson
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId
        }
      }
    });
    
    let progress;
    
    if (existingProgress) {
      // Update existing progress
      progress = await prisma.lessonProgress.update({
        where: {
          id: existingProgress.id
        },
        data: {
          completed: true,
          completedAt: new Date()
        }
      });
    } else {
      // Create new progress record
      progress = await prisma.lessonProgress.create({
        data: {
          user: { connect: { id: session.user.id } },
          lesson: { connect: { id: lessonId } },
          completed: true,
          completedAt: new Date()
        }
      });
      
      // Award points to the user for completing a lesson
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: { increment: 5 } // Add 5 points for completing a lesson
        }
      });
    }
    
    // Check if all lessons in the course are completed
    const courseId = lesson.module.course.id;
    
    // Get all lessons in the course
    const allLessonsInCourse = await prisma.lesson.findMany({
      where: {
        module: {
          courseId: courseId
        }
      },
      select: {
        id: true
      }
    });
    
    // Get all completed lessons for this user and course
    const completedLessons = await prisma.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        completed: true,
        lesson: {
          module: {
            courseId: courseId
          }
        }
      },
      select: {
        lessonId: true
      }
    });
    
    // If all lessons are completed, mark the enrollment as completed
    if (completedLessons.length === allLessonsInCourse.length) {
      await prisma.enrollment.updateMany({
        where: {
          userId: session.user.id,
          courseId: courseId,
          status: 'ACTIVE'
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
      
      // Award bonus points for completing the entire course
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: { increment: 50 } // Add 50 bonus points for course completion
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      progressId: progress.id,
      completed: progress.completed 
    });
  } catch (error) {
    console.error('Error tracking progress:', error);
    return NextResponse.json(
      { error: 'Failed to track progress' },
      { status: 500 }
    );
  }
}
