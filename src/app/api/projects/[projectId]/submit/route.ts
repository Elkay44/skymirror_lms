import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/projects/[projectId]/submit - Submit a project (students only)
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit projects' }, { status: 403 });
    }
    
    const { projectId } = params;
    const userId = session.user.id;
    
    // Verify the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        course: {
          select: {
            enrollments: {
              where: { userId },
              select: { id: true }
            }
          }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Verify student is enrolled in the course
    if (!project.course.enrollments || project.course.enrollments.length === 0) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }
    
    // Check if we have a multipart form or JSON data
    let submissionData;
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      // Handle form data (file uploads)
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];
      const submissionText = formData.get('submissionText') as string;
      const submissionUrl = formData.get('submissionUrl') as string;
      
      // Process file uploads here (would typically upload to cloud storage)
      // For this implementation, we'll just store metadata
      const fileMetadata = files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/uploads/${file.name}` // Placeholder URL, would be replaced with actual cloud storage URL
      }));
      
      submissionData = {
        submissionText,
        submissionUrl,
        submissionFiles: JSON.stringify(fileMetadata),
        status: 'SUBMITTED'
      };
    } else {
      // Handle JSON data
      const body = await req.json();
      const { submissionText, submissionUrl, submissionFiles } = body;
      
      submissionData = {
        submissionText,
        submissionUrl,
        submissionFiles: submissionFiles ? JSON.stringify(submissionFiles) : undefined,
        status: 'SUBMITTED'
      };
    }
    
    // Check if student has an existing submission for this project
    const existingSubmission = await prisma.projectSubmission.findUnique({
      where: {
        projectId_studentId: {
          projectId,
          studentId: userId
        }
      }
    });
    
    let submission;
    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.projectSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          ...JSON.parse(JSON.stringify(submissionData)),
          status: 'SUBMITTED', // Reset to submitted status
          revisionCount: { increment: 1 },
          feedback: null, // Clear previous feedback
          grade: null, // Clear previous grade
          reviewedAt: null, // Reset review timestamp
          reviewerId: null, // Reset reviewer
          submittedAt: new Date() // Update submission time
        }
      });
    } else {
      // Create new submission
      submission = await prisma.projectSubmission.create({
        data: {
          ...JSON.parse(JSON.stringify(submissionData)),
          projectId,
          studentId: userId,
          status: 'SUBMITTED'
        }
      });
    }
    
    // Update user points for submission
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: 10 } // Award points for project submission
      }
    });
    
    return NextResponse.json({ 
      submission,
      message: 'Project submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting project:', error);
    return NextResponse.json({ error: 'Failed to submit project' }, { status: 500 });
  }
}

// GET /api/projects/[projectId]/submit - Get submission history (students only)
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { projectId } = params;
    const userId = session.user.id;
    const role = session.user.role;
    
    // Different data based on role
    if (role === 'STUDENT') {
      // Students can only view their own submissions
      const submissions = await prisma.projectSubmission.findMany({
        where: {
          projectId,
          studentId: userId
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });
      
      return NextResponse.json({ submissions });
    } else if (role === 'INSTRUCTOR') {
      // Instructors can view all submissions for this project
      // But need to verify they own the course
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          course: {
            instructorId: userId
          }
        }
      });
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found or you do not have permission to view submissions' }, { status: 403 });
      }
      
      const submissions = await prisma.projectSubmission.findMany({
        where: { projectId },
        include: {
          student: {
            select: {
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
      
      return NextResponse.json({ submissions });
    } else if (role === 'MENTOR') {
      // Mentors can view submissions from their mentees
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId }
      });
      
      if (!mentorProfile) {
        return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
      }
      
      // Get mentee IDs
      const mentorships = await prisma.mentorship.findMany({
        where: {
          mentorId: mentorProfile.id,
          status: 'ACTIVE'
        },
        select: {
          student: {
            select: {
              user: {
                select: { id: true }
              }
            }
          }
        }
      });
      
      const menteeIds = mentorships.map((m: any) => m.student.user.id);
      
      const submissions = await prisma.projectSubmission.findMany({
        where: {
          projectId,
          studentId: { in: menteeIds }
        },
        include: {
          student: {
            select: {
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
      
      return NextResponse.json({ submissions });
    }
    
    return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
