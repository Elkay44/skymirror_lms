import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for course duplication
const duplicateCourseSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  newTitle: z.string().min(5, 'New title must be at least 5 characters').optional(),
  duplicateEnrollments: z.boolean().default(false),
});

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// POST /api/courses/duplicate - Duplicate an existing course
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to duplicate a course' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if user has admin role or instructor role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const isAdmin = user?.role === 'ADMIN';
    const isInstructor = user?.role === 'INSTRUCTOR' || isAdmin;
    
    // Only instructors or admins can duplicate courses
    if (!isInstructor) {
      return NextResponse.json(
        { error: 'You do not have permission to duplicate courses' },
        { status: 403 }
      );
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const { courseId, newTitle, duplicateEnrollments } = duplicateCourseSchema.parse(body);
    
    // Get the original course with all its modules and lessons
    const originalCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true,
            quizzes: {
              include: {
                questions: {
                  include: {
                    options: true
                  }
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        instructorId: true,
        requirements: true,
        learningOutcomes: true,
        targetAudience: true,
        difficulty: true,
        price: true,
        language: true,
        shortDescription: true,
        image: true,
        modules: {
          include: {
            lessons: true,
            quizzes: {
              include: {
                questions: {
                  include: {
                    options: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!originalCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if user is admin or the owner of the course
    if (!isAdmin && originalCourse.instructorId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to duplicate this course' },
        { status: 403 }
      );
    }
    
    // Prepare the new course title with a "Copy of" prefix if not specified
    const duplicateTitle = newTitle || `Copy of ${originalCourse.title}`;
    
    // Create a new course as a duplicate
    const newCourse = await prisma.course.create({
      data: {
        title: duplicateTitle,
        description: originalCourse.description || '',
        slug: `${originalCourse.slug}-copy-${Date.now()}`,
        instructorId: userId, // Set the current user as instructor
        requirements: originalCourse.requirements,
        learningOutcomes: originalCourse.learningOutcomes,
        targetAudience: originalCourse.targetAudience,
        difficulty: originalCourse.difficulty,
        isPublished: false, // Always start as unpublished
        price: originalCourse.price,
        status: 'DRAFT', // Always start as draft
        language: originalCourse.language,
        shortDescription: originalCourse.shortDescription,
        isPrivate: originalCourse.isPrivate,
        // Don't copy enrollments by default
      }
    });
    
    // Duplicate modules
    for (const module of originalCourse.modules) {
      const newModule = await prisma.module.create({
        data: {
          title: module.title,
          description: module.description,
          position: module.position,
          courseId: newCourse.id,
        }
      });
      
      // Duplicate lessons for each module
      for (const lesson of module.lessons) {
        await prisma.lesson.create({
          data: {
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            position: lesson.position,
            moduleId: newModule.id,
          }
        });
      }
      
      // Duplicate quizzes for each module
      for (const quiz of module.quizzes || []) {
        const newQuiz = await prisma.quiz.create({
          data: {
            title: quiz.title,
            description: quiz.description,
            timeLimit: quiz.timeLimit,
            moduleId: newModule.id,
            courseId: newCourse.id,
          }
        });
        
        // Duplicate questions for each quiz
        for (const question of quiz.questions || []) {
          const newQuestion = await prisma.question.create({
            data: {
              questionText: question.questionText,
              questionType: question.questionType,
              points: question.points,
              position: question.position,
              quizId: newQuiz.id,
            }
          });
          
          // Duplicate options for each question
          for (const option of question.options || []) {
            await prisma.questionOption.create({
              data: {
                optionText: option.optionText,
                position: option.position,
                questionId: newQuestion.id,
                isCorrect: option.isCorrect,
              }
            });
          }
        }
      }
    }
    
    // Optionally duplicate enrollments if requested and user is admin
    if (duplicateEnrollments && isAdmin) {
      // Get all enrollments from the original course
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: originalCourse.id }
      });
      
      // Create new enrollments for the duplicated course
      for (const enrollment of enrollments) {
        await prisma.enrollment.create({
          data: {
            userId: enrollment.userId,
            courseId: newCourse.id,
            status: enrollment.status,
            enrolledAt: new Date(),
            // Don't copy completion status or date
          }
        });
      }
    }
    
    return NextResponse.json({
      message: 'Course duplicated successfully',
      course: {
        id: newCourse.id,
        title: newCourse.title,
      }
    });
  } catch (error) {
    console.error('[COURSE_DUPLICATION_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to duplicate course' },
      { status: 500 }
    );
  }
}
