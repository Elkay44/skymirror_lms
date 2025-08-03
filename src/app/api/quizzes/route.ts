import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Quiz creation validation schema
const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  moduleId: z.string().uuid('Invalid module ID'),
  timeLimit: z.number().int().min(0).optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  attemptsAllowed: z.number().int().min(1).default(1),
  randomizeQuestions: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  questions: z.array(z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY']),
    points: z.number().int().min(1).default(1),
    order: z.number().int().min(0).optional(),
    options: z.array(z.object({
      text: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean().default(false),
      order: z.number().int().min(0).optional(),
    })).optional(),
  })).optional(),
});

// Log quiz activity
const logQuizActivity = async (userId: string | number, action: string, quizId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
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

// GET handler - Get all quizzes or filter by moduleId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const includeQuestions = searchParams.get('includeQuestions') === 'true' ? true : undefined;
    
    // Query parameters
    const where = moduleId ? { moduleId } : {};
    
    // Get quizzes with optional filtering
    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        questions: includeQuestions === true ? {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' } as any,
        } : false,
      },
    });
    
    return NextResponse.json({ quizzes });
  } catch (error: any) {
    console.error('Error getting quizzes:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

// POST handler - Create a new quiz
export async function POST(request: Request) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = createQuizSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { 
      title, 
      description, 
      moduleId, 
      timeLimit, 
      passingScore, 
      attemptsAllowed, 
      showCorrectAnswers,
      isPublished,
      questions 
    } = validationResult.data;
    
    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    // Create quiz with questions and options in a transaction
    const quiz = await prisma.$transaction(async (tx) => {
      // Create the quiz
      const newQuiz = await tx.quiz.create({
        data: {
          title,
          description: description || '',
          moduleId,
          timeLimit,
          passingScore: passingScore ?? 70,
          attemptsAllowed: attemptsAllowed ?? 1,
          showCorrectAnswers: showCorrectAnswers ?? true,
          isPublished: isPublished ?? false,
        },
      });
      
      // Create questions and options if provided
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          
          const newQuestion = await tx.question.create({
            data: {
              quizId: newQuiz.id,
              text: question.text,
              type: question.type,
              points: question.points,
              order: question.order ?? i,
            },
          });
          
          // Create options for this question if provided
          if (question.options && question.options.length > 0) {
            for (let j = 0; j < question.options.length; j++) {
              const option = question.options[j];
              await tx.questionOption.create({
                data: {
                  questionId: newQuestion.id,
                  text: option.text,
                  isCorrect: option.isCorrect,
                  order: option.order ?? j,
                },
              });
            }
          }
        }
      }
      
      return newQuiz;
    });
    
    // Log activity
    // Ensure quiz is properly returned from the transaction
    if (!quiz || typeof quiz !== 'object') {
      throw new Error('Transaction did not return a valid quiz object');
    }
    
    await logQuizActivity(userId.toString(), 'create_quiz', quiz.id, { title });
    
    // Revalidate cache
    revalidatePath(`/courses/${module.courseId}/modules/${moduleId}`);
    
    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
