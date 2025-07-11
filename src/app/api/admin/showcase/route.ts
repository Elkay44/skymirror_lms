import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/showcase - Get all showcase projects (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins can access this endpoint
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only administrators can access this endpoint' },
        { status: 403 }
      );
    }
    
    // Get all showcase projects
    const projects = await prisma.showcaseProject.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        submission: {
          select: {
            id: true,
            status: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        showcasedAt: 'desc',
      },
    });
    
    // Format the response
    const formattedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      studentId: project.studentId,
      studentName: project.student.name,
      studentImage: project.student.image,
      courseId: project.courseId,
      courseTitle: project.course.title,
      submissionId: project.submissionId,
      repositoryUrl: project.repositoryUrl,
      demoUrl: project.demoUrl,
      imageUrl: project.imageUrl,
      featured: project.featured,
      category: project.category,
      tags: project.tags,
      showcasedAt: project.showcasedAt,
      viewCount: project.viewCount,
    }));
    
    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error('Error fetching showcase projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase projects' },
      { status: 500 }
    );
  }
}

// POST /api/admin/showcase - Add a project to the showcase (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins can access this endpoint
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only administrators can add projects to the showcase' },
        { status: 403 }
      );
    }
    
    const data = await req.json();
    const { 
      title, 
      description, 
      submissionId, 
      featured, 
      category, 
      tags,
      imageUrl,
      demoUrl,
      repositoryUrl,
    } = data;
    
    // Validate required fields
    if (!title || !description || !submissionId || !category) {
      return NextResponse.json(
        { error: 'Title, description, submission ID, and category are required' },
        { status: 400 }
      );
    }
    
    // Check if the submission exists
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            course: true,
          },
        },
        student: true,
      },
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if the submission is already in the showcase
    const existingShowcase = await prisma.showcaseProject.findFirst({
      where: { submissionId },
    });
    
    if (existingShowcase) {
      return NextResponse.json(
        { error: 'This submission is already in the showcase' },
        { status: 400 }
      );
    }
    
    // Create the showcase project
    const showcaseProject = await prisma.showcaseProject.create({
      data: {
        title,
        description,
        studentId: submission.studentId,
        courseId: submission.project.courseId,
        submissionId,
        repositoryUrl: repositoryUrl || submission.repositoryUrl || null,
        demoUrl: demoUrl || null,
        imageUrl: imageUrl || submission.project.imageUrl || null,
        featured: featured || false,
        category,
        tags: tags || [],
        showcasedAt: new Date(),
        viewCount: 0,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    
    // Create a notification for the student
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        type: 'SHOWCASE',
        title: 'Your project is now in the showcase!',
        message: `Congratulations! Your project "${title}" has been added to the SkyMirror Academy showcase.`,
        relatedId: showcaseProject.id,
        relatedType: 'SHOWCASE_PROJECT',
      },
    });
    
    // Format the response
    const formattedProject = {
      id: showcaseProject.id,
      title: showcaseProject.title,
      description: showcaseProject.description,
      studentId: showcaseProject.studentId,
      studentName: showcaseProject.student.name,
      studentImage: showcaseProject.student.image,
      courseId: showcaseProject.courseId,
      courseTitle: showcaseProject.course.title,
      submissionId: showcaseProject.submissionId,
      repositoryUrl: showcaseProject.repositoryUrl,
      demoUrl: showcaseProject.demoUrl,
      imageUrl: showcaseProject.imageUrl,
      featured: showcaseProject.featured,
      category: showcaseProject.category,
      tags: showcaseProject.tags,
      showcasedAt: showcaseProject.showcasedAt,
      viewCount: showcaseProject.viewCount,
    };
    
    return NextResponse.json({ project: formattedProject });
  } catch (error) {
    console.error('Error adding project to showcase:', error);
    return NextResponse.json(
      { error: 'Failed to add project to showcase' },
      { status: 500 }
    );
  }
}
