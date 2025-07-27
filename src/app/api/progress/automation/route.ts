import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Type definitions
type EnrollmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'DROPPED';

interface ProgressUpdateData {
  enrollmentId: string;
  lessonId?: string;
  quizId?: string;
  score?: number;
  answers?: any;
  completedAt?: Date;
}

interface ProgressData {
  enrollmentId: string;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
}

interface Module {
  id: string;
  order: number;
  courseId: string;
}

interface Lesson {
  id: string;
  moduleId: string;
}

interface Quiz {
  id: string;
  moduleId: string;
}

interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt: Date | null;
}

interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  answers: any;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to safely execute raw queries
async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    // Using $queryRawUnsafe with proper parameter binding
    const result = await prisma.$queryRawUnsafe<unknown>(
      query,
      ...params
    ) as T[];
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database operation failed');
  }
}

// Helper function to execute raw queries that don't return results
async function executeCommand(query: string, params: any[] = []): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(query, ...params);
  } catch (error) {
    console.error('Database command failed:', error);
    throw new Error('Database operation failed');
  }
}

async function calculateCourseProgress(enrollmentId: string): Promise<number> {
  try {
    // Get enrollment data
    const enrollmentQuery = `
      SELECT * FROM "Enrollment" 
      WHERE id = $1 
      LIMIT 1
    `;
    const enrollmentResult = await executeQuery<Enrollment>(
      enrollmentQuery, 
      [enrollmentId]
    );
    
    const enrollment = enrollmentResult[0];
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Get modules for the course
    const modulesQuery = `
      SELECT id, "order", "courseId" FROM "Module" 
      WHERE "courseId" = $1
      ORDER BY "order" ASC
    `;
    const moduleResult = await executeQuery<Module>(
      modulesQuery, 
      [enrollment.courseId]
    );
    
    const moduleIds = moduleResult.map(m => m.id);
    if (moduleIds.length === 0) {
      return 0; // No modules in this course yet
    }

    // Get all lessons and quizzes for these modules
    const [lessons, quizzes] = await Promise.all([
      executeQuery<Lesson>(
        `SELECT id, "moduleId" FROM "Lesson" WHERE "moduleId" = ANY($1)`, 
        [moduleIds]
      ),
      executeQuery<Quiz>(
        `SELECT id, "moduleId" FROM "Quiz" WHERE "moduleId" = ANY($1)`, 
        [moduleIds]
      )
    ]);

    // Calculate total items (lessons + quizzes)
    let totalItems = 0;
    let completedItems = 0;
    const userId = enrollment.userId;

    // Process lessons
    if (lessons.length > 0) {
      const lessonIds = lessons.map(l => l.id);
      const completedLessonsResult = await executeQuery<{ count: string }>(
        `SELECT COUNT(*) FROM "LessonProgress" 
         WHERE "userId" = $1 AND "isCompleted" = true AND "lessonId" = ANY($2)`,
        [userId, lessonIds]
      );
      completedItems += parseInt(completedLessonsResult[0]?.count || '0', 10);
      totalItems += lessons.length;
    }

    // Process quizzes
    if (quizzes.length > 0) {
      const quizIds = quizzes.map(q => q.id);
      const completedQuizzesResult = await executeQuery<{ count: string }>(
        `SELECT COUNT(DISTINCT "quizId") FROM "QuizAttempt" 
         WHERE "userId" = $1 AND "passed" = true AND "quizId" = ANY($2)`,
        [userId, quizIds]
      );
      completedItems += parseInt(completedQuizzesResult[0]?.count || '0', 10);
      totalItems += quizzes.length;
    }

    // Calculate progress percentage
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    // Update enrollment progress
    const updateQuery = `
      UPDATE "Enrollment" 
      SET "progress" = $1,
          "status" = $2::"EnrollmentStatus",
          "updatedAt" = NOW()
          ${progress === 100 ? ', "completedAt" = NOW()' : ''}
      WHERE "id" = $3
    `;
    
    await executeCommand(
      updateQuery, 
      [
        progress, 
        progress === 100 ? 'COMPLETED' : 'IN_PROGRESS', 
        enrollmentId
      ]
    );

    return progress;
  } catch (error) {
    console.error('Error calculating course progress:', error);
    throw new Error('Failed to calculate course progress');
  }
}

