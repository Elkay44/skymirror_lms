import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/courses/[courseId]/projects/[projectId] - Get a specific project
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; projectId: string }> }
) {
  try {
    const { courseId, projectId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to view this project' },
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
          { error: 'You must be enrolled in this course to view this project' },
          { status: 403 }
        );
      }
    }

    // Get the specific project
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        courseId: courseId // Ensure project belongs to the course
      },
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
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: project
    }, { status: 200 });
  } catch (error) {
    console.error('[PROJECT_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/projects/[projectId] - Update a specific project
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; projectId: string }> }
) {
  try {
    const { courseId, projectId } = await params;
    
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
        { error: 'You must be the instructor of this course to update projects' },
        { status: 403 }
      );
    }

    // Check if project exists and belongs to the course
    const existingProject = await prisma.project.findUnique({
      where: { 
        id: projectId,
        courseId: courseId
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { 
      title, 
      description, 
      instructions, 
      dueDate, 
      pointsValue, 
      isRequiredForCertification,
      isPublished 
    } = body;

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(pointsValue !== undefined && { pointsValue }),
        ...(isRequiredForCertification !== undefined && { isRequiredForCertification }),
        ...(isPublished !== undefined && { isPublished })
      },
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
      }
    });

    return NextResponse.json({
      data: updatedProject
    }, { status: 200 });
  } catch (error) {
    console.error('[PROJECT_PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/projects/[projectId] - Delete a specific project
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; projectId: string }> }
) {
  try {
    const { courseId, projectId } = await params;
    
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
        { error: 'You must be the instructor of this course to delete projects' },
        { status: 403 }
      );
    }

    // Check if project exists and belongs to the course
    const existingProject = await prisma.project.findUnique({
      where: { 
        id: projectId,
        courseId: courseId
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete the project (this will cascade delete submissions due to foreign key constraints)
    await prisma.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({
      message: 'Project deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('[PROJECT_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
