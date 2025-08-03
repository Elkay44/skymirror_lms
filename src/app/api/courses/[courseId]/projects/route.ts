import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/courses/[courseId]/projects - Get all projects for a course
export async function GET(
  _request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to view projects' },
        { status: 401 }
      );
    }
    
    // Check if user is instructor or enrolled in the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    const isInstructor = course?.instructorId === userId;

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: userId, 
          courseId, 
          status: { in: ['ACTIVE', 'COMPLETED'] } 
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to view projects' },
          { status: 403 }
        );
      }
    }

    // Get all projects for this course
    const projects = await prisma.project.findMany({
      where: { courseId },
      include: {
        module: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: { 
            submissions: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      data: projects,
      total: projects.length
    }, { status: 200 });
  } catch (error) {
    console.error('[COURSE_PROJECTS_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/projects - Create a new project
export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify instructor access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!course || course.instructorId !== userId) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to create projects' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { title, description, instructions, dueDate, pointsValue, isRequiredForCertification } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        instructions: instructions || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        pointsValue: pointsValue || 100,
        isRequiredForCertification: isRequiredForCertification || true,
        courseId,
        moduleId: null // Will be assigned when added to a module
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('[COURSE_PROJECTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
