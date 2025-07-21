/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Page update validation schema
const updatePageSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().optional(),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
});

// Log page activity
const logPageActivity = async (userId: string | number, action: string, pageId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: 'page',
        entityId: pageId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log page activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET handler - Get a specific page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeContent = searchParams.get('includeContent') === 'true';
    
    // Get the page with optional content
    const page = await prisma.page.findUnique({
      where: { 
        id: pageId,
        isPublished: true, // Only fetch published pages via API
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        content: includeContent,
        _count: {
          select: {
            views: true,
            likes: true,
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Increment view count (non-blocking)
    prisma.pageView.upsert({
      where: { pageId },
      create: { pageId, count: 1 },
      update: { count: { increment: 1 } },
    }).catch(console.error);

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PATCH handler - Update a page
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { pageId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validation = updatePageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if user has permission to update this page
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { authorId: true },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Only the author or an admin can update the page
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (page.authorId !== user.id && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized to update this page' },
        { status: 403 }
      );
    }

    // Update the page
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        ...validation.data,
        // Only update slug if title is being updated
        ...(validation.data.title && {
          slug: validation.data.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
        }),
      },
    });

    // Log the update
    await logPageActivity(user.id, 'PAGE_UPDATED', pageId, {
      updatedFields: Object.keys(validation.data),
    });

    // Revalidate the page path
    revalidatePath(`/pages/${updatedPage.slug}`);
    revalidatePath('/pages');

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { pageId } = await params;
    
    // Check if user has permission to delete this page
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { 
        id: true,
        authorId: true,
        slug: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Only the author or an admin can delete the page
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (page.authorId !== user.id && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this page' },
        { status: 403 }
      );
    }

    // Log the deletion before actually deleting
    await logPageActivity(user.id, 'PAGE_DELETED', pageId);

    // Delete the page
    await prisma.page.delete({
      where: { id: pageId },
    });

    // Revalidate the pages list and the page path
    revalidatePath('/pages');
    revalidatePath(`/pages/${page.slug}`);

    return NextResponse.json(
      { success: true, message: 'Page deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
