import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { PrismaClient } from '@prisma/client';

// Schema for creating a new quiz from the frontend
const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  timeLimit: z.number().int().min(0).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  attemptsAllowed: z.number().int().min(1).optional(),
  maxAttempts: z.number().int().min(0).optional(),
  randomizeQuestions: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
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
  ).optional().default([]),
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
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
): Promise<Response> {
  try {
    const { courseId, moduleId } = await params;
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

    const isInstructor = course?.instructorId === userId.toString();

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: userId.toString(), 
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
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
): Promise<Response> {
  try {
    const { courseId, moduleId } = await params;
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

    // Parse request - don't validate strictly yet since we're fixing frontend-backend compatibility
    const body = await request.json();
    console.log('Quiz creation request body:', JSON.stringify(body));
    
    // Extract the basic quiz data from frontend request
    const { 
      title, 
      description, 
      timeLimit,
      passingScore,
      isPublished = false,
      maxAttempts = 3,
      randomizeQuestions = false,
      showCorrectAnswers = true,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    try {
      // Create the quiz with only required fields first
      const quiz = await prisma.quiz.create({
        data: {
          title,
          description,
          timeLimit,
          passingScore,
          isPublished,
          // Use maxAttempts from the frontend as attemptsAllowed
          attemptsAllowed: maxAttempts,
          // Connect relationships
          moduleId,
          courseId,
        }
      });
      
      console.log('Quiz created:', quiz.id);

      // Return the created quiz
      return NextResponse.json({
        success: true,
        data: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description
        },
        message: 'Quiz created successfully'
      });
      
    } catch (dbError: any) {
      console.error('Database error creating quiz:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to create quiz in database',
          details: dbError.message
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('[QUIZ_CREATE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quiz' },
      { status: 500 }
    );
  }
}
