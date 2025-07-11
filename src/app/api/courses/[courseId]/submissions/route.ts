import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'approved';
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user is an instructor
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      include: { role: true },
    });
    
    if (!user || user.role.name !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: User is not an instructor' }, { status: 403 });
    }
    
    // Check if the course belongs to the instructor
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        instructorId: user.id,
      },
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or not authorized' }, { status: 404 });
    }
    
    // Get all projects for this course
    const courseProjects = await prisma.project.findMany({
      where: {
        courseId,
        isRequired: true,  // Only get required projects for certification
      },
      select: {
        id: true,
      },
    });
    
    const projectIds = courseProjects.map(project => project.id);
    
    // Get students who have completed all required projects
    const eligibleStudents = await prisma.user.findMany({
      where: {
        role: {
          name: 'student',
        },
        projectSubmissions: {
          some: {
            projectId: {
              in: projectIds,
            },
            status,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        projectSubmissions: {
          where: {
            projectId: {
              in: projectIds,
            },
            status,
          },
          select: {
            id: true,
            projectId: true,
            status: true,
            submittedAt: true,
            project: {
              select: {
                id: true,
                title: true,
                courseId: true,
              },
            },
          },
        },
        certificates: {
          where: {
            courseId,
          },
          select: {
            id: true,
          },
        },
      },
    });
    
    // Filter students who have completed all required projects but don't have a certificate yet
    const submissions = [];
    
    for (const student of eligibleStudents) {
      // Skip students who already have a certificate
      if (student.certificates.length > 0) continue;
      
      // Check if the student has completed all required projects
      const completedProjectIds = student.projectSubmissions.map(submission => submission.projectId);
      const hasCompletedAllProjects = projectIds.every(projectId => completedProjectIds.includes(projectId));
      
      if (hasCompletedAllProjects) {
        // For each completed project, add a submission entry for this student
        student.projectSubmissions.forEach(submission => {
          submissions.push({
            id: submission.id,
            studentId: student.id,
            projectId: submission.projectId,
            status: submission.status,
            submittedAt: submission.submittedAt,
            student: {
              id: student.id,
              name: student.name,
              email: student.email,
              walletAddress: student.walletAddress,
            },
            project: submission.project,
          });
        });
      }
    }
    
    // Sort submissions by student name and date
    submissions.sort((a, b) => {
      // First sort by student name
      if (a.student.name < b.student.name) return -1;
      if (a.student.name > b.student.name) return 1;
      
      // Then sort by submission date (newest first)
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching course submissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
