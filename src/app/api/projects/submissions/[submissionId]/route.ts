import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/submissions/[submissionId] - Get a specific submission
export async function GET(req: NextRequest, { params }: { params: { submissionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { submissionId } = params;
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
                instructorId: true
              }
            },
            rubric: {
              include: {
                criteria: {
                  include: {
                    levels: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        assessment: {
          include: {
            criteriaScores: true
          }
        }
      }
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    // Check if user has permission to view this submission
    const canView = 
      // Submitter can view their own submission
      submission.studentId === userId ||
      // Instructor of the course can view
      (role === 'INSTRUCTOR' && submission.project.course.instructorId === userId) ||
      // Admin can view all submissions
      role === 'ADMIN' ||
      // Mentor of the student can view (would need to check mentorship relationship)
      (role === 'MENTOR' && await checkMentorAccess(userId, submission.studentId));
    
    if (!canView) {
      return NextResponse.json({ error: 'Not authorized to view this submission' }, { status: 403 });
    }
    
    // If the user is the instructor and the submission is in SUBMITTED status,
    // automatically update it to REVIEWING
    if (role === 'INSTRUCTOR' && 
        submission.project.course.instructorId === userId &&
        submission.status === 'SUBMITTED') {
      
      await prisma.projectSubmission.update({
        where: { id: submissionId },
        data: { status: 'REVIEWING' }
      });
      
      // Update the submission object to reflect the new status
      submission.status = 'REVIEWING';
    }
    
    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

// Helper function to check if a mentor has access to a student's submissions
async function checkMentorAccess(mentorUserId: string, studentUserId: string): Promise<boolean> {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId }
  });
  
  if (!mentorProfile) return false;
  
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId }
  });
  
  if (!studentProfile) return false;
  
  const mentorship = await prisma.mentorship.findFirst({
    where: {
      mentorId: mentorProfile.id,
      studentId: studentProfile.id,
      status: 'ACTIVE'
    }
  });
  
  return !!mentorship;
}
