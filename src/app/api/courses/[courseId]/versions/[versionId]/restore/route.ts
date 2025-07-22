/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Extend the transaction client type to include our custom models
type ExtendedTransactionClient = ReturnType<typeof prisma.$extends> & {
  course: typeof prisma.course;
  module: typeof prisma.module;
  quiz: typeof prisma.quiz;
  courseVersion: typeof prisma.courseVersion;
};
import { withErrorHandling } from '@/lib/api-response';

interface VersionedModule {
  id: string;
  title: string;
  description: string;
  position: number;
  isPublished: boolean;
  lessons: VersionedLesson[];
  quizzes: VersionedQuiz[];
}

interface VersionedLesson {
  id: string;
  title: string;
  description: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  content: any;
}

interface VersionedQuiz {
  id: string;
  title: string;
  description: string;
  position: number;
  isPublished: boolean;
  timeLimit: number | null;
  passingScore: number;
  questions: VersionedQuestion[];
}

interface VersionedQuestion {
  id: string;
  text: string;
  type: string;
  position: number;
  points: number;
  explanation: string | null;
  options: VersionedOption[];
}

interface VersionedOption {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

interface RestoreOptions {
  createBackup: boolean;
  backupNotes?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; versionId: string }> }
) {
  const { courseId, versionId } = await params;
  
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }), 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const options: RestoreOptions = await req.json().catch(() => ({
      createBackup: true,
      backupNotes: 'Backup before restore'
    }));
    
    // Get the version to restore
    const version = await prisma.courseVersion.findUnique({
      where: { id: versionId, courseId },
      include: {
        course: {
          include: {
            instructor: true,
          },
        },
      },
    });
    
    if (!version) {
      return new NextResponse(
        JSON.stringify({ error: 'Version not found' }), 
        { status: 404 }
      );
    }
    
    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isInstructor = version.course.instructorId === userId;
    
    if (!isAdmin && !isInstructor) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized to restore this version' }), 
        { status: 403 }
      );
    }
    
    // Parse the version data
    const versionData = version.data as unknown as {
      courseData: any;
      modules: VersionedModule[];
      quizzes: VersionedQuiz[];
    };
    
    // Start transaction with typed client
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create backup if requested
      if (options.createBackup) {
        const currentCourse = await (tx as any).course.findUnique({
          where: { id: courseId },
          include: {
            modules: {
              include: {
                lessons: true,
                quizzes: {
                  include: {
                    questions: {
                      include: {
                        options: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
        
        if (currentCourse) {
          await tx.courseVersion.create({
            data: {
              courseId,
              versionNumber: (version.versionNumber || 0) + 1,
              data: JSON.parse(JSON.stringify(currentCourse)),
              createdById: userId,
              notes: options.backupNotes || 'Backup before restore',
            },
          });
        }
      }
      
      // 2. Restore course data
      const { courseData, modules = [], quizzes = [] } = versionData;
      
      // Update course
      await tx.course.update({
        where: { id: courseId },
        data: {
          ...courseData,
          updatedAt: new Date(),
        },
      });
      
      // Delete existing modules and quizzes
      await tx.module.deleteMany({ where: { courseId } });
      await tx.quiz.deleteMany({ where: { courseId } });
      
      // Restore modules
      for (const moduleData of modules) {
        const { lessons = [], quizzes: moduleQuizzes = [], ...module } = moduleData;
        
        const newModule = await tx.module.create({
          data: {
            ...module,
            courseId,
            lessons: {
              create: lessons.map(lesson => ({
                ...lesson,
                courseId,
              })),
            },
          },
        });
        
        // Restore quizzes for this module
        for (const quizData of moduleQuizzes) {
          const { questions = [], ...quiz } = quizData;
          
          await tx.quiz.create({
            data: {
              ...quiz,
              courseId,
              moduleId: newModule.id,
              questions: {
                create: questions.map(question => ({
                  ...question,
                  options: {
                    create: question.options || [],
                  },
                })),
              },
            },
          });
        }
      }
      
      // Restore standalone quizzes
      for (const quizData of quizzes) {
        const { questions = [], ...quiz } = quizData;
        
        await tx.quiz.create({
          data: {
            ...quiz,
            courseId,
            questions: {
              create: questions.map(question => ({
                ...question,
                options: {
                  create: question.options || [],
                },
              })),
            },
          },
        });
      }
      
      return { success: true };
    });
    
    return NextResponse.json(result);
  });
}
