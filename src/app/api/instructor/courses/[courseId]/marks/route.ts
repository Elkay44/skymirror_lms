import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// TypeScript interfaces for world-class grading system
interface StudentGrade {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentImage?: string;
  enrolledAt: Date;
  
  // Project grades
  projects: {
    projectId: string;
    projectTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
    submittedAt?: Date;
    gradedAt?: Date;
    status: 'submitted' | 'graded' | 'pending' | 'late';
  }[];
  
  // Quiz grades
  quizzes: {
    quizId: string;
    quizTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
    attemptedAt: Date;
    attempts: number;
  }[];
  
  // Assignment grades
  assignments: {
    assignmentId: string;
    assignmentTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
    submittedAt?: Date;
    gradedAt?: Date;
    status: 'submitted' | 'graded' | 'pending' | 'late';
  }[];
  
  // Overall performance
  overallGrade: {
    totalPoints: number;
    maxPoints: number;
    percentage: number;
    letterGrade: string;
    gpa: number;
  };
  
  // Analytics
  analytics: {
    projectsCompleted: number;
    quizzesCompleted: number;
    assignmentsCompleted: number;
    averageScore: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

interface ClassAnalytics {
  totalStudents: number;
  averageGrade: number;
  gradeDistribution: {
    'A': number;
    'B': number;
    'C': number;
    'D': number;
    'F': number;
  };
  assessmentCategories: {
    name: string;
    weight: number;
    averageScore: number;
    totalAssessments: number;
    completedAssessments: number;
  }[];
  recentActivity: {
    studentId: string;
    studentName: string;
    action: string;
    assessmentType: 'project' | 'quiz' | 'assignment';
    assessmentTitle: string;
    score?: number;
    maxScore?: number;
    timestamp: Date;
  }[];
  topPerformers: {
    studentId: string;
    studentName: string;
    overallGrade: number;
  }[];
  strugglingStudents: {
    studentId: string;
    studentName: string;
    overallGrade: number;
    issuesCount: number;
  }[];
}

interface MarksApiResponse {
  success: boolean;
  students: StudentGrade[];
  classAnalytics: ClassAnalytics;
  courseInfo: {
    courseId: string;
    courseName: string;
    totalEnrollments: number;
    lastUpdated: Date;
  };
}

// Validation schema
const paramsSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required')
});

// Helper functions
function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

