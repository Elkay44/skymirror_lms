import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/projects/submissions/[submissionId]/response - Submit a response to instructor feedback
export async function POST(req: NextRequest, { params }: { params: { submissionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { submissionId } = params;
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
          include: {
            course: {
              select: {
                instructorId: true
              }
            }
          }
        }
      }
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the submission owner
    if (submission.studentId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to respond to this submission' },
        { status: 403 }
      );
    }
    
    // Check if the submission status allows for a response (should be REVISION_REQUESTED)
    if (submission.status !== 'REVISION_REQUESTED') {
      return NextResponse.json(
        { error: 'Can only respond to submissions that require revisions' },
        { status: 400 }
      );
    }
    
    // Create or update the student response
    // Use lowercase to match Prisma's generated client naming convention
    const studentResponse = await prisma.submissionResponse.upsert({
      where: {
        submissionId
      },
      update: {
        content: response,
        updatedAt: new Date()
      },
      create: {
        submissionId,
        content: response,
        studentId: userId,
        isRead: false
      }
    });
    
    // Notify the instructor about the student's response
    const instructorId = submission.project.course.instructorId;
    
    if (instructorId) {
      await prisma.notification.create({
        data: {
          userId: instructorId,
          type: 'SUBMISSION_RESPONSE',
          title: 'Student Responded to Feedback',
          message: `A student has responded to your feedback on the project submission: ${submission.project.title}`,
          linkUrl: `/dashboard/instructor/projects/submissions/${submissionId}`,
          isRead: false
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      response: studentResponse
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
export async function GET(req: NextRequest, { params }: { params: { submissionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { submissionId } = params;
    const userId = session.user.id;
    const role = session.user.role;
    
    // Get the submission to check access permissions
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            course: {
              select: {
                instructorId: true
              }
            }
          }
        }
      }
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to view this response
    const canView = 
      // Student who submitted
      submission.studentId === userId ||
      // Instructor of the course
      (role === 'INSTRUCTOR' && submission.project.course.instructorId === userId) ||
      // Admin can view all
      role === 'ADMIN';
    
    if (!canView) {
      return NextResponse.json(
        { error: 'Not authorized to view this response' },
        { status: 403 }
      );
    }
    
    // Get the response
    const responseData = await prisma.submissionResponse.findUnique({
      where: { submissionId }
    });
    
    return NextResponse.json({ response: responseData });
  } catch (error) {
    console.error('Error fetching response:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    );
  }
}
