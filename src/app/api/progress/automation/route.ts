// Core imports
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize Prisma client
const prisma = new PrismaClient();

// Extend NextAuth types with progress tracking fields
declare module 'next-auth' {
  interface User {
    points: number;  // User's earned points
    level: number;   // User's current level
  }
  
  interface Session {
    User: User & {
      role: string;  // User's role
      points: number;  // User's points
      level: number;   // User's level
    }
  }
}

// Interface for progress tracking data
interface ProgressData {
  lessonId?: string;     // Optional lesson identifier
  quizId?: string;       // Optional quiz identifier
  score?: number;        // Optional score
  answers?: Record<string, any>;  // Optional quiz answers
  completedAt?: Date;    // Optional completion timestamp
  enrollmentId: string;  // Required enrollment ID
}

// Interface for quiz structure
interface Quiz {
  id: string;           // Unique quiz ID
  title: string;        // Quiz title
  passingScore: number; // Required score to pass
  moduleId: string;     // Parent module ID
}

// Interface for lesson structure
interface Lesson {
  id: string;       // Unique lesson ID
  title: string;    // Lesson title
  content: string;  // Lesson content
  videoUrl: string | null;  // Optional video URL
  moduleId: string;  // Parent module ID
  order: number;     // Lesson order in module
}

// Interface for module structure
interface Module {
  id: string;     // Unique module ID
  title: string;  // Module title
  quizzes: Quiz[];  // List of quizzes in module
  lessons: Lesson[];
  order: number;
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  status: EnrollmentStatus;
  startedAt: Date;
  completedAt: Date | null;
}

import { EnrollmentStatus } from '@prisma/client';

interface ModuleWithLessons {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Array<{
    id: string;
    title: string;
    content: string;
    videoUrl?: string;
    order: number;
    lessonProgress: Array<{
      userId: string;
      status: string;
      completedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    }>;
    resources: Array<{
      id: string;
      title: string;
      type: string;
      url: string;
    }>;
    type: string;
    duration?: number;
    isInteractive: boolean;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    description?: string;
    attempts: Array<{
      userId: string;
      score: number;
      startedAt: Date;
      completedAt?: Date;
      isProctoredExam: boolean;
      answers: Record<string, any>;
    }>;
    passingScore: number;
    timeLimit?: number;
  }>;
}

interface ProgressResponse {
  overallProgress: number;
  moduleProgress: Array<{
    moduleId: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    completedQuizzes: number;
    totalQuizzes: number;
  }>;
  isCompleted: boolean;
}

interface ProgressUpdateData {
  enrollmentId: string;
  lessonId?: string;
  quizId?: string;
  score?: number;
  completedAt?: Date;
  answers?: Record<string, string>;
}

async function calculateCourseProgress(enrollmentId: string): Promise<number> {
  try {
    const enrollment: Enrollment | null = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        id: true,
        userId: true,
        courseId: true,
        progress: true,
        status: true,
        startedAt: true,
        completedAt: true
      }
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const course = await prisma.course.findUnique({
      where: { id: enrollment.courseId },
      select: {
        id: true,
        title: true,
        modules: {
          select: {
            id: true,
            title: true,
            quizzes: {
              select: {
                id: true,
                title: true,
                passingScore: true,
                moduleId: true
              }
            },
            lessons: {
              select: {
                id: true,
                title: true,
                content: true,
                videoUrl: true,
                moduleId: true,
                order: true
              }
            },
            order: true
          }
        }
      }
    }) as Course | null;

    if (!course) {
      throw new Error('Course not found');
    }

    // Calculate total items
    const totalLessons = course.modules.reduce((acc: number, module: Module) => 
      acc + (module.lessons?.length || 0), 0
    );

    const totalQuizzes = course.modules.reduce((acc: number, module: Module) => 
      acc + (module.quizzes?.length || 0), 0
    );

    const totalItems = totalLessons + totalQuizzes;

    if (totalItems === 0) return 0;

    // Calculate completed items
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId: enrollment.userId,
        status: 'COMPLETED',
        lesson: {
          moduleId: {
            in: course.modules.map(m => m.id)
          }
        }
      }
    });

    const completedQuizzes = await prisma.quizAttempt.count({
      where: {
        userId: enrollment.userId,
        score: {
          gte: 70
        },
        quiz: {
          moduleId: {
            in: course.modules.map(m => m.id)
          }
        }
      }
    });

    const completedItems = completedLessons + completedQuizzes;
    return (completedItems / totalItems) * 100;
  } catch (error) {
    console.error('Error calculating course progress:', error);
    throw error;
  }
}

