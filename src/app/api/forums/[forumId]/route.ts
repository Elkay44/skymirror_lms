/* eslint-disable */
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
  }
};

// GET handler - Get a specific forum
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const { forumId } = await params;
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the forum with related data
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            posts: true,
            subscribers: true,
          },
        },
      },
    });

    if (!forum) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }

    // Log the view
    await logForumActivity(session.user.id, 'view_forum', forumId);

    return NextResponse.json(forum);
  } catch (error) {
    console.error('Error fetching forum:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum' },
      { status: 500 }
    );
  }
}

// PATCH handler - Update a forum
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const { forumId } = await params;
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the forum to check permissions
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      select: { createdById: true },
    });

    if (!forum) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or an admin
    const isAdmin = session.user.role === 'ADMIN';
    const isCreator = forum.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Unauthorized to update this forum' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const updateData = updateForumSchema.parse(body);

    // Update the forum
    const updatedForum = await prisma.forum.update({
      where: { id: forumId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the update
    await logForumActivity(session.user.id, 'update_forum', forumId, {
      changes: updateData,
    });

    // Revalidate the cache
    revalidatePath(`/forums/${forumId}`);
    revalidatePath('/forums');

    return NextResponse.json(updatedForum);
  } catch (error) {
    console.error('Error updating forum:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update forum' },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete a forum
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const { forumId } = await params;
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the forum to check permissions
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      select: { createdById: true },
    });

    if (!forum) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or an admin
    const isAdmin = session.user.role === 'ADMIN';
    const isCreator = forum.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this forum' },
        { status: 403 }
      );
    }

    // Delete the forum (cascading deletes should be handled by Prisma)
    await prisma.forum.delete({
      where: { id: forumId },
    });

    // Log the deletion
    await logForumActivity(session.user.id, 'delete_forum', forumId);

    // Revalidate the cache
    revalidatePath('/forums');

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting forum:', error);
    return NextResponse.json(
      { error: 'Failed to delete forum' },
      { status: 500 }
    );
  }
}
