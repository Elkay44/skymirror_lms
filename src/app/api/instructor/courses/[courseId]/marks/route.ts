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

    // Get project submissions for grade calculations
    const projectSubmissions = await prisma.projectSubmission.findMany({
      where: {
        project: {
          courseId: courseId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            pointsValue: true,
          },
        },
      },
    });

    // Calculate grades for each student
    const studentsWithGrades = enrollments.map((enrollment) => {
      const studentSubmissions = projectSubmissions.filter(
        (sub) => sub.user.id === enrollment.user.id
      );

      // Calculate project grades (simplified - using grade field if available)
      const project1Grade = studentSubmissions.find(s => s.project.title.toLowerCase().includes('project 1'))?.grade || null;
      const project2Grade = studentSubmissions.find(s => s.project.title.toLowerCase().includes('project 2'))?.grade || null;
      const quiz1Grade = null; // TODO: Implement quiz grades when quiz system is ready

      // Calculate total grade (average of available grades)
      const grades = [project1Grade, project2Grade, quiz1Grade].filter(g => g !== null) as number[];
      const total = grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0;

      // Determine letter grade
      let letterGrade = 'N/A';
      if (total >= 90) letterGrade = 'A';
      else if (total >= 85) letterGrade = 'B+';
      else if (total >= 80) letterGrade = 'B';
      else if (total >= 75) letterGrade = 'C+';
      else if (total >= 70) letterGrade = 'C';
      else if (total >= 65) letterGrade = 'D+';
      else if (total >= 60) letterGrade = 'D';
      else if (total > 0) letterGrade = 'F';

      return {
        id: enrollment.user.id,
        name: enrollment.user.name || 'Unknown Student',
        email: enrollment.user.email,
        project1: project1Grade,
        project2: project2Grade,
        quiz1: quiz1Grade,
        total: Math.round(total * 10) / 10, // Round to 1 decimal place
        grade: letterGrade,
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
    return NextResponse.json(
      { error: 'Failed to fetch marks data' },
      { status: 500 }
    );
  }
}
