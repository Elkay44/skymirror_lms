/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/projects/[projectId]/submit - Submit a project (students only)
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only students can submit projects' }, 
        { status: 403 }
      );
    }
    
    const { projectId } = await params;
    const userId = session.user.id;
    
    // Get submission data from request body
    const { submissionNotes, attachments } = await req.json();
    
    // Verify the project exists and user is enrolled in the course
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            enrollments: {
              where: { 
                userId,
                role: 'STUDENT',
              },
              select: { id: true },
            },
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (!project.course?.enrollments?.length) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }
    
    // Check if there's an existing submission
    const existingSubmission = await prisma.projectSubmission.findFirst({
      where: {
        projectId,
        studentId: userId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
    
    // Create or update the submission
    let submission;
    
    if (existingSubmission) {
      // Resubmit the project
      submission = await prisma.projectSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          submissionNotes,
          attachments,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          updatedAt: new Date(),
          // Reset review fields when resubmitting
          reviewedAt: null,
          reviewerId: null,
          reviewNotes: null,
          grade: null,
        },
      });
    } else {
      // Create a new submission
      submission = await prisma.projectSubmission.create({
        data: {
          projectId,
          studentId: userId,
          courseId: project.course.id,
          submissionNotes,
          attachments,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
    }
    
    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'SUBMITTED',
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      submission,
      message: 'Project submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting project:', error);
    return NextResponse.json(
      { error: 'Failed to submit project' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[projectId]/submit - Get submission history (students only)
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only students can view submission history' }, 
        { status: 403 }
      );
    }
    
    const { projectId } = await params;
    const userId = session.user.id;
    
    // Verify the project exists and user has access to it
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        OR: [
          { authorId: userId },
          { collaborators: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        title: true,
        course: {
          select: {
            id: true,
            title: true,
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get all submissions for this project by the current user
    const submissions = await prisma.projectSubmission.findMany({
      where: {
        projectId,
        studentId: userId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        course: project.course,
      },
      submissions,
    });
  } catch (error) {
    console.error('Error fetching submission history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission history' },
      { status: 500 }
    );
  }
}
