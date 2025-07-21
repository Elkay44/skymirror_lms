/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/[projectId] - Get a specific project
export async function GET(
  req: NextRequest, 
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
    
    // Find the project with appropriate data based on role
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            enrollments: role === 'STUDENT' ? {
              where: { userId },
              select: { id: true }
            } : undefined
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        collaborators: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            role: true,
            joinedAt: true,
          },
        },
        skills: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
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
    
    // Check if user has access to this project
    const isAuthor = project.authorId === userId;
    const isCollaborator = project.collaborators.some(c => c.user.id === userId);
    const isInstructor = project.course?.instructorId === userId;
    const isEnrolled = project.course?.enrollments?.length > 0;
    
    if (role === 'STUDENT' && !isAuthor && !isCollaborator && !isEnrolled) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Add user-specific data
    const projectWithUserData = {
      ...project,
      isLiked: false, // Will be updated below if user is authenticated
      isOwner: isAuthor,
      isCollaborator,
      canEdit: isAuthor || isCollaborator || isInstructor,
    };
    
    // Check if user has liked this project
    if (userId) {
      const like = await prisma.projectLike.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });
      
      projectWithUserData.isLiked = !!like;
    }
    
    return NextResponse.json(projectWithUserData);
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
  req: NextRequest, 
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
    const isCollaborator = project.collaborators.some(c => c.role === 'ADMIN' || c.role === 'EDITOR');
    
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
  req: NextRequest, 
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
