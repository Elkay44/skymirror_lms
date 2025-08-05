import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const lessonProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: params.lessonId
        }
      },
      select: {
        completed: true,
        completedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: lessonProgress || {
        completed: false,
        completedAt: null
      }
    });
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson progress' },
      { status: 500 }
    );
  }
}

export async function POST(
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the user is enrolled in the course
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        module: {
          include: {
            course: true
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

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: lesson.module.courseId,
        status: 'ACTIVE'
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Check if lesson is already completed
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: params.lessonId
        }
      }
    });

    if (existingProgress?.completed) {
      return NextResponse.json(
        { error: 'Lesson already completed' },
        { status: 400 }
      );
    }

    // Create or update progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: params.lessonId
        }
      },
      update: {
        completed: true,
        completedAt: new Date()
      },
      create: {
        userId: session.user.id,
        lessonId: params.lessonId,
        completed: true,
        completedAt: new Date()
      }
    });

    // Update user points and level
    const points = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        points: {
          increment: 10 // Award points for completing lesson
        }
      }
    });

    // Check if level up is needed
    const levelUp = points.points >= points.level * 100;
    if (levelUp) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          level: {
            increment: 1
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        completed: true,
        completedAt: progress.completedAt
      }
    });
  } catch (error) {
    console.error('Error marking lesson as complete:', error);
    return NextResponse.json(
      { error: 'Failed to mark lesson as complete' },
      { status: 500 }
    );
  }
}
