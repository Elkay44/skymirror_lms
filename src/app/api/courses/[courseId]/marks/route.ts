import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Use basic Prisma client to avoid extension issues
const prisma = new PrismaClient();

// Define interfaces for the response data
interface StudentMark {
  studentId: string;
  studentName: string;
  studentEmail: string;
  projects: Array<{
    id: string;
    title: string;
    grade: number | null;
    maxScore: number;
    submittedAt: Date | null;
    gradedAt: Date | null;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    score: number | null;
    maxScore: number;
    completedAt: Date | null;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    grade: number | null;
    maxScore: number;
    submittedAt: Date | null;
    gradedAt: Date | null;
  }>;
  totalScore: number;
  averageGrade: number;
  letterGrade: string;
}

interface AssessmentCategory {
  name: string;
  weight: number;
  averageScore?: number;
  totalAssessments?: number;
  completedAssessments?: number;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  overallGrade: number;
  letterGrade?: string;
  issuesCount?: number;
}

interface MarksApiResponse {
  success: boolean;
  students: StudentMark[];
  classAnalytics: {
    totalStudents: number;
    averageGrade: number;
    gradeDistribution: {
      'A': number;
      'B': number;
      'C': number;
      'D': number;
      'F': number;
    };
    assessmentCategories: AssessmentCategory[];
    topPerformers: StudentPerformance[];
    strugglingStudents: StudentPerformance[];
  };
  courseInfo: {
    courseId: string;
    courseName: string;
    totalEnrollments: number;
    lastUpdated: Date;
  };
}

