import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Dynamic route to ensure data is not cached
export const dynamic = 'force-dynamic';

// GET /api/courses/[courseId]/versions/[versionId] - Get specific version details
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; versionId: string } }
) {
  try {
    const { courseId, versionId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Check if user is instructor for this course or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const isInstructor = course.instructorId === userId;
    const isAdmin = user?.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to view this course version' },
        { status: 403 }
      );
    }
    
    // Get the version
    const version = await prisma.courseVersion.findUnique({
      where: {
        id: versionId,
        courseId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }
    
    // Parse the snapshot JSON
    const snapshot = JSON.parse(version.snapshot);
    
    return NextResponse.json({
      id: version.id,
      title: version.title,
      description: version.description,
      isAutosave: version.isAutosave,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
      snapshot
    });
  } catch (error) {
    console.error('[GET_COURSE_VERSION_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch course version' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/versions/[versionId]/restore - Restore a version
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; versionId: string } }
) {
  try {
    const { courseId, versionId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Check if user is instructor for this course or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const isInstructor = course.instructorId === userId;
    const isAdmin = user?.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to restore this course version' },
        { status: 403 }
      );
    }
    
    // Get the version
    const version = await prisma.courseVersion.findUnique({
      where: {
        id: versionId,
        courseId
      }
    });
    
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }
    
    // Parse the snapshot JSON
    const snapshot = JSON.parse(version.snapshot);
    
    // Begin a transaction for restoring the version
    await prisma.$transaction(async (tx) => {
      // 1. First save the current state as a new version for backup
      const currentCourse = await tx.course.findUnique({
        where: { id: courseId },
        select: {
          title: true,
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
      
      if (!currentCourse) {
        throw new Error('Course not found');
      }
      
      // Get all current modules for the course with their lessons and quizzes
      const currentModules = await tx.module.findMany({
        where: { courseId },
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            orderBy: { position: 'asc' },
            include: {
              content: true
            }
          },
          quizzes: {
            orderBy: { position: 'asc' },
            include: {
              questions: {
                orderBy: { position: 'asc' },
                include: {
                  options: {
                    orderBy: { position: 'asc' }
                  }
                }
              }
            }
          }
        }
      });
      
      // Create the backup snapshot data
      const backupSnapshot = {
        courseData: {
          ...currentCourse,
          requirements: currentCourse.requirements ? JSON.parse(currentCourse.requirements as string) : [],
          learningOutcomes: currentCourse.learningOutcomes ? JSON.parse(currentCourse.learningOutcomes as string) : [],
          targetAudience: currentCourse.targetAudience ? JSON.parse(currentCourse.targetAudience as string) : [],
        },
        modules: currentModules.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description,
          position: module.position,
          isPublished: module.isPublished,
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            position: lesson.position,
            isPublished: lesson.isPublished,
            isFree: lesson.isFree,
            content: lesson.content ? {
              text: lesson.content.text,
              videoUrl: lesson.content.videoUrl,
              attachments: lesson.content.attachments ? JSON.parse(lesson.content.attachments) : [],
              resources: lesson.content.resources ? JSON.parse(lesson.content.resources) : [],
            } : null
          })),
          quizzes: module.quizzes.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            position: quiz.position,
            isPublished: quiz.isPublished,
            timeLimit: quiz.timeLimit,
            passingScore: quiz.passingScore,
            questions: quiz.questions.map(question => ({
              id: question.id,
              text: question.text,
              type: question.type,
              position: question.position,
              points: question.points,
              explanation: question.explanation,
              options: question.options.map(option => ({
                id: option.id,
                text: option.text,
                isCorrect: option.isCorrect,
                position: option.position
              }))
            }))
          }))
        }))
      };
      
      // Create a backup version
      await tx.courseVersion.create({
        data: {
          courseId,
          title: `Backup before restoring "${version.title}"`,
          description: `Automatic backup created before restoring version "${version.title}"`,
          isAutosave: false,
          createdById: userId,
          snapshot: JSON.stringify(backupSnapshot)
        }
      });
      
      // 2. Update course base data
      await tx.course.update({
        where: { id: courseId },
        data: {
          title: snapshot.courseData.title,
          description: snapshot.courseData.description,
          shortDescription: snapshot.courseData.shortDescription,
          imageUrl: snapshot.courseData.imageUrl,
          price: snapshot.courseData.price,
          isPublished: snapshot.courseData.isPublished,
          category: snapshot.courseData.category,
          language: snapshot.courseData.language,
          level: snapshot.courseData.level,
          difficulty: snapshot.courseData.difficulty,
          requirements: typeof snapshot.courseData.requirements === 'string' 
            ? snapshot.courseData.requirements 
            : JSON.stringify(snapshot.courseData.requirements),
          learningOutcomes: typeof snapshot.courseData.learningOutcomes === 'string' 
            ? snapshot.courseData.learningOutcomes 
            : JSON.stringify(snapshot.courseData.learningOutcomes),
          targetAudience: typeof snapshot.courseData.targetAudience === 'string' 
            ? snapshot.courseData.targetAudience 
            : JSON.stringify(snapshot.courseData.targetAudience),
        }
      });
      
      // 3. Process modules - this is more complex as we need to handle additions, removals, and updates
      
      // Get current modules to determine what needs to be deleted
      const existingModuleIds = currentModules.map(m => m.id);
      const snapshotModuleIds = snapshot.modules.map((m: any) => m.id);
      
      // Delete modules that are not in the snapshot
      for (const existingModuleId of existingModuleIds) {
        if (!snapshotModuleIds.includes(existingModuleId)) {
          await tx.module.delete({
            where: { id: existingModuleId }
          });
        }
      }
      
      // Create or update modules from snapshot
      for (const moduleData of snapshot.modules) {
        const moduleExists = existingModuleIds.includes(moduleData.id);
        
        if (moduleExists) {
          // Update existing module
          await tx.module.update({
            where: { id: moduleData.id },
            data: {
              title: moduleData.title,
              description: moduleData.description,
              position: moduleData.position,
              isPublished: moduleData.isPublished
            }
          });
          
          // Get existing lessons and quizzes for this module
          const existingLessons = await tx.lesson.findMany({
            where: { moduleId: moduleData.id },
            select: { id: true }
          });
          
          const existingQuizzes = await tx.quiz.findMany({
            where: { moduleId: moduleData.id },
            select: { id: true }
          });
          
          const existingLessonIds = existingLessons.map(l => l.id);
          const existingQuizIds = existingQuizzes.map(q => q.id);
          
          // Process lessons
          const snapshotLessonIds = moduleData.lessons.map((l: any) => l.id);
          
          // Delete lessons that are not in the snapshot
          for (const existingLessonId of existingLessonIds) {
            if (!snapshotLessonIds.includes(existingLessonId)) {
              await tx.lesson.delete({
                where: { id: existingLessonId }
              });
            }
          }
          
          // Create or update lessons
          for (const lessonData of moduleData.lessons) {
            const lessonExists = existingLessonIds.includes(lessonData.id);
            
            if (lessonExists) {
              // Update lesson
              await tx.lesson.update({
                where: { id: lessonData.id },
                data: {
                  title: lessonData.title,
                  description: lessonData.description,
                  position: lessonData.position,
                  isPublished: lessonData.isPublished,
                  isFree: lessonData.isFree
                }
              });
              
              // Update lesson content if it exists
              if (lessonData.content) {
                await tx.lessonContent.upsert({
                  where: { lessonId: lessonData.id },
                  update: {
                    text: lessonData.content.text,
                    videoUrl: lessonData.content.videoUrl,
                    attachments: typeof lessonData.content.attachments === 'string' 
                      ? lessonData.content.attachments 
                      : JSON.stringify(lessonData.content.attachments),
                    resources: typeof lessonData.content.resources === 'string' 
                      ? lessonData.content.resources 
                      : JSON.stringify(lessonData.content.resources),
                  },
                  create: {
                    lessonId: lessonData.id,
                    text: lessonData.content.text,
                    videoUrl: lessonData.content.videoUrl,
                    attachments: typeof lessonData.content.attachments === 'string' 
                      ? lessonData.content.attachments 
                      : JSON.stringify(lessonData.content.attachments),
                    resources: typeof lessonData.content.resources === 'string' 
                      ? lessonData.content.resources 
                      : JSON.stringify(lessonData.content.resources),
                  }
                });
              }
            } else {
              // Create new lesson
              const newLesson = await tx.lesson.create({
                data: {
                  id: lessonData.id, // Keep same ID
                  moduleId: moduleData.id,
                  title: lessonData.title,
                  description: lessonData.description,
                  position: lessonData.position,
                  isPublished: lessonData.isPublished,
                  isFree: lessonData.isFree
                }
              });
              
              // Create lesson content if it exists
              if (lessonData.content) {
                await tx.lessonContent.create({
                  data: {
                    lessonId: newLesson.id,
                    text: lessonData.content.text,
                    videoUrl: lessonData.content.videoUrl,
                    attachments: typeof lessonData.content.attachments === 'string' 
                      ? lessonData.content.attachments 
                      : JSON.stringify(lessonData.content.attachments),
                    resources: typeof lessonData.content.resources === 'string' 
                      ? lessonData.content.resources 
                      : JSON.stringify(lessonData.content.resources),
                  }
                });
              }
            }
          }
          
          // Process quizzes
          const snapshotQuizIds = moduleData.quizzes.map((q: any) => q.id);
          
          // Delete quizzes that are not in the snapshot
          for (const existingQuizId of existingQuizIds) {
            if (!snapshotQuizIds.includes(existingQuizId)) {
              await tx.quiz.delete({
                where: { id: existingQuizId }
              });
            }
          }
          
          // Create or update quizzes
          for (const quizData of moduleData.quizzes) {
            const quizExists = existingQuizIds.includes(quizData.id);
            
            if (quizExists) {
              // Update quiz
              await tx.quiz.update({
                where: { id: quizData.id },
                data: {
                  title: quizData.title,
                  description: quizData.description,
                  position: quizData.position,
                  isPublished: quizData.isPublished,
                  timeLimit: quizData.timeLimit,
                  passingScore: quizData.passingScore
                }
              });
              
              // Get existing questions
              const existingQuestions = await tx.quizQuestion.findMany({
                where: { quizId: quizData.id },
                select: { id: true }
              });
              
              const existingQuestionIds = existingQuestions.map(q => q.id);
              const snapshotQuestionIds = quizData.questions.map((q: any) => q.id);
              
              // Delete questions that are not in the snapshot
              for (const existingQuestionId of existingQuestionIds) {
                if (!snapshotQuestionIds.includes(existingQuestionId)) {
                  await tx.quizQuestion.delete({
                    where: { id: existingQuestionId }
                  });
                }
              }
              
              // Create or update questions
              for (const questionData of quizData.questions) {
                const questionExists = existingQuestionIds.includes(questionData.id);
                
                if (questionExists) {
                  // Update question
                  await tx.quizQuestion.update({
                    where: { id: questionData.id },
                    data: {
                      text: questionData.text,
                      type: questionData.type,
                      position: questionData.position,
                      points: questionData.points,
                      explanation: questionData.explanation
                    }
                  });
                  
                  // Get existing options
                  const existingOptions = await tx.quizQuestionOption.findMany({
                    where: { questionId: questionData.id },
                    select: { id: true }
                  });
                  
                  const existingOptionIds = existingOptions.map(o => o.id);
                  const snapshotOptionIds = questionData.options.map((o: any) => o.id);
                  
                  // Delete options that are not in the snapshot
                  for (const existingOptionId of existingOptionIds) {
                    if (!snapshotOptionIds.includes(existingOptionId)) {
                      await tx.quizQuestionOption.delete({
                        where: { id: existingOptionId }
                      });
                    }
                  }
                  
                  // Create or update options
                  for (const optionData of questionData.options) {
                    const optionExists = existingOptionIds.includes(optionData.id);
                    
                    if (optionExists) {
                      // Update option
                      await tx.quizQuestionOption.update({
                        where: { id: optionData.id },
                        data: {
                          text: optionData.text,
                          isCorrect: optionData.isCorrect,
                          position: optionData.position
                        }
                      });
                    } else {
                      // Create new option
                      await tx.quizQuestionOption.create({
                        data: {
                          id: optionData.id, // Keep same ID
                          questionId: questionData.id,
                          text: optionData.text,
                          isCorrect: optionData.isCorrect,
                          position: optionData.position
                        }
                      });
                    }
                  }
                } else {
                  // Create new question
                  const newQuestion = await tx.quizQuestion.create({
                    data: {
                      id: questionData.id, // Keep same ID
                      quizId: quizData.id,
                      text: questionData.text,
                      type: questionData.type,
                      position: questionData.position,
                      points: questionData.points,
                      explanation: questionData.explanation
                    }
                  });
                  
                  // Create options
                  for (const optionData of questionData.options) {
                    await tx.quizQuestionOption.create({
                      data: {
                        id: optionData.id, // Keep same ID
                        questionId: newQuestion.id,
                        text: optionData.text,
                        isCorrect: optionData.isCorrect,
                        position: optionData.position
                      }
                    });
                  }
                }
              }
            } else {
              // Create new quiz
              const newQuiz = await tx.quiz.create({
                data: {
                  id: quizData.id, // Keep same ID
                  moduleId: moduleData.id,
                  title: quizData.title,
                  description: quizData.description,
                  position: quizData.position,
                  isPublished: quizData.isPublished,
                  timeLimit: quizData.timeLimit,
                  passingScore: quizData.passingScore
                }
              });
              
              // Create questions and options
              for (const questionData of quizData.questions) {
                const newQuestion = await tx.quizQuestion.create({
                  data: {
                    id: questionData.id, // Keep same ID
                    quizId: newQuiz.id,
                    text: questionData.text,
                    type: questionData.type,
                    position: questionData.position,
                    points: questionData.points,
                    explanation: questionData.explanation
                  }
                });
                
                // Create options
                for (const optionData of questionData.options) {
                  await tx.quizQuestionOption.create({
                    data: {
                      id: optionData.id, // Keep same ID
                      questionId: newQuestion.id,
                      text: optionData.text,
                      isCorrect: optionData.isCorrect,
                      position: optionData.position
                    }
                  });
                }
              }
            }
          }
        } else {
          // Create new module
          const newModule = await tx.module.create({
            data: {
              id: moduleData.id, // Keep same ID
              courseId,
              title: moduleData.title,
              description: moduleData.description,
              position: moduleData.position,
              isPublished: moduleData.isPublished
            }
          });
          
          // Create lessons
          for (const lessonData of moduleData.lessons) {
            const newLesson = await tx.lesson.create({
              data: {
                id: lessonData.id, // Keep same ID
                moduleId: newModule.id,
                title: lessonData.title,
                description: lessonData.description,
                position: lessonData.position,
                isPublished: lessonData.isPublished,
                isFree: lessonData.isFree
              }
            });
            
            // Create lesson content if it exists
            if (lessonData.content) {
              await tx.lessonContent.create({
                data: {
                  lessonId: newLesson.id,
                  text: lessonData.content.text,
                  videoUrl: lessonData.content.videoUrl,
                  attachments: typeof lessonData.content.attachments === 'string' 
                    ? lessonData.content.attachments 
                    : JSON.stringify(lessonData.content.attachments),
                  resources: typeof lessonData.content.resources === 'string' 
                    ? lessonData.content.resources 
                    : JSON.stringify(lessonData.content.resources),
                }
              });
            }
          }
          
          // Create quizzes
          for (const quizData of moduleData.quizzes) {
            const newQuiz = await tx.quiz.create({
              data: {
                id: quizData.id, // Keep same ID
                moduleId: newModule.id,
                title: quizData.title,
                description: quizData.description,
                position: quizData.position,
                isPublished: quizData.isPublished,
                timeLimit: quizData.timeLimit,
                passingScore: quizData.passingScore
              }
            });
            
            // Create questions and options
            for (const questionData of quizData.questions) {
              const newQuestion = await tx.quizQuestion.create({
                data: {
                  id: questionData.id, // Keep same ID
                  quizId: newQuiz.id,
                  text: questionData.text,
                  type: questionData.type,
                  position: questionData.position,
                  points: questionData.points,
                  explanation: questionData.explanation
                }
              });
              
              // Create options
              for (const optionData of questionData.options) {
                await tx.quizQuestionOption.create({
                  data: {
                    id: optionData.id, // Keep same ID
                    questionId: newQuestion.id,
                    text: optionData.text,
                    isCorrect: optionData.isCorrect,
                    position: optionData.position
                  }
                });
              }
            }
          }
        }
      }
    });
    
    // Create a log entry for this restoration
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RESTORE_VERSION',
        resourceType: 'COURSE',
        resourceId: courseId,
        details: JSON.stringify({
          versionId,
          versionTitle: version.title
        })
      }
    });
    
    return NextResponse.json({
      message: 'Course version restored successfully',
      versionId
    });
  } catch (error) {
    console.error('[RESTORE_COURSE_VERSION_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to restore course version', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
