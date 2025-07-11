import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { PrismaClient } from '@prisma/client';

// Schema for creating a new quiz
const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  timeLimit: z.number().int().min(0).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  attemptsAllowed: z.number().int().min(1).optional(),
  questions: z.array(
    z.object({
      text: z.string().min(1, "Question text is required"),
      type: z.enum(['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
      points: z.number().int().min(0).default(1),
      explanation: z.string().optional(),
      options: z.array(
        z.object({
          text: z.string().min(1, "Option text is required"),
          isCorrect: z.boolean(),
          explanation: z.string().optional(),
        })
      ).min(1, "At least one option is required"),
    })
  ).min(1, "At least one question is required"),
});

// Log quiz activity
const logQuizActivity = async (userId: string | number, action: string, quizId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId.toString(),
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
};

// GET /api/courses/[courseId]/modules/[moduleId]/quizzes - Get all quizzes for a module
export async function GET(
  request: NextRequest,
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

    const isInstructor = course?.instructorId === parseInt(userId.toString(), 10);

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: parseInt(userId.toString(), 10), 
          courseId, 
          status: { in: ['ACTIVE', 'COMPLETED'] } 
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to view quizzes' },
          { status: 403 }
        );
      }
    }

    // Get quizzes for this module
    const quizzes = await prisma.quiz.findMany({
      where: { moduleId },
      include: {
        _count: {
          select: { 
            questions: true,
            attempts: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // For students, don't show quiz questions
    const quizzesWithoutQuestions = quizzes.map(quiz => ({
      ...quiz,
      questions: isInstructor ? undefined : [],
    }));

    return NextResponse.json({
      data: quizzesWithoutQuestions,
      total: quizzes.length
    });
  } catch (error) {
    console.error('[QUIZZES_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/quizzes - Create a new quiz
export async function POST(
  request: NextRequest,
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
        instructorId: parseInt(userId.toString(), 10)
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to create quizzes' },
        { status: 403 }
      );
    }

    // Verify module exists and belongs to this course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found or does not belong to this course' },
        { status: 404 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = createQuizSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { 
      title, 
      description, 
      instructions, 
      timeLimit,
      passingScore,
      isPublished = false,
      allowReview = true,
      attemptsAllowed = 1,
      questions
    } = validationResult.data;

    // Use a transaction to create quiz and questions
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // Create quiz
      const quiz = await tx.quiz.create({
        data: {
          title,
          description: description || null,
          instructions: instructions || null,
          timeLimit: timeLimit || null,
          passingScore: passingScore || null,
          isPublished,
          allowReview,
          attemptsAllowed,
          module: { connect: { id: moduleId } },
        }
      });

      // Create questions and options
      for (const question of questions) {
        const newQuestion = await tx.question.create({
          data: {
            text: question.text,
            type: question.type,
            points: question.points,
            explanation: question.explanation || null,
            quiz: { connect: { id: quiz.id } },
          }
        });

        // Create options for this question
        await tx.questionOption.createMany({
          data: question.options.map(option => ({
            questionId: newQuestion.id,
            text: option.text,
            isCorrect: option.isCorrect,
            explanation: option.explanation || null,
          }))
        });
      }

      return await tx.quiz.findUnique({
        where: { id: quiz.id },
        include: {
          questions: {
            include: {
              options: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
    });

    // Ensure quiz was properly created
    if (!result || typeof result !== 'object') {
      throw new Error('Transaction did not return a valid quiz object');
    }

    // Log activity
    await logQuizActivity(userId.toString(), 'create_quiz', result.id, { title });

    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);

    return NextResponse.json({
      data: result
    });
  } catch (error: any) {
    console.error('[QUIZ_CREATE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quiz' },
      { status: 500 }
    );
  }
}
