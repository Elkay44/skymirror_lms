import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Page creation validation schema
const createPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  moduleId: z.string().uuid('Invalid module ID'),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
});

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

// GET handler - Get all pages or filter by moduleId
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    
    // Query parameters
    const where = moduleId ? { moduleId } : {};
    
    // Get pages with optional filtering
    const pages = await prisma.page.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ pages });
  } catch (error: any) {
    console.error('Error getting pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

// POST handler - Create a new page
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = createPageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { title, content, moduleId, description, isPublished } = validationResult.data;
    
    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    // Create page
    const page = await prisma.page.create({
      data: {
        title,
        content: content || '',
        moduleId,
        description: description || '',
        isPublished: isPublished ?? false,
      },
    });
    
    // Log activity
    await logPageActivity(userId.toString(), 'create_page', page.id, { title });
    
    // Revalidate cache
    revalidatePath(`/courses/${module.courseId}/modules/${moduleId}`);
    
    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}
