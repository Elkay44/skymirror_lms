/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/projects/submissions/[submissionId]/response - Submit a response to instructor feedback
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { submissionId } = await params;
    const userId = session.user.id;
    
    // Get request body
    const body = await req.json();
    const { response } = body;
    
    if (!response || typeof response !== 'string') {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      );
    }
    
    // Get the submission to check ownership and status
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          select: {
            authorId: true,
            course: {
              select: {
                instructorId: true,
              },
            },
          },
        },
      },
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the student who submitted or an instructor
    const isStudent = submission.studentId === userId;
    const isInstructor = submission.project?.course?.instructorId === userId;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isStudent && !isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to respond to this submission' },
        { status: 403 }
      );
    }
    
    // Update the submission with the response
    const updatedSubmission = await prisma.projectSubmission.update({
      where: { id: submissionId },
      data: {
        studentResponse: response,
        studentRespondedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: 'Response submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}

// GET /api/projects/submissions/[submissionId]/response - Get the response for a submission
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { submissionId } = await params;
    const userId = session.user.id;
    
    // Get the submission with related data
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            authorId: true,
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
              },
            },
          },
        },
      },
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to view this response
    const isStudent = submission.studentId === userId;
    const isInstructor = submission.project?.course?.instructorId === userId;
    const isAdmin = session.user.role === 'ADMIN';
    const isProjectAuthor = submission.project.authorId === userId;
    
    if (!isStudent && !isInstructor && !isAdmin && !isProjectAuthor) {
      return NextResponse.json(
        { error: 'You do not have permission to view this response' },
        { status: 403 }
      );
    }
    
    // Only include the response if it exists and the user has permission
    const responseData = {
      id: submission.id,
      project: {
        id: submission.project.id,
        title: submission.project.title,
      },
      student: {
        id: submission.student.id,
        name: submission.student.name,
        email: submission.student.email,
      },
      reviewer: submission.reviewer ? {
        id: submission.reviewer.id,
        name: submission.reviewer.name,
        email: submission.reviewer.email,
      } : null,
      response: submission.studentResponse,
      respondedAt: submission.studentRespondedAt,
      status: submission.status,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
    };
    
    return NextResponse.json({
      success: true,
      submission: responseData,
    });
  } catch (error) {
    console.error('Error fetching submission response:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission response' },
      { status: 500 }
    );
  }
}
