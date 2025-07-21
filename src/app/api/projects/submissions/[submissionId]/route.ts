/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/submissions/[submissionId] - Get a specific submission
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
    const role = session.user.role;
    
    // Get submission with project and student info
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
                enrollments: {
                  where: { userId },
                  select: { role: true },
                },
              },
            },
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
    
    // Check if user has permission to view this submission
    const isStudent = submission.studentId === userId;
    const isInstructor = submission.project.course.instructorId === userId;
    const isAdmin = role === 'ADMIN';
    const isProjectAuthor = submission.project.authorId === userId;
    const isEnrolled = submission.project.course.enrollments.length > 0;
    
    // If user is a mentor, check if they have access to this student
    let isMentor = false;
    if (role === 'MENTOR' && !isInstructor && !isAdmin) {
      isMentor = await checkMentorAccess(userId, submission.studentId);
    }
    
    if (!isStudent && !isInstructor && !isAdmin && !isProjectAuthor && !isMentor && !isEnrolled) {
      return NextResponse.json(
        { error: 'You do not have permission to view this submission' },
        { status: 403 }
      );
    }
    
    // Format the response
    const response = {
      id: submission.id,
      project: {
        id: submission.project.id,
        title: submission.project.title,
        author: submission.project.author,
        course: {
          id: submission.project.course.id,
          title: submission.project.course.title,
        },
      },
      student: submission.student,
      submissionNotes: submission.submissionNotes,
      attachments: submission.attachments || [],
      status: submission.status,
      grade: submission.grade,
      reviewNotes: submission.reviewNotes,
      studentResponse: submission.studentResponse,
      studentRespondedAt: submission.studentRespondedAt,
      reviewer: submission.reviewer,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if a mentor has access to a student's submissions
 */
async function checkMentorAccess(mentorUserId: string, studentUserId: string): Promise<boolean> {
  try {
    // Check if the mentor is assigned to the student in any course
    const mentorAssignment = await prisma.mentorAssignment.findFirst({
      where: {
        mentorId: mentorUserId,
        studentId: studentUserId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });
    
    return !!mentorAssignment;
  } catch (error) {
    console.error('Error checking mentor access:', error);
    return false;
  }
}
