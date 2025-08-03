/* eslint-disable */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Quiz update validation schema
const updateQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  timeLimit: z.number().int().min(0).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  attemptsAllowed: z.number().int().min(1).optional(),
  randomizeQuestions: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

/**
 * Log quiz activity
 */
async function logQuizActivity(
  userId: string | number, 
  action: string, 
  quizId: string, 
  details: any = {}
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: String(userId),
        action,
        entityType: 'quiz',
        entityId: quizId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log quiz activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
}

// GET handler - Get a specific quiz
export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { quizId } = await params;
    const searchParams = new URL(request.url).searchParams;
    const includeQuestions = searchParams.get('includeQuestions') === 'true';
    
    // Get the quiz with optional questions
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: quizId,
        isPublished: true, // Only fetch published quizzes via API
      },
      include: {
        questions: includeQuestions ? {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { id: 'asc' },
            },
          },
        } : false,
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course or is the instructor
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: quiz.courseId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        role: true,
      },
    });

    const isInstructor = enrollment?.role === 'INSTRUCTOR' || quiz.course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    const isEnrolled = !!enrollment;

    if (!isInstructor && !isAdmin && !isEnrolled) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // For students, don't include correct answers unless the quiz is configured to show them
    if (!isInstructor && !isAdmin && !quiz.showCorrectAnswers) {
      if (quiz.questions) {
        quiz.questions = quiz.questions.map((question: any) => ({
          ...question,
          options: question.options.map((option: any) => ({
            id: option.id,
            text: option.text,
            explanation: option.explanation,
            // Don't include isCorrect for students unless the quiz is configured to show answers
            isCorrect: undefined,
          })),
        }));
      }
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

// PATCH handler - Update a quiz
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { quizId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validation = updateQuizSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if user has permission to update this quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { 
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Only instructors or admins can update quizzes
    const isInstructor = quiz.course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this quiz' },
        { status: 403 }
      );
    }

    // Update the quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...validation.data,
        updatedAt: new Date(),
      },
    });

    // Log the activity
    await logQuizActivity(session.user.id, 'QUIZ_UPDATED', quizId, {
      updatedFields: Object.keys(validation.data),
    });

    // Revalidate the quiz page
    revalidatePath(`/courses/${quiz.courseId}/quizzes/${quizId}`);
    revalidatePath(`/courses/${quiz.courseId}`);

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete a quiz
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { quizId } = await params;
    
    // Check if user has permission to delete this quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { 
        id: true,
        title: true,
        courseId: true,
        course: {
          select: {
            instructorId: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Only instructors or admins can delete quizzes
    const isInstructor = quiz.course.instructorId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this quiz' },
        { status: 403 }
      );
    }

    // Don't allow deleting quizzes with attempts
    if (quiz._count.attempts > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete a quiz that has been attempted. Please archive it instead.',
          code: 'HAS_ATTEMPTS',
        },
        { status: 400 }
      );
    }

    // Delete the quiz
    await prisma.quiz.delete({
      where: { id: quizId },
    });

    // Log the activity
    await logQuizActivity(session.user.id, 'QUIZ_DELETED', quizId, {
      title: quiz.title,
      courseId: quiz.courseId,
    });

    // Revalidate the course page
    revalidatePath(`/courses/${quiz.courseId}`);
    revalidatePath(`/dashboard/quizzes`);

    return NextResponse.json(
      { success: true, message: 'Quiz deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}
