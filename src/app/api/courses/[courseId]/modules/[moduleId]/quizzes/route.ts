import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a new quiz from the frontend
const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  timeLimit: z.number().int().min(0).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
  allowReview: z.boolean().optional().default(true),
  attemptsAllowed: z.number().int().min(0).optional(),
});

// GET /api/courses/[courseId]/modules/[moduleId]/quizzes - Get all quizzes for a module
export async function GET(
  request: Request,
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

    // Build query selector based on user role
    const query = await request.json();
    const { isPublished = true } = query;

    const selector = isInstructor ? {} : { isPublished };

    // Get quizzes with questions and options
    const quizzes = await prisma.quiz.findMany({
      where: {
        moduleId,
        courseId,
        ...selector
      },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: { 
            questions: true,
            attempts: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // For instructors, return full quiz data
    if (isInstructor) {
      return NextResponse.json({
        data: quizzes,
        total: quizzes.length
      });
    }

    // For students, check enrollment and return limited data
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

    // For students, return limited quiz data without questions
    return NextResponse.json({
      data: quizzes.map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        isPublished: quiz.isPublished,
        allowReview: quiz.allowReview,
        attemptsAllowed: quiz.attemptsAllowed,
        questionCount: quiz._count.questions,
        attemptCount: quiz._count.attempts
      })),
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
  request: Request,
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
      timeLimit,
      passingScore,
      isPublished,
      allowReview,
      attemptsAllowed
    } = validationResult.data;

    try {
      // Create the quiz with only required fields first
      const quiz = await prisma.quiz.create({
        data: {
          title,
          description,
          timeLimit,
          passingScore,
          isPublished,
          allowReview,
          attemptsAllowed,
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