function calculateGPA(percentage: number): number {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.0;
  if (percentage >= 70) return 2.0;
  if (percentage >= 60) return 1.0;
  return 0.0;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    console.log('📊 Marks API: Starting request processing...');
    
    // Validate parameters
    const { courseId } = await params;
    const validatedParams = paramsSchema.parse({ courseId });
    console.log('✅ Marks API: Parameters validated:', validatedParams);

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ Marks API: Authentication failed - no session');
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const instructorId = session.user.id;
    console.log('👤 Marks API: Authenticated as instructor:', instructorId);

    // Verify course access and fetch comprehensive data
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructorId
      },
      include: {
        enrollments: {
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                email: true,
                image: true,
                createdAt: true
              }
            }
          },
          orderBy: { enrolledAt: 'asc' }
        }
      }
    });

    if (!course) {
      console.log('❌ Marks API: Course not found or access denied');
      return NextResponse.json(
        { 
          success: false,
          error: 'Course not found or access denied',
          code: 'COURSE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    console.log('📚 Marks API: Found course with', course.enrollments.length, 'students');

    // Get all student IDs for efficient querying
    const studentIds = course.enrollments.map(e => e.userId);
    
    // Fetch project marks and submissions in parallel
    const [projectMarks, projectSubmissions, quizAttempts, assignmentSubmissions] = await Promise.all([
      // Project marks from ProjectMark model (if available)
      (async () => {
        try {
          return await (prisma as any).projectMark.findMany({
            where: {
              project: { courseId },
              studentId: { in: studentIds }
            },
            include: {
              project: {
                select: { id: true, title: true, pointsValue: true, dueDate: true }
              },
              submission: {
                select: { id: true, status: true, submittedAt: true }
              }
            }
          });
        } catch (error) {
          console.log('⚠️ ProjectMark model not available, using fallback');
          return [];
        }
      })(),
      
      // Project submissions (fallback)
      prisma.projectSubmission.findMany({
        where: {
          project: { courseId },
          studentId: { in: studentIds }
        },
        include: {
          project: {
            select: { id: true, title: true, pointsValue: true, dueDate: true }
          }
        }
      }),
      
      // Quiz attempts
      prisma.quizAttempt.findMany({
        where: {
          quiz: { module: { courseId } },
          userId: { in: studentIds },
          status: 'COMPLETED'
        },
        include: {
          quiz: {
            select: { id: true, title: true, maxScore: true }
          }
        },
        orderBy: { completedAt: 'desc' }
      }),
      
      // Assignment submissions
      prisma.assignmentSubmission.findMany({
        where: {
          assignment: { module: { courseId } },
          userId: { in: studentIds }
        },
        include: {
          assignment: {
            select: { id: true, title: true, points: true, dueDate: true }
          }
        }
      })
    ]);

    console.log('📊 Marks API: Fetched data - ProjectMarks:', projectMarks.length, 'Submissions:', projectSubmissions.length, 'Quizzes:', quizAttempts.length, 'Assignments:', assignmentSubmissions.length);

    // Calculate grades for each student
    const studentsWithGrades: StudentGrade[] = course.enrollments.map(enrollment => {
      const student = enrollment.user;
      const studentId = student.id;

      // Get student's project grades (prioritize ProjectMark over submissions)
      const studentProjectMarks = projectMarks.filter((mark: any) => mark.studentId === studentId);
      const studentProjectSubmissions = projectSubmissions.filter(s => s.studentId === studentId);
      
      const projects = studentProjectMarks.length > 0 
        ? studentProjectMarks.map((mark: any) => ({
            projectId: mark.project.id,
            projectTitle: mark.project.title,
            score: mark.score || 0,
            maxScore: mark.project.pointsValue || 10,
            percentage: mark.score ? Math.round((mark.score / (mark.project.pointsValue || 10)) * 100) : 0,
            grade: calculateLetterGrade(mark.score ? Math.round((mark.score / (mark.project.pointsValue || 10)) * 100) : 0),
            submittedAt: mark.submission?.submittedAt,
            gradedAt: mark.gradedAt,
            status: mark.submission?.status === 'APPROVED' ? 'graded' as const : 'pending' as const
          }))
        : studentProjectSubmissions.map((s: any) => ({
            projectId: s.project.id,
            projectTitle: s.project.title,
            score: s.grade || 0,
            maxScore: s.project.pointsValue || 10,
            percentage: s.grade ? Math.round((s.grade / (s.project.pointsValue || 10)) * 100) : 0,
            grade: calculateLetterGrade(s.grade ? Math.round((s.grade / (s.project.pointsValue || 10)) * 100) : 0),
            submittedAt: s.submittedAt || undefined,
            gradedAt: s.reviewedAt || undefined,
            status: s.status === 'GRADED' ? 'graded' as const : 'pending' as const
          }));

      // Get student's quiz grades
      const studentQuizAttempts = quizAttempts.filter(q => q.userId === studentId);
      const quizzes = studentQuizAttempts.map(q => ({
        quizId: q.quiz.id,
        quizTitle: q.quiz.title,
        score: q.score || 0,
        maxScore: q.quiz.maxScore || 10,
        percentage: Math.round(((q.score || 0) / (q.quiz.maxScore || 10)) * 100),
        grade: calculateLetterGrade(Math.round(((q.score || 0) / (q.quiz.maxScore || 10)) * 100)),
        attemptedAt: q.completedAt,
        attempts: 1 // TODO: Calculate actual attempts
      }));

      // Get student's assignment grades
      const studentAssignmentSubmissions = assignmentSubmissions.filter((a: any) => a.userId === studentId);
      const assignments = studentAssignmentSubmissions.map((a: any) => ({
        assignmentId: a.assignment.id,
        assignmentTitle: a.assignment.title,
        score: a.grade || 0,
        maxScore: a.assignment.points || 10,
        percentage: a.grade ? Math.round((a.grade / (a.assignment.points || 10)) * 100) : 0,
        grade: calculateLetterGrade(a.grade ? Math.round((a.grade / (a.assignment.points || 10)) * 100) : 0),
        submittedAt: a.submittedAt || undefined,
        gradedAt: a.gradedAt || undefined,
        status: a.status === 'GRADED' ? 'graded' as const : 'pending' as const
      }));

      // Calculate overall grade
      const allScores = [
        ...projects.map((p: any) => ({ score: p.score, maxScore: p.maxScore })),
        ...quizzes.map((q: any) => ({ score: q.score, maxScore: q.maxScore })),
        ...assignments.map((a: any) => ({ score: a.score, maxScore: a.maxScore }))
      ];

      const totalPoints = allScores.reduce((sum, item) => sum + item.score, 0);
      const maxPoints = allScores.reduce((sum, item) => sum + item.maxScore, 0);
      const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

      return {
        studentId,
        studentName: student.name || 'Unknown Student',
        studentEmail: student.email || '',
        studentImage: student.image || undefined,
        enrolledAt: enrollment.enrolledAt,
        projects,
        quizzes,
        assignments,
        overallGrade: {
          totalPoints,
          maxPoints,
          percentage,
          letterGrade: calculateLetterGrade(percentage),
          gpa: calculateGPA(percentage)
        },
        analytics: {
          projectsCompleted: projects.filter((p: any) => p.status === 'graded').length,
          quizzesCompleted: quizzes.length,
          assignmentsCompleted: assignments.filter((a: any) => a.status === 'graded').length,
          averageScore: percentage,
          trend: 'stable' as const // TODO: Calculate actual trend
        }
      };
    });

    // Calculate class analytics
    const totalStudents = studentsWithGrades.length;
    const classAverage = totalStudents > 0 
      ? Math.round(studentsWithGrades.reduce((sum, s) => sum + s.overallGrade.percentage, 0) / totalStudents)
      : 0;

    const gradeDistribution = studentsWithGrades.reduce((dist, student) => {
      const grade = student.overallGrade.letterGrade as keyof typeof dist;
      dist[grade] = (dist[grade] || 0) + 1;
      return dist;
    }, { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 });

    // Recent activity (last 10 activities)
    const recentActivity = [
      ...projectMarks.slice(0, 5).map((mark: any) => ({
        studentId: mark.studentId,
        studentName: studentsWithGrades.find(s => s.studentId === mark.studentId)?.studentName || 'Unknown',
        action: 'Project graded',
        assessmentType: 'project' as const,
        assessmentTitle: mark.project.title,
        score: mark.score,
        maxScore: mark.project.pointsValue,
        timestamp: mark.gradedAt || mark.createdAt
      })),
      ...quizAttempts.slice(0, 5).map(attempt => ({
        studentId: attempt.userId,
        studentName: studentsWithGrades.find(s => s.studentId === attempt.userId)?.studentName || 'Unknown',
        action: 'Quiz completed',
        assessmentType: 'quiz' as const,
        assessmentTitle: attempt.quiz.title,
        score: attempt.score,
        maxScore: attempt.quiz.maxScore,
        timestamp: attempt.completedAt
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    const response: MarksApiResponse = {
      success: true,
      students: studentsWithGrades,
      classAnalytics: {
        totalStudents,
        averageGrade: classAverage,
        gradeDistribution,
        assessmentCategories: [
          {
            name: 'Projects',
            weight: 50,
            averageScore: Math.round(studentsWithGrades.reduce((sum, s) => 
              sum + (s.projects.reduce((pSum, p) => pSum + p.percentage, 0) / Math.max(s.projects.length, 1)), 0
            ) / Math.max(totalStudents, 1)),
            totalAssessments: studentsWithGrades.reduce((sum, s) => sum + s.projects.length, 0),
            completedAssessments: studentsWithGrades.reduce((sum, s) => sum + s.analytics.projectsCompleted, 0)
          },
          {
            name: 'Quizzes',
            weight: 30,
            averageScore: Math.round(studentsWithGrades.reduce((sum, s) => 
              sum + (s.quizzes.reduce((qSum, q) => qSum + q.percentage, 0) / Math.max(s.quizzes.length, 1)), 0
            ) / Math.max(totalStudents, 1)),
            totalAssessments: studentsWithGrades.reduce((sum, s) => sum + s.quizzes.length, 0),
            completedAssessments: studentsWithGrades.reduce((sum, s) => sum + s.analytics.quizzesCompleted, 0)
          },
          {
            name: 'Assignments',
            weight: 20,
            averageScore: Math.round(studentsWithGrades.reduce((sum, s) => 
              sum + (s.assignments.reduce((aSum, a) => aSum + a.percentage, 0) / Math.max(s.assignments.length, 1)), 0
            ) / Math.max(totalStudents, 1)),
            totalAssessments: studentsWithGrades.reduce((sum, s) => sum + s.assignments.length, 0),
            completedAssessments: studentsWithGrades.reduce((sum, s) => sum + s.analytics.assignmentsCompleted, 0)
          }
        ],
        recentActivity,
        topPerformers: studentsWithGrades
          .sort((a, b) => b.overallGrade.percentage - a.overallGrade.percentage)
          .slice(0, 5)
          .map(s => ({
            studentId: s.studentId,
            studentName: s.studentName,
            overallGrade: s.overallGrade.percentage
          })),
        strugglingStudents: studentsWithGrades
          .filter(s => s.overallGrade.percentage < 70)
          .sort((a, b) => a.overallGrade.percentage - b.overallGrade.percentage)
          .slice(0, 5)
          .map(s => ({
            studentId: s.studentId,
            studentName: s.studentName,
            overallGrade: s.overallGrade.percentage,
            issuesCount: (s.projects.filter(p => p.status === 'pending').length + 
                        s.assignments.filter(a => a.status === 'pending').length)
          }))
      },
      courseInfo: {
        courseId,
        courseName: course.title,
        totalEnrollments: totalStudents,
        lastUpdated: new Date()
      }
    };

    console.log('✅ Marks API: Successfully processed', totalStudents, 'students');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Marks API: Error processing request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
