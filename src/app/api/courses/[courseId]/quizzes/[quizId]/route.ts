import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET endpoint to fetch quiz data for a specific quiz
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; quizId: string }> }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { courseId, quizId } = await params;

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is enrolled in the course or is the instructor
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!enrollment && course?.instructorId !== user.id) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to access quizzes' },
        { status: 403 }
      );
    }

    // Get quiz data
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        description: true,
        timeLimit: true,
        passingScore: true,
        attemptsAllowed: true,
        courseId: true,
        moduleId: true,
        questions: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            points: true,
            position: true,
            explanation: true,
            options: {
              select: {
                id: true,
                optionText: true,
                position: true,
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Get the number of previous attempts by this user
    const attempts = await prisma.quizAttempt.count({
      where: {
        userId: user.id,
        quizId: quizId,
      },
    });

    // Prepare the response data
    const responseData = {
      ...quiz,
      attempts,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz data' },
      { status: 500 }
    );
  }
}