async function checkAndIssueCertificate(enrollmentId: string) {
  const progress = await calculateCourseProgress(enrollmentId);
  
  if (progress >= 100) {
    // Check if certificate already exists
    const certificate = await prisma.certificate.findUnique({
      where: {
        id: enrollmentId
      }
    });

    if (certificate) {
      return NextResponse.json({ error: 'Certificate already issued' }, { status: 400 });
    }

    if (certificate) {
      return NextResponse.json({ error: 'Certificate already issued' }, { status: 400 });
    }

    // Trigger certificate issuance
    await fetch('/api/certificates/automation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enrollmentId }),
    });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data: ProgressUpdateData = await request.json();
    const enrollmentId = data.enrollmentId;
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  include: {
                    progress: {
                      where: {
                        userId: session.user.email
                      }
                    }
                  }
                },
                quizzes: {
                  include: {
                    attempts: {
                      where: {
                        userId: session.user.email
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Update lesson progress if lessonId is provided
    if (data.lessonId) {
      await prisma.lessonProgress.upsert({
        where: {
          lessonId_userId: {
            userId: session.user.id,
            lessonId: data.lessonId
          }
        },
        update: {
          status: 'COMPLETED',
          completedAt: data.completedAt || new Date()
        },
        create: {
          userId: session.user.id,
          lessonId: data.lessonId,
          status: 'COMPLETED',
          completedAt: data.completedAt || new Date()
        }
      });
    }

    // Update quiz completion if quizId is provided
    if (data.quizId && data.score !== undefined) {
      // Create quiz attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          quiz: { connect: { id: data.quizId } },
          user: { connect: { email: session.user.email } },
          score: data.score,
          completedAt: new Date(),
          answers: data.answers ? JSON.stringify(data.answers) : Prisma.JsonNull
        },
      });
    }

    // Calculate and update overall course progress
    const progress = await calculateCourseProgress(data.enrollmentId);
    
    await prisma.enrollment.update({
      where: { id: data.enrollmentId },
      data: {
        progress: Math.round(progress * 100) / 100
      }
    });

    // Check if course is completed and issue certificate
    await checkAndIssueCertificate(data.enrollmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);

// Get progress statistics
  try {
    const session = await getServerSession(authOptions);
    const data = await request.json() as ProgressData;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        user: true,
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: {
                    id: true,
                    title: true,
                    order: true,
                    resources: true
                  }
                },
                quizzes: {
                  select: {
                    id: true,
                    title: true,
                    passingScore: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: enrollment.courseId },
      select: {
        modules: true
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const moduleProgress = course.modules.map(async (module: any) => {
      const totalLessons = module.lessons?.length || 0;
      const totalQuizzes = module.quizzes?.length || 0;
      const totalItems = totalLessons + totalQuizzes;

      const completedLessons = await prisma.lessonProgress.count({
        where: {
          userId: enrollment.userId,
          status: 'COMPLETED',
          lesson: {
            moduleId: module.id
          }
        }
      });

      const completedQuizzes = await prisma.quizAttempt.count({
        where: {
          userId: enrollment.userId,
          score: {
            gte: 70
          },
          quiz: {
            moduleId: module.id
          }
        }
      });

      const progress = totalItems > 0 
        ? ((completedLessons + completedQuizzes) / totalItems) * 100
        : 0;

      return {
        moduleId: module.id,
        progress: progress,
        completedLessons: completedLessons,
        totalLessons: totalLessons,
        completedQuizzes: completedQuizzes,
        totalQuizzes: totalQuizzes
      };
    });

    const results = await Promise.all(moduleProgress);
    const overallProgress = results.reduce((acc: number, curr: { progress: number }) => {
      return acc + curr.progress;
    }, 0) / results.length || 0;

    const isCompleted = enrollment.progress >= 100;

    return NextResponse.json({
      overallProgress: Math.round(overallProgress * 100) / 100,
      moduleProgress: results,
      isCompleted
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
