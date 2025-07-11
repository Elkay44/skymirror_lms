import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, CommonErrors } from '@/lib/api-response';
import { logCourseActivity } from '@/lib/activity-log';
import { cache } from '@/lib/cache';
import { requireCourseOwnerOrAdmin } from '@/middleware/auth-middleware';
import { z } from 'zod';

// Schema for course duplication options
const courseDuplicationSchema = z.object({
  title: z.string().min(3).optional(),
  duplicateModules: z.boolean().default(true),
  duplicateLessons: z.boolean().default(true),
  duplicateQuizzes: z.boolean().default(true),
  duplicateContent: z.boolean().default(true),
  setAsDraft: z.boolean().default(true),
});

// Dynamic route to ensure data is not cached
export const dynamic = 'force-dynamic';

// POST /api/courses/[courseId]/duplicate - Duplicate a course
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  return withErrorHandling(async () => {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }
    
    const userId = Number(session.user.id);
    
    // Check authorization using middleware
    const authError = await requireCourseOwnerOrAdmin(req, courseId);
    if (authError) return authError;
    
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        instructorId: true,
        description: true,
        shortDescription: true,
        imageUrl: true,
        price: true,
        isPublished: true,
        category: true,
        language: true,
        level: true,
        difficulty: true,
        requirements: true,
        learningOutcomes: true,
        targetAudience: true,
      }
    });
    
    if (!course) {
      return CommonErrors.notFound('Course not found');
    }
    
    // Parse request body for duplication options
    const body = await req.json();
    const {
      title,
      duplicateModules,
      duplicateLessons,
      duplicateQuizzes,
      duplicateContent,
      setAsDraft
    } = courseDuplicationSchema.parse(body);
    
    // Begin the duplication process within a transaction
    const newCourse = await prisma.$transaction(async (tx) => {
      // Create the duplicated course
      const newCourseTitle = title || `${course.title} (Copy)`;
      
      // Create the new course
      const duplicatedCourse = await tx.course.create({
        data: {
          title: newCourseTitle,
          description: course.description,
          shortDescription: course.shortDescription,
          imageUrl: course.imageUrl,
          price: course.price,
          isPublished: setAsDraft ? false : course.isPublished,
          status: setAsDraft ? 'DRAFT' : course.isPublished ? 'PUBLISHED' : 'DRAFT',
          category: course.category,
          language: course.language,
          level: course.level,
          difficulty: course.difficulty,
          requirements: course.requirements,
          learningOutcomes: course.learningOutcomes,
          targetAudience: course.targetAudience,
          instructorId: userId, // Set the current user as the instructor
        }
      });
      
      // If modules should be duplicated
      if (duplicateModules) {
        // Fetch modules from the original course
        const modules = await tx.module.findMany({
          where: { courseId: course.id },
          orderBy: { order: 'asc' },
          include: duplicateLessons || duplicateQuizzes ? {
            lessons: duplicateLessons ? {
              orderBy: { order: 'asc' },
              include: duplicateContent ? {
                content: true
              } : undefined
            } : undefined,
            quizzes: duplicateQuizzes ? {
              orderBy: { order: 'asc' },
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: {
                    options: {
                      orderBy: { position: 'asc' }
                    }
                  }
                }
              }
            } : undefined
          } : undefined
        });
        
        // Duplicate each module
        for (const module of modules) {
          const newModule = await tx.module.create({
            data: {
              courseId: duplicatedCourse.id,
              title: module.title,
              description: module.description,
              position: module.position,
              isPublished: setAsDraft ? false : module.isPublished,
            }
          });
          
          // Duplicate lessons if requested
          if (duplicateLessons && module.lessons) {
            for (const lesson of module.lessons) {
              const newLesson = await tx.lesson.create({
                data: {
                  moduleId: newModule.id,
                  title: lesson.title,
                  description: lesson.description,
                  order: lesson.order,
                  isPublished: setAsDraft ? false : lesson.isPublished,
                  isFree: lesson.isFree
                }
              });
              
              // Duplicate lesson content if requested
              if (duplicateContent && lesson.content) {
                await tx.lessonContent.create({
                  data: {
                    lessonId: newLesson.id,
                    text: lesson.content.text,
                    videoUrl: lesson.content.videoUrl,
                    attachments: lesson.content.attachments,
                    resources: lesson.content.resources
                  }
                });
              }
            }
          }
          
          // Duplicate quizzes if requested
          if (duplicateQuizzes && module.quizzes) {
            for (const quiz of module.quizzes) {
              const newQuiz = await tx.quiz.create({
                data: {
                  moduleId: newModule.id,
                  title: quiz.title,
                  description: quiz.description,
                  order: quiz.order,
                  isPublished: setAsDraft ? false : quiz.isPublished,
                  timeLimit: quiz.timeLimit,
                  passingScore: quiz.passingScore
                }
              });
              
              // Duplicate quiz questions
              if (quiz.questions) {
                for (const question of quiz.questions) {
                  const newQuestion = await tx.quizQuestion.create({
                    data: {
                      quizId: newQuiz.id,
                      text: question.text,
                      type: question.type,
                      order: question.order,
                      points: question.points,
                      explanation: question.explanation
                    }
                  });
                  
                  // Duplicate question options
                  if (question.options) {
                    for (const option of question.options) {
                      await tx.quizQuestionOption.create({
                        data: {
                          questionId: newQuestion.id,
                          text: option.text,
                          isCorrect: option.isCorrect,
                          order: option.order
                        }
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // Activity log is handled outside of the transaction
      
      return duplicatedCourse;
    });
    
    // Log activity using our centralized activity logging service
    await logCourseActivity(
      userId,
      newCourse.id,
      'duplicate',
      {
        originalCourseId: course.id,
        options: {
          duplicateModules,
          duplicateLessons,
          duplicateQuizzes,
          duplicateContent,
          setAsDraft
        }
      }
    );
    
    // Invalidate cache for both courses
    await cache.invalidate('course', courseId);
    await cache.invalidate('course', newCourse.id);
    await cache.invalidate('courses');
    
    // Return the newly created course
    return NextResponse.json({
      message: 'Course duplicated successfully',
      course: {
        id: newCourse.id,
        title: newCourse.title,
        status: newCourse.status,
        isPublished: newCourse.isPublished
      }
    });
  }, 'Error duplicating course')
}