// Helper function to calculate letter grade
function calculateGrade(score: number, maxScore: number): string {
  if (maxScore === 0) return 'N/A';
  
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

// Helper function to calculate category average
function calculateCategoryAverage(students: StudentMark[], category: 'assignments' | 'quizzes' | 'projects'): number {
  const validStudents = students.filter(s => s[category].length > 0);
  if (validStudents.length === 0) return 0;

  const totalScores = validStudents.reduce((sum, student) => {
    const categoryItems = student[category];
    const categoryScores = categoryItems
      .filter((item: any) => (item.grade !== null || item.score !== null))
      .map((item: any) => {
        const score = item.grade ?? item.score ?? 0;
        return (score / item.maxScore) * 100;
      });
    
    const avg = categoryScores.length > 0 
      ? categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length 
      : 0;
      
    return sum + avg;
  }, 0);

  return Number((totalScores / validStudents.length).toFixed(2));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const resolvedParams = await params;
  console.log('Marks API called with courseId:', resolvedParams.courseId);
  
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    console.log('Session check:', { hasSession: !!session, userId: session?.user?.id });
    
    if (!session?.user?.id) {
      console.log('No session found, returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch course with related data in a single query
    console.log('Attempting to fetch course with ID:', resolvedParams.courseId);
    const course = await prisma.course.findUnique({
      where: { id: resolvedParams.courseId },
      include: {
        modules: {
          include: {
            assignments: {
              include: {
                submissions: {
                  where: { status: 'SUBMITTED' },
                  include: {
                    student: true
                  }
                }
              }
            },
            quizzes: {
              include: {
                attempts: {
                  include: {
                    user: true
                  }
                },
                questions: true
              }
            },
            projects: {
              include: {
                submissions: {
                  where: { status: 'SUBMITTED' },
                  include: {
                    student: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        projects: {
          include: {
            submissions: {
              where: { status: 'SUBMITTED' },
              include: {
                student: true
              }
            }
          }
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            user: true
          },
          orderBy: { enrolledAt: 'asc' }
        }
      }
    });

    console.log('Course found:', !!course);
    if (!course) {
      console.log('Course not found with ID:', resolvedParams.courseId);
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify the current user is the course instructor
    if (session.user.id !== course.instructorId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Process student marks
    const studentMarks: StudentMark[] = course.enrollments.map((enrollment: any) => {
      const studentId = enrollment.user.id;
      const studentName = enrollment.user.name || 'Unknown Student';
      const studentEmail = enrollment.user.email || '';

      const studentMark: StudentMark = {
        studentId,
        studentName,
        studentEmail,
        projects: [],
        quizzes: [],
        assignments: [],
        totalScore: 0,
        averageGrade: 0,
        letterGrade: 'N/A'
      };

      // Process assignments
      course.modules.forEach((module: any) => {
        module.assignments.forEach((assignment: any) => {
          const submission = assignment.submissions.find(
            (s: any) => s.student.id === studentId
          );
          
          if (submission) {
            const grade = submission.grade ?? null;
            studentMark.assignments.push({
              id: assignment.id,
              title: assignment.title,
              grade,
              maxScore: assignment.points ?? 0,
              submittedAt: submission.submittedAt,
              gradedAt: submission.gradedAt ?? null
            });
          }
        });

        // Process quizzes
        module.quizzes.forEach((quiz: any) => {
          const attempt = quiz.attempts.find((a: any) => a.user.id === studentId);
          if (attempt) {
            // Calculate max score from quiz questions
            const maxScore = quiz.questions?.reduce((sum: number, q: any) => sum + (q.points || 1), 0) || 100;
            studentMark.quizzes.push({
              id: quiz.id,
              title: quiz.title,
              score: attempt.score,
              maxScore,
              completedAt: attempt.submittedAt
            });
          }
        });

        // Process projects within modules
        module.projects?.forEach((project: any) => {
          const submission = project.submissions.find(
            (s: any) => s.student.id === studentId
          );
          
          if (submission) {
            const grade = submission.grade ?? null;
            studentMark.projects.push({
              id: project.id,
              title: project.title,
              grade,
              maxScore: project.pointsValue ?? 100,
              submittedAt: submission.submittedAt,
              gradedAt: submission.reviewedAt ?? null
            });
          }
        });
      });

      // Process course-level projects (not in modules)
      course.projects?.forEach((project: any) => {
        const submission = project.submissions.find(
          (s: any) => s.student.id === studentId
        );
        
        if (submission) {
          const grade = submission.grade ?? null;
          studentMark.projects.push({
            id: project.id,
            title: project.title,
            grade,
            maxScore: project.pointsValue ?? 100,
            submittedAt: submission.submittedAt,
            gradedAt: submission.reviewedAt ?? null
          });
        }
      });

      // Calculate totals and averages
      const totalScore = studentMark.assignments.reduce(
        (sum, a) => sum + (a.grade ?? 0), 0
      ) + studentMark.quizzes.reduce(
        (sum, q) => sum + (q.score ?? 0), 0
      ) + studentMark.projects.reduce(
        (sum, p) => sum + (p.grade ?? 0), 0
      );

      const totalMaxScore = studentMark.assignments.reduce(
        (sum, a) => sum + a.maxScore, 0
      ) + studentMark.quizzes.reduce(
        (sum, q) => sum + q.maxScore, 0
      ) + studentMark.projects.reduce(
        (sum, p) => sum + p.maxScore, 0
      );

      const averageGrade = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100) 
        : 0;

      studentMark.totalScore = totalScore;
      studentMark.averageGrade = averageGrade;
      studentMark.letterGrade = calculateGrade(averageGrade, 100);

      return studentMark;
    });

    // Calculate class analytics
    const totalStudents = studentMarks.length;
    const totalScores = studentMarks.reduce((sum, s) => sum + s.averageGrade, 0);
    const averageGrade = totalStudents > 0 ? totalScores / totalStudents : 0;

    // Prepare response
    const response: MarksApiResponse = {
      success: true,
      students: studentMarks,
      classAnalytics: {
        totalStudents,
        averageGrade: Number(averageGrade.toFixed(2)),
        gradeDistribution: {
          'A': studentMarks.filter(s => s.averageGrade >= 90).length,
          'B': studentMarks.filter(s => s.averageGrade >= 80 && s.averageGrade < 90).length,
          'C': studentMarks.filter(s => s.averageGrade >= 70 && s.averageGrade < 80).length,
          'D': studentMarks.filter(s => s.averageGrade >= 60 && s.averageGrade < 70).length,
          'F': studentMarks.filter(s => s.averageGrade < 60).length
        },
        assessmentCategories: [
          {
            name: 'Assignments',
            weight: 50,
            averageScore: calculateCategoryAverage(studentMarks, 'assignments'),
            totalAssessments: studentMarks.reduce(
              (sum, s) => sum + s.assignments.length, 0
            ),
            completedAssessments: studentMarks.reduce(
              (sum, s) => sum + s.assignments.filter(a => a.grade !== null).length, 0
            )
          },
          {
            name: 'Quizzes',
            weight: 30,
            averageScore: calculateCategoryAverage(studentMarks, 'quizzes'),
            totalAssessments: studentMarks.reduce(
              (sum, s) => sum + s.quizzes.length, 0
            ),
            completedAssessments: studentMarks.reduce(
              (sum, s) => sum + s.quizzes.filter(q => q.score !== null).length, 0
            )
          },
          {
            name: 'Projects',
            weight: 20,
            averageScore: calculateCategoryAverage(studentMarks, 'projects'),
            totalAssessments: studentMarks.reduce(
              (sum, s) => sum + s.projects.length, 0
            ),
            completedAssessments: studentMarks.reduce(
              (sum, s) => sum + s.projects.filter(p => p.grade !== null).length, 0
            )
          }
        ],
        topPerformers: studentMarks
          .sort((a, b) => b.averageGrade - a.averageGrade)
          .slice(0, 3)
          .map(s => ({
            studentId: s.studentId,
            studentName: s.studentName,
            overallGrade: s.averageGrade,
            letterGrade: s.letterGrade
          })),
        strugglingStudents: studentMarks
          .filter(s => s.averageGrade < 70)
          .sort((a, b) => a.averageGrade - b.averageGrade)
          .slice(0, 5)
          .map(s => ({
            studentId: s.studentId,
            studentName: s.studentName,
            overallGrade: s.averageGrade,
            letterGrade: s.letterGrade,
            issuesCount: [
              ...s.assignments.filter(a => (a.grade ?? 0) < 70),
              ...s.quizzes.filter(q => (q.score ?? 0) < 70),
              ...s.projects.filter(p => (p.grade ?? 0) < 70)
            ].length
          }))
      },
      courseInfo: {
        courseId: resolvedParams.courseId,
        courseName: course.title,
        totalEnrollments: course.enrollments.length,
        lastUpdated: new Date()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/courses/[courseId]/marks:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      courseId: resolvedParams.courseId
    });
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch marks data',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
