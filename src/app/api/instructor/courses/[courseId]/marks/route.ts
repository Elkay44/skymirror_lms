import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify the course belongs to this instructor
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructorId: userId 
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have access to it' },
        { status: 404 }
      );
    }

    // Get all enrolled students with their project submissions and grades
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get all projects for the course to calculate grades
    const projects = await prisma.project.findMany({
      where: { courseId },
      select: { id: true, title: true, pointsValue: true },
      orderBy: { createdAt: 'asc' } // Ensure consistent ordering
    });

    // Get project marks from ProjectMark model
    let projectMarks = [];
    try {
      projectMarks = await (prisma as any).projectMark.findMany({
        where: {
          project: { courseId },
          studentId: { in: enrollments.map(e => e.userId) }
        },
        include: {
          project: {
            select: { id: true, title: true, pointsValue: true }
          },
          submission: {
            select: { id: true, status: true, submittedAt: true }
          },
          instructor: {
            select: { id: true, name: true }
          }
        }
      });
      console.log('Found project marks:', projectMarks.length);
    } catch (error) {
      console.error('Error fetching project marks:', error);
      projectMarks = [];
    }

    // Get all project submissions for enrolled students (for fallback)
    const projectSubmissions = await prisma.projectSubmission.findMany({
      where: {
        project: { courseId },
        studentId: { in: enrollments.map(e => e.userId) },
        status: { in: ['APPROVED', 'GRADED'] } // Only count approved/graded submissions
      },
      include: {
        project: {
          select: { id: true, title: true, pointsValue: true }
        }
      }
    });

    // Get quiz attempts for enrolled students
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: { module: { courseId } },
        userId: { in: enrollments.map(e => e.userId) },
        status: 'COMPLETED'
      },
      select: {
        userId: true,
        score: true,
        quiz: {
          select: { id: true, title: true, maxScore: true }
        }
      }
    });

    // Calculate grades for each student
    const studentsWithGrades = enrollments.map((enrollment) => {
      const studentId = enrollment.user.id;
      
      // Get all project marks for this student
      const studentProjectMarks = projectMarks.filter((m: any) => m.studentId === studentId);
      
      // Get all project submissions for this student (fallback)
      const submissions = projectSubmissions.filter(s => s.studentId === studentId);
      
      // Calculate project grades (prefer ProjectMark data over submission grades)
      let projectGrades: number[] = [];
      let projectGradesList: any[] = [];
      
      if (studentProjectMarks.length > 0) {
        // Use ProjectMark data (preferred)
        console.log(`Student ${studentId} has ${studentProjectMarks.length} project marks`);
        projectGrades = studentProjectMarks
          .map((m: any) => m.grade)
          .filter((grade: number | null | undefined) => grade !== null && grade !== undefined);
        
        projectGradesList = studentProjectMarks.map((m: any) => ({
          projectId: m.project.id,
          title: m.project.title,
          grade: m.grade,
          letterGrade: m.letterGrade || 'N/A',
          feedback: m.feedback || '',
          markedAt: m.markedAt,
          pointsValue: m.project.pointsValue || 100
        }));
      } else {
        // Fallback to submission grades
        console.log(`Student ${studentId} has no project marks, using ${submissions.length} submissions`);
        projectGrades = submissions
          .filter(s => s.grade !== null && s.grade !== undefined)
          .map(s => (s.grade || 0));
        
        projectGradesList = submissions
          .filter(s => s.grade !== null && s.grade !== undefined)
          .map(s => ({
            projectId: s.project.id,
            title: s.project.title,
            grade: s.grade,
            letterGrade: 'N/A',
            feedback: '',
            markedAt: s.submittedAt,
            pointsValue: s.project.pointsValue || 100
          }));
      }
      
      const projectAverage = projectGrades.length > 0 
        ? projectGrades.reduce((sum: number, grade: number) => sum + grade, 0) / projectGrades.length 
        : 0;
      
      console.log(`Student ${studentId} project average: ${projectAverage} from ${projectGrades.length} grades`);

      // Get quiz attempts for this student
      const studentQuizAttempts = quizAttempts.filter(q => q.userId === studentId);
      
      // Calculate quiz average
      const quizScores = studentQuizAttempts
        .map(q => (q.score / (q.quiz.maxScore || 100)) * 100);
      
      const quizAverage = quizScores.length > 0
        ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
        : 0;

      // Calculate overall average (weighted 60% projects, 40% quizzes)
      const hasProjects = projectGrades.length > 0;
      const hasQuizzes = quizScores.length > 0;
      
      let total = 0;
      if (hasProjects && hasQuizzes) {
        total = (projectAverage * 0.6) + (quizAverage * 0.4);
      } else if (hasProjects) {
        total = projectAverage;
      } else if (hasQuizzes) {
        total = quizAverage;
      }

      // Determine letter grade
      let letterGrade = 'N/A';
      if (total > 0) {
        if (total >= 90) letterGrade = 'A';
        else if (total >= 85) letterGrade = 'B+';
        else if (total >= 80) letterGrade = 'B';
        else if (total >= 75) letterGrade = 'C+';
        else if (total >= 70) letterGrade = 'C';
        else if (total >= 65) letterGrade = 'D+';
        else if (total >= 60) letterGrade = 'D';
        else letterGrade = 'F';
      }

      // Format project grades by project
      const projectGradesList = projects.map(project => {
        const submission = submissions.find(s => s.project.id === project.id);
        return {
          projectId: project.id,
          title: project.title,
          grade: submission?.grade ?? null,
          status: submission?.status ?? 'NOT_SUBMITTED'
        };
      });

      // Format quiz grades by quiz
      const quizGrades = studentQuizAttempts.map(attempt => ({
        quizId: attempt.quiz.id,
        title: attempt.quiz.title,
        score: attempt.score,
        maxScore: attempt.quiz.maxScore || 100,
        percentage: Math.round((attempt.score / (attempt.quiz.maxScore || 100)) * 1000) / 10
      }));

      return {
        id: enrollment.user.id,
        userId: enrollment.userId,
        name: enrollment.user.name || 'Unknown Student',
        email: enrollment.user.email,
        projects: projectGradesList,
        quizzes: quizGrades,
        projectAverage: hasProjects ? Math.round(projectAverage * 10) / 10 : null,
        quizAverage: hasQuizzes ? Math.round(quizAverage * 10) / 10 : null,
        total: Math.round(total * 10) / 10, // Round to 1 decimal place
        grade: letterGrade,
        lastActive: enrollment.updatedAt.toISOString()
      };
    });

    // Calculate class average
    const validTotals = studentsWithGrades.filter(s => s.total > 0).map(s => s.total);
    const classAverage = validTotals.length > 0 
      ? validTotals.reduce((sum, total) => sum + total, 0) / validTotals.length 
      : 0;

    return NextResponse.json({
      students: studentsWithGrades,
      classAverage: Math.round(classAverage * 10) / 10,
      totalStudents: studentsWithGrades.length,
    });
  } catch (error) {
    console.error('Error fetching course marks:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      courseId
    });
    return NextResponse.json(
      { error: 'Failed to fetch marks data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
