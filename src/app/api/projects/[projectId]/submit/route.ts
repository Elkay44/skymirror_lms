/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/projects/[projectId]/submit - Submit a project (students only)
export async function POST(
  req: Request, 
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
    
    // Handle different content types (form data for files, JSON for text/code)
    let submissionData: any = {};
    let files: File[] = [];
    
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle file uploads
      const formData = await req.formData();
      const type = formData.get('type') as string;
      
      if (type === 'file') {
        const fileCount = parseInt(formData.get('fileCount') as string || '0');
        for (let i = 0; i < fileCount; i++) {
          const file = formData.get(`file_${i}`) as File;
          if (file) files.push(file);
        }
        submissionData = {
          type: 'file',
          fileCount: files.length,
          fileNames: files.map(f => f.name),
          fileSizes: files.map(f => f.size)
        };
      } else if (type === 'code') {
        submissionData = {
          type: 'code',
          repositoryUrl: formData.get('repositoryUrl') as string,
          commitHash: formData.get('commitHash') as string,
          branch: formData.get('branch') as string || 'main'
        };
      } else if (type === 'text') {
        submissionData = {
          type: 'text',
          submissionText: formData.get('submissionText') as string
        };
      }
    } else {
      // Handle JSON data (legacy support)
      const { submissionNotes, attachments } = await req.json();
      submissionData = { submissionNotes, attachments, type: 'legacy' };
    }
    
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
                status: 'ACTIVE'
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
          submissionText: submissionData.type === 'text' ? submissionData.submissionText : null,
          submissionFiles: files.length > 0 ? JSON.stringify(files.map(f => ({ name: f.name, size: f.size }))) : JSON.stringify(submissionData),
          status: 'SUBMITTED',
          submittedAt: new Date(),
          updatedAt: new Date(),
          // Reset review fields when resubmitting
          reviewedAt: null,
          reviewerId: null,
          feedback: null,
          grade: null,
        },
      });
    } else {
      // Create a new submission
      submission = await prisma.projectSubmission.create({
        data: {
          projectId,
          studentId: userId,
          submissionText: submissionData.type === 'text' ? submissionData.submissionText : null,
          submissionFiles: files.length > 0 ? JSON.stringify(files.map(f => ({ name: f.name, size: f.size }))) : JSON.stringify(submissionData),
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
    }
    
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
  _req: Request, 
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
