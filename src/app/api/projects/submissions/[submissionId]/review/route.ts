/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/projects/submissions/[submissionId]/review - Review a project submission (instructors and mentors)
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
    
    // Only instructors and mentors can review submissions
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Only instructors and mentors can review project submissions' }, 
        { status: 403 }
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
                  where: { 
                    userId,
                    role: { in: ['INSTRUCTOR', 'MENTOR'] },
                  },
                  select: { id: true, role: true },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
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
    
    // Check if the user is the course instructor or an assigned mentor
    const isInstructor = submission.project.course.instructorId === userId;
    const isAssignedMentor = submission.project.course.enrollments.some(
      (e: { role: string; id: string }) => e.role === 'MENTOR' && e.id === userId
    );
    
    if (!isInstructor && !isAssignedMentor) {
      return NextResponse.json(
        { error: 'You are not authorized to review this submission' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { status, grade, notes } = body;
    
    // Validate request body
    if (!status || !['APPROVED', 'REJECTED', 'NEEDS_REVISION'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: APPROVED, REJECTED, NEEDS_REVISION' },
        { status: 400 }
      );
    }
    
    if (status === 'APPROVED' && (!grade || isNaN(grade) || grade < 0 || grade > 100)) {
      return NextResponse.json(
        { error: 'A valid grade between 0 and 100 is required for approved submissions' },
        { status: 400 }
      );
    }
    
    if (!notes || typeof notes !== 'string' || notes.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review notes are required and must be at least 10 characters long' },
        { status: 400 }
      );
    }
    
    // Update the submission with the review
    const updatedSubmission = await prisma.projectSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        grade: status === 'APPROVED' ? parseFloat(grade) : null,
        reviewNotes: notes,
        reviewerId: userId,
        reviewedAt: new Date(),
      },
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
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
    
    // Update the project status if approved
    if (status === 'APPROVED') {
      await prisma.project.update({
        where: { id: submission.projectId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: 'Submission reviewed successfully',
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return NextResponse.json(
      { error: 'Failed to review submission' },
      { status: 500 }
    );
  }
}