async function checkAndIssueCertificate(enrollmentId: string) {
  const progress = await calculateCourseProgress(enrollmentId);
  
  if (progress >= 100) {
    // Check if certificate already exists using raw query
    const existingCertificate = await prisma.$queryRaw<{id: string}[]>`
      SELECT id FROM "Certificate" WHERE "enrollmentId" = ${enrollmentId} LIMIT 1
    `;

    if (existingCertificate.length > 0) {
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
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const data: ProgressUpdateData = await request.json();
    const { enrollmentId, lessonId, quizId, score, answers } = data;
    const userId = session.user.id;

    // Verify enrollment exists and belongs to user
    const enrollmentQuery = `
      SELECT id, "userId" FROM "Enrollment" 
      WHERE "id" = $1 AND "userId" = $2
      LIMIT 1
    `;
    
    const enrollmentResult = await executeQuery<{ id: string; userId: string }>(
      enrollmentQuery, 
      [enrollmentId, userId]
    );
    
    if (enrollmentResult.length === 0) {
      return NextResponse.json(
        { error: 'Enrollment not found' }, 
        { status: 404 }
      );
    }

    // Update lesson progress if lessonId is provided
    if (lessonId) {
      const lessonProgressQuery = `
        INSERT INTO "LessonProgress" 
          (id, "userId", "lessonId", "isCompleted", "completedAt", "createdAt", "updatedAt")
        VALUES 
          (gen_random_uuid(), $1, $2, true, NOW(), NOW(), NOW())
        ON CONFLICT ("userId", "lessonId") 
        DO UPDATE SET 
          "isCompleted" = EXCLUDED."isCompleted",
          "completedAt" = EXCLUDED."completedAt",
          "updatedAt" = NOW()
      `;
      await executeCommand(lessonProgressQuery, [userId, lessonId]);
    }

    // Update quiz completion if quizId is provided
    if (quizId && score !== undefined) {
      const passed = score >= 70;
      const quizAttemptQuery = `
        INSERT INTO "QuizAttempt" 
          (id, "quizId", "userId", score, passed, answers, "createdAt", "updatedAt")
        VALUES 
          (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, NOW(), NOW())
      `;
      await executeCommand(
        quizAttemptQuery, 
        [
          quizId, 
          userId, 
          score, 
          passed,
          answers ? JSON.stringify(answers) : null
        ]
      );
    }

    // Calculate and update overall course progress
    const progress = await calculateCourseProgress(enrollmentId);
    
    return NextResponse.json({ 
      success: true, 
      progress 
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const enrollmentId = url.searchParams.get('enrollmentId');
    
    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'enrollmentId query parameter is required' },
        { status: 400 }
      );
    }

    // 1. Get enrollment data
    const enrollmentQuery = `
      SELECT e.*, u.id as "userId", u.name, u.email, 
             c.id as "courseId", c.title as "courseTitle"
      FROM "Enrollment" e
      JOIN "User" u ON e."userId" = u.id
      JOIN "Course" c ON e."courseId" = c.id
      WHERE e.id = $1 AND e."userId" = $2
      LIMIT 1
    `;
    
    const enrollmentResult = await executeQuery<Enrollment & { 
      userId: string; 
      name: string; 
      email: string;
      courseId: string;
      courseTitle: string;
    }>(
      enrollmentQuery,
      [enrollmentId, session.user.id]
    );
    
    if (enrollmentResult.length === 0) {
      return NextResponse.json(
        { error: 'Enrollment not found or access denied' },
        { status: 404 }
      );
    }

    const enrollment = enrollmentResult[0];
    
    // 2. Get modules with their lessons and quizzes
    const modulesQuery = `
      SELECT 
        m.id, m.title, m."order", m."courseId",
        (
          SELECT json_agg(json_build_object(
            'id', l.id,
            'title', l.title,
            'order', l."order"
          ))
          FROM "Lesson" l
          WHERE l."moduleId" = m.id
          ORDER BY l."order"
        ) as lessons,
        (
          SELECT json_agg(json_build_object(
            'id', q.id,
            'title', q.title,
            'order', q."order",
            'passingScore', q."passingScore"
          ))
          FROM "Quiz" q
          WHERE q."moduleId" = m.id
          ORDER BY q."order"
        ) as quizzes
      FROM "Module" m
      WHERE m."courseId" = $1
      ORDER BY m."order"
    `;
    
    const modules = await executeQuery<{
      id: string;
      title: string;
      order: number;
      courseId: string;
      lessons: Array<{ id: string; title: string; order: number }>;
      quizzes: Array<{ id: string; title: string; order: number; passingScore: number }>;
    }>(modulesQuery, [enrollment.courseId]);
    
    // 3. Get completed lessons and passed quizzes for the user
    const [completedLessons, passedQuizzes] = await Promise.all([
      executeQuery<{ lessonId: string }>(
        'SELECT "lessonId" FROM "LessonProgress" WHERE "userId" = $1 AND "isCompleted" = true',
        [session.user.id]
      ),
      executeQuery<{ quizId: string; score: number }>(
        'SELECT "quizId", "score" FROM "QuizAttempt" WHERE "userId" = $1 AND "passed" = true',
        [session.user.id]
      )
    ]);

    // 4. Calculate progress for each module
    const modulesWithProgress = modules.map(module => {
      const moduleLessons = module.lessons || [];
      const moduleQuizzes = module.quizzes || [];
      
      const completedLessonCount = moduleLessons.filter(lesson => 
        completedLessons.some(cl => cl.lessonId === lesson.id)
      ).length;
      
      const passedQuizCount = moduleQuizzes.filter(quiz => 
        passedQuizzes.some(pq => pq.quizId === quiz.id)
      ).length;
      
      const totalItems = moduleLessons.length + moduleQuizzes.length;
      const completedItems = completedLessonCount + passedQuizCount;
      
      return {
        ...module,
        completedLessons: completedLessonCount,
        completedQuizzes: passedQuizCount,
        totalLessons: moduleLessons.length,
        totalQuizzes: moduleQuizzes.length,
        progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
      };
    });

    // 5. Calculate overall course progress
    const totalCourseItems = modulesWithProgress.reduce(
      (sum, module) => sum + module.totalLessons + module.totalQuizzes, 0
    );
    const completedCourseItems = modulesWithProgress.reduce(
      (sum, module) => sum + module.completedLessons + module.completedQuizzes, 0
    );
    const overallProgress = totalCourseItems > 0 
      ? Math.round((completedCourseItems / totalCourseItems) * 100)
      : 0;

    // 6. Prepare and return the response
    const response = {
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progress: overallProgress,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt,
        user: {
          id: enrollment.userId,
          name: enrollment.name,
          email: enrollment.email
        },
        course: {
          id: enrollment.courseId,
          title: enrollment.courseTitle,
          modules: modulesWithProgress
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
