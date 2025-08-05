import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseCSV } from '@/lib/utils/csv';

const prisma = new PrismaClient();

interface AssignmentCSVRow {
  title: string;
  description: string;
  points: number; // Matches Prisma's Int type
  dueDate: string;
  moduleId: string;
}

interface LessonCSVRow {
  title: string;
  description: string;
  moduleId: string;
}

interface QuizCSVRow {
  title: string;
  description: string;
  moduleId: string;
  passingScore: number; // Matches Prisma's Int type
  points: number;      // Matches Prisma's Int type
  timeLimit: number;   // Matches Prisma's Int type
}

// Type guard for operation
const supportedOperations = ['create-assignments', 'create-lessons', 'create-quizzes', 'bulk-grades'] as const;
type SupportedOperation = typeof supportedOperations[number];

const isValidOperation = (operation: SupportedOperation | null): boolean => {
  return operation !== null;
};



export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const operation = formData.get('operation') as SupportedOperation | null;
    const courseId = formData.get('courseId') as string | null;
    const file = formData.get('file') as File | null;

    if (!operation || !isValidOperation(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation type' },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const validOperation = operation as SupportedOperation;
    const validCourseId = courseId as string;
    const validFile = file as File;

    // Verify user owns the course
    const course = await prisma.course.findUnique({
      where: { id: validCourseId },
      select: { instructorId: true }
    });

    if (!course || course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Course not found or you do not own this course' },
        { status: 403 }
      );
    }

    switch (validOperation) {
      case 'create-assignments':
        const assignments = await processAssignments(validFile, validCourseId, session);
        return NextResponse.json({
          success: true,
          message: 'Assignments created successfully',
          assignments
        });
      case 'create-lessons':
        const lessons = await processLessons(validFile, validCourseId, session);
        return NextResponse.json({
          success: true,
          message: 'Lessons created successfully',
          lessons
        });
      case 'create-quizzes':
        const quizzes = await processQuizzes(validFile, validCourseId, session);
        return NextResponse.json({
          success: true,
          message: 'Quizzes created successfully',
          quizzes
        });
      case 'bulk-grades':
        if (!session?.user?.email) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        const { data: csvData, headers } = await parseCSV(validFile);
        const result = await processBulkGrades(
          csvData,
          headers,
          session.user.email,
          session
        );
        return NextResponse.json({
          success: true,
          message: 'Grades processed successfully',
          result
        });
      default:
        return NextResponse.json(
          { error: 'Unsupported operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Bulk operations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processAssignments(file: File, courseId: string, session: any) {
  try {
    const { data: assignmentsData } = await parseCSV<AssignmentCSVRow>(file);
    const assignments = await Promise.all(
      assignmentsData.map((assignment) => {
        const dueDate = new Date(assignment.dueDate);
        return prisma.assignment.create({
          data: {
            title: assignment.title,
            description: assignment.description,
            points: assignment.points,
            dueDate: dueDate,
            moduleId: assignment.moduleId,
          },
          select: {
            id: true,
            title: true,
            description: true,
            points: true,
            dueDate: true,
            module: {
              select: {
                id: true,
                course: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        });
      })
    );

    await prisma.auditLog.create({
      data: {
        userId: session?.user.id,
        userEmail: session?.user.email,
        action: 'BULK_CREATE_ASSIGNMENTS',
        entityType: 'ASSIGNMENT',
        entityId: courseId,
        details: `Created ${assignments.length} assignments in course ${courseId}`
      }
    });

    return assignments;
  } catch (error) {
    console.error('Error processing assignments:', error);
    throw new Error('Failed to process assignments');
  }
}

async function processLessons(file: File, courseId: string, session: any) {
  try {
    const { data: lessonsData } = await parseCSV<LessonCSVRow>(file);
    const lessons = await Promise.all(
      lessonsData.map((lesson) => {
        return prisma.lesson.create({
          data: {
            title: lesson.title,
            description: lesson.description,
            moduleId: lesson.moduleId,
          },
          select: {
            id: true,
            title: true,
            description: true,
            module: {
              select: {
                id: true,
                course: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        });
      })
    );

    await prisma.auditLog.create({
      data: {
        userId: session?.user.id,
        userEmail: session?.user.email,
        action: 'BULK_CREATE_LESSONS',
        entityType: 'LESSON',
        entityId: courseId,
        details: `Created ${lessons.length} lessons in course ${courseId}`
      }
    });

    return lessons;
  } catch (error) {
    console.error('Error processing lessons:', error);
    throw new Error('Failed to process lessons');
  }
}

async function processQuizzes(file: File, courseId: string, session: any) {
  try {
    const { data: quizzesData } = await parseCSV<QuizCSVRow>(file);
    const quizzes = await Promise.all(
      quizzesData.map((quiz) => {
        return prisma.quiz.create({
          data: {
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore,
            timeLimit: quiz.timeLimit,
            moduleId: quiz.moduleId,
          },
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            timeLimit: true,
            module: {
              select: {
                id: true,
                course: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        });
      })
    );

    await prisma.auditLog.create({
      data: {
        userId: session?.user.id,
        userEmail: session?.user.email,
        action: 'BULK_CREATE_QUIZZES',
        entityType: 'QUIZ',
        entityId: courseId,
        details: `Created ${quizzes.length} quizzes in course ${courseId}`
      }
    });

    return quizzes;
  } catch (error) {
    console.error('Error processing quizzes:', error);
    throw new Error('Failed to process quizzes');
  }
}

async function processBulkGrades(
  dataRows: Record<string, any>[],
  headers: string[],
  userEmail: string,
  session: any
): Promise<{
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
  data: Array<{
    email: string;
    assignmentId: string;
    grade: number;
    feedback: string;
    status: string;
  }>;
}> {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    warnings: [] as string[],
    data: [] as any[]
  };

  // Verify required headers exist
  const requiredHeaders = ['email', 'assignmentId', 'grade'];
  const missingHeaders = requiredHeaders.filter(header => 
    !headers.some(h => h?.toLowerCase().includes(header))
  );

  if (missingHeaders.length > 0) {
    result.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    return result;
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const email = row.email || '';
    const assignmentId = row.assignmentId || '';
    const grade = parseFloat(row.grade || '0');
    const feedback = row.feedback || '';

    try {
      if (!email.trim() || !assignmentId.trim() || isNaN(grade)) {
        result.errors.push(`Row ${i + 2}: Invalid email, assignmentId, or grade`);
        result.failed++;
        continue;
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        result.errors.push(`Row ${i + 2}: User not found: ${email}`);
        result.failed++;
        continue;
      }

      // Find the submission to update
      const submission = await prisma.assignmentSubmission.findFirst({
        where: {
          userId: user.id,
          assignmentId,
          status: 'SUBMITTED'
        }
      });

      if (!submission) {
        result.errors.push(`Row ${i + 2}: No submitted assignment found for ${email} and assignment ${assignmentId}`);
        result.failed++;
        continue;
      }

      // Update the submission with grade and feedback
      await prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          grade,
          feedback,
          status: 'GRADED',
          gradedAt: new Date()
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          action: 'BULK_GRADE_ASSIGNMENT',
          entityType: 'ASSIGNMENT_SUBMISSION',
          entityId: submission.id,
          details: `Assignment ${assignmentId} graded with ${grade} points by ${userEmail}`
        }
      });

      result.success++;
      result.data.push({
        email,
        assignmentId,
        grade,
        feedback,
        status: 'graded'
      });

    } catch (error) {
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.failed++;
    }
  }

  return result;
}
