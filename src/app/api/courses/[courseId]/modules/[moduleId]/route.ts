import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Define the structure of the module response to help with TypeScript
type ModuleResponse = {
  id: string;
  title: string;
  description: string | null;
  lessons: Array<{
    id: string;
    title: string;
    order: number;
    description: string | null;
  }>;
  resources: Array<any>;
  forums: Array<{
    id: string;
    title: string;
    description: string | null;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      posts: number;
    };
  }>;
};

// GET /api/courses/[courseId]/modules/[moduleId] - Get module details, lessons, and resources
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to view module content' },
        { status: 401 }
      );
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: { 
        userId: Number(userId), 
        courseId, 
        status: { in: ['ACTIVE', 'COMPLETED'] } 
      },
    });
    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to view module content' },
        { status: 403 }
      );
    }

    // Fetch module and its associated data
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            description: true,
          },
        },
        resources: {
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            type: true,
          },
        },
      },
    });
    
    // Fetch forums for this module
    const forums = await prisma.forum.findMany({
      where: {
        moduleId: moduleId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });
    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    // Construct response with module data and forums
    // Map forum results to ensure they match the expected ModuleResponse type
    const mappedForums = forums.map(forum => ({
      id: forum.id,
      title: forum.title,
      description: forum.description,
      createdAt: forum.createdAt,
      updatedAt: forum.updatedAt,
      _count: forum._count
    }));
    
    const response: ModuleResponse = {
      id: module.id,
      title: module.title,
      description: module.description,
      lessons: module.lessons,
      resources: module.resources || [],
      forums: mappedForums,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module details' },
      { status: 500 }
    );
  }
}

// Define module update validation schema
const updateModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

// Log module activity
const logModuleActivity = async (userId: string | number, action: string, moduleId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId.toString(),
        action,
        entityType: 'module',
        entityId: moduleId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log module activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// PATCH /api/courses/[courseId]/modules/[moduleId] - Update a module
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;
    
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and admins can update modules
    const role = session.user.role;
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only instructors and administrators can update modules' }, { status: 403 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // For instructors, verify they teach this course
    if (role === 'INSTRUCTOR') {
      const course = await prisma.course.findUnique({
        where: {
          id: courseId,
          instructorId: parseInt(userId.toString(), 10) // Convert string userId to number
        }
      });
      
      if (!course) {
        return NextResponse.json({ error: 'You do not have permission to update modules in this course' }, { status: 403 });
      }
    }
    
    // Check if module exists
    const existingModule = await prisma.module.findUnique({
      where: { id: moduleId }
    });
    
    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = updateModuleSchema.safeParse(body);
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
      order, 
      isPublished
    } = validationResult.data;
    
    // Update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    
    // Update module
    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: updateData,
    });
    
    // Log activity
    await logModuleActivity(userId.toString(), 'update_module', moduleId, updateData);
    
    // Revalidate cache
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
    
    return NextResponse.json({ module: updatedModule });
  } catch (error: any) {
    console.error(`Error updating module ${params.moduleId}:`, error);
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}
