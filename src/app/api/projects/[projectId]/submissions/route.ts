/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/[projectId]/submissions - Get all submissions for a project
export async function GET(
  _req: Request, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { projectId } = await params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true
          }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check user permissions
    const userRole = session.user.role;
    const isInstructor = project.course.instructorId === userId;
    const isStudent = userRole === 'STUDENT';
    const isAdmin = userRole === 'ADMIN';
    
    // Check if student is enrolled
    if (isStudent) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: project.courseId,
          status: 'ACTIVE'
        }
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You are not enrolled in this course' },
          { status: 403 }
        );
      }
    }
    
    if (!isInstructor && !isStudent && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get submissions - students only see their own, others see all
    const submissions = await prisma.projectSubmission.findMany({
      where: {
        projectId: projectId,
        ...(isStudent ? { studentId: userId } : {})
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    // Return the submissions data
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        courseId: project.courseId,
        courseTitle: project.course.title,
      },
      submissions: submissions.map(sub => ({
        id: sub.id,
        projectId: sub.projectId,
        student: sub.student,
        status: sub.status,
        grade: sub.grade,
        feedback: sub.feedback,
        submittedAt: sub.submittedAt,
        reviewedAt: sub.reviewedAt,
        submissionUrl: sub.submissionUrl,
        submissionText: sub.submissionText,
        submissionFiles: sub.submissionFiles,
        type: 'file' // Default type for now
      })),
    });
  } catch (error) {
    console.error('Error fetching project submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project submissions' },
      { status: 500 }
    );
  }
}
