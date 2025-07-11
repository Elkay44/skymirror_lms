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
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { pageId } = params;
    
    // Get page
    const page = await prisma.page.findUnique({
      where: { id: pageId },
    });
    
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
    return NextResponse.json({ page });
  } catch (error: any) {
    console.error(`Error getting page ${params.pageId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}

// PATCH handler - Update a page
export async function PATCH(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    const { pageId } = params;
    
    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: pageId },
      include: { module: true },
    });
    
    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = updatePageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { title, content, description, isPublished } = validationResult.data;
    
    // Update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (description !== undefined) updateData.description = description;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    
    // Update page
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: updateData,
    });
    
    // Log activity
    await logPageActivity(userId.toString(), 'update_page', pageId, updateData);
    
    // Revalidate cache
    if (existingPage.module?.courseId) {
      revalidatePath(`/courses/${existingPage.module.courseId}/modules/${existingPage.moduleId}`);
    }
    
    return NextResponse.json({ page: updatedPage });
  } catch (error: any) {
    console.error(`Error updating page ${params.pageId}:`, error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

// DELETE handler - Delete a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    const { pageId } = params;
    
    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: pageId },
      include: { module: true },
    });
    
    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
    // Delete page
    await prisma.page.delete({
      where: { id: pageId },
    });
    
    // Log activity
    await logPageActivity(userId.toString(), 'delete_page', pageId, { title: existingPage.title });
    
    // Revalidate cache
    if (existingPage.module?.courseId) {
      revalidatePath(`/courses/${existingPage.module.courseId}/modules/${existingPage.moduleId}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting page ${params.pageId}:`, error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
