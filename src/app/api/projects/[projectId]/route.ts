/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/[projectId] - Get a specific project
export async function GET(
  _req: Request, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { projectId } = await params;
    const userId = session.user.id;
    const role = session.user.role;
    
    // Find the project with basic data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true
          }
        },
        module: {
          select: {
            id: true,
            title: true,
            order: true
          }
        }
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this project based on role
    if (role === 'STUDENT') {
      // Check if student is enrolled in the course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: project.courseId,
          status: 'ACTIVE'
        }
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You are not enrolled in this course' },
          { status: 403 }
        );
      }
    } else if (role === 'INSTRUCTOR') {
      // Instructors can access projects in their courses
      if (project.course.instructorId !== userId) {
        return NextResponse.json(
          { error: 'You do not have permission to access this project' },
          { status: 403 }
        );
      }
    } else if (role === 'MENTOR') {
      // Mentors can access projects in their courses
      if (project.course.instructorId !== userId) {
        return NextResponse.json(
          { error: 'You do not have permission to access this project' },
          { status: 403 }
        );
      }
    } else if (role === 'ADMIN') {
      // Admins can access all projects
    } else {
      return NextResponse.json(
        { error: 'You do not have permission to access this project' },
        { status: 403 }
      );
    }
    
    // Return the project data
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId] - Update a project (instructors only)
export async function PATCH(
  req: Request, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { projectId } = await params;
    const userId = session.user.id;
    const updateData = await req.json();
    
    // Check if project exists and user has permission to update it
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        author: {
          select: { id: true },
        },
        collaborators: {
          where: { userId },
          select: { role: true },
        },
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the author, an admin, or an instructor of the course
    const isAuthor = project.author.id === userId;
    const isInstructor = project.course?.instructorId === userId;
    const isAdmin = session.user.role === 'ADMIN';
    const isCollaborator = project.collaborators.some((c: { role: string }) => c.role === 'ADMIN' || c.role === 'EDITOR');
    
    if (!isAuthor && !isInstructor && !isAdmin && !isCollaborator) {
      return NextResponse.json(
        { error: 'You do not have permission to update this project' },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date(),
    };
    
    // Handle skills update if provided
    if (updateData.skills) {
      updateFields.skills = {
        set: [], // Clear existing skills
        connectOrCreate: updateData.skills.map((skill: string) => ({
          where: { name: skill },
          create: { name: skill },
        })),
      };
    }
    
    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateFields,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        skills: true,
      },
    });
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - Delete a project (instructors only)
export async function DELETE(
  _req: Request, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { projectId } = await params;
    const userId = session.user.id;
    
    // Check if project exists and user has permission to delete it
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        author: {
          select: { id: true },
        },
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Only the author, an admin, or the course instructor can delete the project
    const isAuthor = project.author.id === userId;
    const isInstructor = project.course?.instructorId === userId;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAuthor && !isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this project' },
        { status: 403 }
      );
    }
    
    // Delete the project (Prisma's cascading deletes will handle related records)
    await prisma.project.delete({
      where: { id: projectId },
    });
    
    return NextResponse.json(
      { success: true, message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
