import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/projects/submissions/[submissionId]/review - Review a project submission (instructors and mentors)
export async function POST(req: NextRequest, { params }: { params: { submissionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and mentors can review submissions
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Only instructors and mentors can review project submissions' }, { status: 403 });
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
                instructorId: true
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            studentProfile: true
          }
        }
      }
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    // Check if user has permission to review this submission
    if (role === 'INSTRUCTOR') {
      // Instructors can only review submissions for their courses
      if (submission.project.course.instructorId !== userId) {
        return NextResponse.json({ error: 'Not authorized to review this submission' }, { status: 403 });
      }
    } else if (role === 'MENTOR') {
      // Mentors can only review submissions from their mentees
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId }
      });
      
      if (!mentorProfile) {
        return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
      }
      
      const mentorship = await prisma.mentorship.findFirst({
        where: {
          mentorId: mentorProfile.id,
          studentId: submission.student.studentProfile?.id,
          status: 'ACTIVE'
        }
      });
      
      if (!mentorship) {
        return NextResponse.json({ error: 'Not authorized to review this mentee\'s submission' }, { status: 403 });
      }
    }
    
    // Parse request body
    const body = await req.json();
    const { feedback, grade, status } = body;
    
    // Validate input
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback is required' }, { status: 400 });
    }
    
    // According to the schema, status can be: SUBMITTED, REVIEWING, APPROVED, REJECTED, REVISION_REQUESTED
    if (status && !['REVIEWING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value. Must be REVIEWING, APPROVED, REJECTED, or REVISION_REQUESTED' }, { status: 400 });
    }
    
    if (grade !== undefined && (grade < 0 || grade > 100)) {
      return NextResponse.json({ error: 'Grade must be between 0 and 100' }, { status: 400 });
    }
    
    // Update submission with review
    const updatedSubmission = await prisma.projectSubmission.update({
      where: { id: submissionId },
      data: {
        feedback,
        grade: grade !== undefined ? grade : undefined,
        status: status || 'REVIEWING',
        reviewerId: userId,
        reviewedAt: new Date()
      }
    });
    
    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        title: 'Project Feedback Received',
        message: `Your project "${submission.project.title}" has been reviewed.`,
        type: 'PROJECT_FEEDBACK',
        linkUrl: `/courses/${submission.project.courseId}/projects/${submission.projectId}`
      }
    });
    
    // If project is approved, update user stats and check for achievements
    if (status === 'APPROVED') {
      // Award points for completing a project
      await prisma.user.update({
        where: { id: submission.studentId },
        data: {
          points: { increment: 50 } // Award more points for approved projects
        }
      });
      
      // Check if this makes the student eligible for a certificate
      if (submission.project.isRequiredForCertification) {
        const completedProjects = await prisma.projectSubmission.count({
          where: {
            status: 'APPROVED',
            studentId: submission.studentId,
            project: {
              courseId: submission.project.courseId,
              isRequiredForCertification: true
            }
          }
        });
        
        const totalRequiredProjects = await prisma.project.count({
          where: {
            courseId: submission.project.courseId,
            isRequiredForCertification: true
          }
        });
        
        // If all required projects are completed, create a certificate
        if (completedProjects === totalRequiredProjects) {
          await prisma.certification.create({
            data: {
              courseId: submission.project.courseId,
              studentId: submission.studentId,
              issuerId: userId,
              projectSubmissions: {
                connect: {
                  id: submissionId
                }
              }
            }
          });
          
          // Create notification for certificate
          await prisma.notification.create({
            data: {
              userId: submission.studentId,
              title: 'Course Certificate Earned',
              message: `You've earned a certificate for completing all required projects in the course.`,
              type: 'CERTIFICATE_EARNED',
              linkUrl: `/dashboard/student/certificates`
            }
          });
        }
      }
    }
    
    return NextResponse.json({ 
      submission: updatedSubmission,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return NextResponse.json({ error: 'Failed to review submission' }, { status: 500 });
  }
}
