import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define TypeScript interfaces for our data
interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
}

interface Feedback {
  id: string;
  content: string | null;
  rating: number | null;
  createdAt: Date;
}

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
}

interface Submission {
  id: string;
  student: Student;
  project: Project;
  status: string;
  submittedAt: Date;
  feedback: Feedback | null;
  attachments: Attachment[];
}

interface ProjectWithSubmissions extends Project {
  submissions: Submission[];
}

interface SubmissionResponse {
  id: string;
  studentId: string;
  studentName: string | null;
  projectId: string;
  projectTitle: string;
  status: string;
  submittedAt: Date;
  hasFeedback: boolean;
  attachmentCount: number;
}

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'submitted';
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    
    if (!user || user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden: User is not an instructor' }, { status: 403 });
    }
    
    // Verify the course exists and belongs to the instructor
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructor: {
          id: user.id
        }
      },
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or not authorized' }, { status: 404 });
    }
    
    // Get all projects with their submissions for this course
    const projects = await prisma.project.findMany({
      where: { courseId },
      include: {
        submissions: {
          where: { status },
          include: {
            student: true,
            feedback: true,
            attachments: true,
          },
          orderBy: { submittedAt: 'desc' as const },
        },
      },
    });
    
    // Transform the data for the response
    const response: SubmissionResponse[] = [];
    
    projects.forEach((project: ProjectWithSubmissions) => {
      project.submissions.forEach((submission: Submission) => {
        response.push({
          id: submission.id,
          studentId: submission.student.id,
          studentName: submission.student.name,
          projectId: project.id,
          projectTitle: project.title,
          status: submission.status,
          submittedAt: submission.submittedAt,
          hasFeedback: submission.feedback !== null,
          attachmentCount: submission.attachments.length,
        });
      });
    });
    
    // Sort by student name and then by submission date (newest first)
    response.sort((a, b) => {
      if (a.studentName && b.studentName) {
        const nameCompare = a.studentName.localeCompare(b.studentName);
        if (nameCompare !== 0) return nameCompare;
      }
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    
    return NextResponse.json({ submissions: response });
    
  } catch (error) {
    console.error('Error fetching course submissions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
