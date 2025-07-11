import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Forum update validation schema
const updateForumSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  allowAnonymousPosts: z.boolean().optional(),
  requireModeration: z.boolean().optional(),
});

// Log forum activity
const logForumActivity = async (userId: string | number, action: string, forumId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: 'forum',
        entityId: forumId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log forum activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET handler - Get a specific forum
export async function GET(
  request: NextRequest,
  { params }: { params: { forumId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { forumId } = params;
    const userId = session.user.id;
    const role = session.user.role;
    
    // Get forum
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      include: {
        // Include the course relation
        course: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });
    
    // If student, check enrollment separately
    let hasAccess = true;
    if (role === 'STUDENT' && forum) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          courseId: forum.courseId,
          userId: parseInt(userId.toString(), 10)
        }
      });
      hasAccess = !!enrollment;
    }
    
    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }
    
    // Check access based on role
    if (role === 'STUDENT') {
      // Students need to be enrolled in the course
      if (!hasAccess) {
        return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
      }
    } else if (role === 'INSTRUCTOR') {
      // For instructors, get the course to check ownership
      const course = await prisma.course.findUnique({
        where: { id: forum.courseId },
        select: { instructorId: true }
      });
      
      if (!course || course.instructorId !== parseInt(userId.toString(), 10)) {
        return NextResponse.json({ error: 'Not authorized to access this forum' }, { status: 403 });
      }
    }
    
    return NextResponse.json({ forum });
  } catch (error: any) {
    console.error(`Error getting forum ${params.forumId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 });
  }
}

// PATCH handler - Update a forum
export async function PATCH(
  request: NextRequest,
  { params }: { params: { forumId: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and admins can update forums
    const role = session.user.role;
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only instructors and administrators can update forums' }, { status: 403 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    const { forumId } = params;
    
    // Check if forum exists
    const existingForum = await prisma.forum.findUnique({
      where: { id: forumId },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });
    
    if (!existingForum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }
    
    // If instructor, check they teach this course
    const course = await prisma.course.findUnique({
      where: { id: existingForum.courseId },
      select: { instructorId: true }
    });
    
    if (role === 'INSTRUCTOR' && (!course || course.instructorId !== parseInt(userId.toString(), 10))) {
      return NextResponse.json({ error: 'You do not have permission to update forums for this course' }, { status: 403 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = updateForumSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { 
      title, 
      description, 
      isPublished,
      allowAnonymousPosts,
      requireModeration,
    } = validationResult.data;
    
    // Update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (allowAnonymousPosts !== undefined) updateData.allowAnonymousPosts = allowAnonymousPosts;
    if (requireModeration !== undefined) updateData.requireModeration = requireModeration;
    
    // Update forum
    const updatedForum = await prisma.forum.update({
      where: { id: forumId },
      data: updateData,
    });
    
    // Log activity
    await logForumActivity(userId.toString(), 'update_forum', forumId, updateData);
    
    // Revalidate cache
    revalidatePath(`/courses/${existingForum.courseId}`);
    revalidatePath(`/courses/${existingForum.courseId}/forums`);
    revalidatePath(`/courses/${existingForum.courseId}/forums/${forumId}`);
    
    return NextResponse.json({ forum: updatedForum });
  } catch (error: any) {
    console.error(`Error updating forum ${params.forumId}:`, error);
    return NextResponse.json({ error: 'Failed to update forum' }, { status: 500 });
  }
}

// DELETE handler - Delete a forum
export async function DELETE(
  request: NextRequest,
  { params }: { params: { forumId: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and admins can delete forums
    const role = session.user.role;
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only instructors and administrators can delete forums' }, { status: 403 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    const { forumId } = params;
    
    // Check if forum exists
    const existingForum = await prisma.forum.findUnique({
      where: { id: forumId },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });
    
    if (!existingForum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }
    
    // If instructor, check they teach this course
    const courseForDelete = await prisma.course.findUnique({
      where: { id: existingForum.courseId },
      select: { instructorId: true }
    });
    
    if (role === 'INSTRUCTOR' && (!courseForDelete || courseForDelete.instructorId !== parseInt(userId.toString(), 10))) {
      return NextResponse.json({ error: 'You do not have permission to delete forums for this course' }, { status: 403 });
    }
    
    // Delete forum
    await prisma.forum.delete({
      where: { id: forumId },
    });
    
    // Log activity
    await logForumActivity(userId.toString(), 'delete_forum', forumId, { title: existingForum.title });
    
    // Revalidate cache
    revalidatePath(`/courses/${existingForum.courseId}`);
    revalidatePath(`/courses/${existingForum.courseId}/forums`);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting forum ${params.forumId}:`, error);
    return NextResponse.json({ error: 'Failed to delete forum' }, { status: 500 });
  }
}
