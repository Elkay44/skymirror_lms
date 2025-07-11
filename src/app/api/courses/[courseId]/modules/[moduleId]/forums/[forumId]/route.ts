import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[courseId]/modules/[moduleId]/forums/[forumId] - Get specific forum details
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string } }
) {
  try {
    const { courseId, moduleId, forumId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access this resource.' },
        { status: 401 }
      );
    }

    // Get the course to check if it exists and access permissions
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        isPublished: true,
        instructorId: true,
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user is enrolled or is the instructor or an admin
    const isInstructor = course.instructorId === Number(userId);
    const isAdmin = session?.user?.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: Number(userId),
          courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] }
        }
      });

      // If the course is not published and the user is not enrolled, deny access
      if (!course.isPublished && !enrollment) {
        return NextResponse.json(
          { error: 'Course is not published. You must be enrolled to access its content.' },
          { status: 403 }
        );
      }

      // If user is not enrolled, deny access
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to access its content.' },
          { status: 403 }
        );
      }
    }

    // Fetch the forum with post count
    const forum = await prisma.forum.findUnique({
      where: { 
        id: forumId,
        moduleId: moduleId
      },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }

    return NextResponse.json(forum);
  } catch (error) {
    console.error('Error fetching forum details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum details' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/forums/[forumId] - Update forum
export async function PATCH(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string } }
) {
  try {
    const { courseId, moduleId, forumId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Check authorization
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const isInstructor = course.instructorId === Number(userId);
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const { title, description, isActive } = await request.json();
    
    // Update forum
    const updatedForum = await prisma.forum.update({
      where: { id: forumId },
      data: {
        title: title,
        description: description,
        isActive: isActive
      }
    });
    
    return NextResponse.json(updatedForum);
  } catch (error) {
    console.error('Error updating forum:', error);
    return NextResponse.json({ error: 'Failed to update forum' }, { status: 500 });
  }
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/forums/[forumId] - Delete forum
export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string } }
) {
  try {
    const { courseId, moduleId, forumId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Check authorization
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const isInstructor = course.instructorId === Number(userId);
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete forum (this will also cascade delete posts and comments)
    await prisma.forum.delete({
      where: { id: forumId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting forum:', error);
    return NextResponse.json({ error: 'Failed to delete forum' }, { status: 500 });
  }
}
