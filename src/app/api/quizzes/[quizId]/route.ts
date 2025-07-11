import { NextRequest, NextResponse } from 'next/server';
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

// Question update/create schema
const questionSchema = z.object({
  id: z.string().uuid('Invalid question ID').optional(),
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY']),
  points: z.number().int().min(1).default(1),
  order: z.number().int().min(0).optional(),
  options: z.array(z.object({
    id: z.string().uuid('Invalid option ID').optional(),
    text: z.string().min(1, 'Option text is required'),
    isCorrect: z.boolean(),
    order: z.number().int().min(0).optional(),
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

// GET handler - Get a specific quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { quizId } = params;
    const { searchParams } = new URL(request.url);
    const includeQuestions = searchParams.get('includeQuestions') !== 'false'; // Default to true
    
    // Get quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: includeQuestions ? {
          include: { options: true },
          orderBy: { order: 'asc' } as any,
        } : false,
      },
    });
    
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    return NextResponse.json({ quiz });
  } catch (error: any) {
    console.error(`Error getting quiz ${params.quizId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

// PATCH handler - Update a quiz
export async function PATCH(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    const { quizId } = params;
    
    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { module: true },
    });
    
    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = updateQuizSchema.safeParse(body);
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
      timeLimit, 
      passingScore, 
      attemptsAllowed, 
      randomizeQuestions, 
      showCorrectAnswers,
      isPublished,
    } = validationResult.data;
    
    // Update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (passingScore !== undefined) updateData.passingScore = passingScore;
    if (attemptsAllowed !== undefined) updateData.attemptsAllowed = attemptsAllowed;
    if (randomizeQuestions !== undefined) updateData.randomizeQuestions = randomizeQuestions;
    if (showCorrectAnswers !== undefined) updateData.showCorrectAnswers = showCorrectAnswers;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    
    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
    });
    
    // Log activity
    await logQuizActivity(userId.toString(), 'update_quiz', quizId, updateData);
    
    // Revalidate cache
    if (existingQuiz.module?.courseId) {
      revalidatePath(`/courses/${existingQuiz.module.courseId}/modules/${existingQuiz.moduleId}`);
    }
    
    return NextResponse.json({ quiz: updatedQuiz });
  } catch (error: any) {
    console.error(`Error updating quiz ${params.quizId}:`, error);
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}

// DELETE handler - Delete a quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    const { quizId } = params;
    
    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { module: true },
    });
    
    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    // Delete quiz (and cascade delete questions and options)
    await prisma.quiz.delete({
      where: { id: quizId },
    });
    
    // Log activity
    await logQuizActivity(userId.toString(), 'delete_quiz', quizId, { title: existingQuiz.title });
    
    // Revalidate cache
    if (existingQuiz.module?.courseId) {
      revalidatePath(`/courses/${existingQuiz.module.courseId}/modules/${existingQuiz.moduleId}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting quiz ${params.quizId}:`, error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}
