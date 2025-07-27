import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for updating a quiz
const updateQuizSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  type: z.enum(["STANDARD", "PRACTICE", "ASSESSMENT"]).optional(),
  timeLimit: z.number().int().min(0).optional(), // in minutes
  passingScore: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  attemptsAllowed: z.number().int().min(0).optional(),
  questions: z.array(
    z.object({
      id: z.string().optional(), // If updating existing question
      text: z.string().min(1, "Question text is required"),
      type: z.enum(["MULTIPLE_CHOICE", "SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
      points: z.number().int().min(0).default(1),
      explanation: z.string().optional().nullable(),
      position: z.number().int().min(0).default(0),
      options: z.array(
        z.object({
          id: z.string().optional(), // If updating existing option
          optionText: z.string().min(1, "Option text is required"),
          isCorrect: z.boolean(),
          explanation: z.string().optional().nullable(),
          position: z.number().int().min(0).default(0)
        })
      ).min(1, "At least one option is required"),
    })
  ).optional(),
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

// GET /api/courses/[courseId]/modules/[moduleId]/quizzes/[quizId] - Get quiz details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string; quizId: string }> }
): Promise<Response> {
  const { courseId, moduleId, quizId } = await params;
  try {

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

    // Fetch quiz with different data based on user role
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: isInstructor ? {
          include: {
            options: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        } : isPublishedQuizSelector(),
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // For students, check if they've already taken the quiz and include their attempts
    let studentData = null;
    if (!isInstructor) {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          quizId,
          userId: parseInt(userId.toString(), 10)
        },
        orderBy: {
          startedAt: 'desc'
        },
        select: {
          id: true,
          score: true,
          isPassed: true,
          startedAt: true,
          completedAt: true
        }
      });

      studentData = {
        attempts,
        hasAttemptsLeft: quiz.attemptsAllowed === null || attempts.length < quiz.attemptsAllowed,
        bestScore: attempts.length > 0 ? Math.max(...attempts.map((a: { score?: number | null }) => a.score || 0)) : null
      };
    }

    return NextResponse.json({
      data: {
        ...quiz,
        studentData
      }
    });
  } catch (error) {
    console.error('[QUIZ_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

// Helper function to only return published quizzes for students with limited question data
function isPublishedQuizSelector() {
  return {
    where: {
      quiz: {
        isPublished: true
      }
    },
    // For students, don't include correct answers in questions
    select: {
      id: true,
      text: true,
      type: true,
      points: true,
      options: {
        select: {
          id: true,
          text: true
          // Notice we don't include isCorrect here for students
        }
      }
    }
  };
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/quizzes/[quizId] - Update a quiz
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string; quizId: string }> }
): Promise<Response> {
  const { courseId, moduleId, quizId } = await params;
  try {

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
        { error: 'You must be the instructor of this course to update quizzes' },
        { status: 403 }
      );
    }

    // Verify quiz exists and belongs to this module
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        moduleId
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found or does not belong to this module' },
        { status: 404 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = updateQuizSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { 
      title, 
      timeLimit,
      passingScore,
      isPublished,
      allowReview,
      attemptsAllowed,
      questions
    } = validationResult.data;

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (passingScore !== undefined) updateData.passingScore = passingScore;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (allowReview !== undefined) updateData.allowReview = allowReview;
    if (attemptsAllowed !== undefined) updateData.attemptsAllowed = attemptsAllowed;

    // Update quiz in a transaction to handle questions and options
    const updatedQuiz = await prisma.$transaction(async (tx: any) => {
      // Update the quiz
      const updated = await tx.quiz.update({
        where: { id: quizId },
        data: updateData
      });

      // Handle questions if provided
      if (questions && questions.length > 0) {
        // Delete existing questions and options
        // This cascades to delete options too based on Prisma schema
        await tx.question.deleteMany({
          where: { quizId }
        });

        // Create new questions and options
        for (const question of questions.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))) {
          const newQuestion = await tx.question.create({
            data: {
              text: question.text,
              type: question.type,
              points: question.points,
              explanation: question.explanation,
              quizId,
              position: question.position || 0
            }
          });

          // Create options for this question
          await tx.questionOption.createMany({
            data: question.options.map(option => ({
              questionId: newQuestion.id,
              optionText: option.optionText,
              isCorrect: option.isCorrect,
              explanation: option.explanation || null,
              position: option.position
            }))
          });
        }
      }

      return await tx.quiz.findUnique({
        where: { id: quizId },
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

    // Log activity
    await logQuizActivity(userId.toString(), 'update_quiz', quizId, updateData);

    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}/quizzes/${quizId}`);

    return NextResponse.json({ data: updatedQuiz });
  } catch (error: any) {
    console.error('[QUIZ_UPDATE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/quizzes/[quizId] - Delete a quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string; quizId: string }> }
): Promise<Response> {
  const { courseId, moduleId, quizId } = await params;
  try {

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
        { error: 'You must be the instructor of this course to delete quizzes' },
        { status: 403 }
      );
    }

    // Verify quiz exists and belongs to this module
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        moduleId
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found or does not belong to this module' },
        { status: 404 }
      );
    }

    // Delete quiz and related items in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Delete attempts
      await tx.quizAttempt.deleteMany({
        where: { quizId }
      });

      // Delete questions and options (will cascade delete options)
      await tx.question.deleteMany({
        where: { quizId }
      });

      // Delete the quiz
      await tx.quiz.delete({
        where: { id: quizId }
      });
    });

    // Log activity
    await logQuizActivity(userId.toString(), 'delete_quiz', quizId, { title: quiz.title });

    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[QUIZ_DELETE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}
