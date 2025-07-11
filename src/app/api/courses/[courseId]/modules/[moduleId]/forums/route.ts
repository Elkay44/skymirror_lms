import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for forum operations
const forumSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isPublished: z.boolean().optional().default(true),
  allowAnonymousPosts: z.boolean().optional().default(false),
  requireApproval: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional(),
});

// Ensure the route is always dynamically rendered
export const dynamic = 'force-dynamic';

// POST /api/courses/[courseId]/modules/[moduleId]/forums - Create a new forum for a module
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and authorized
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is course instructor or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const userId = Number(session.user.id);
    const isInstructor = userId === course.instructorId;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'Only instructors or admins can create forums' },
        { status: 403 }
      );
    }
    
    // Check if module exists and belongs to the course
    const module = await prisma.module.findUnique({
      where: {
        id: moduleId,
        courseId: courseId,
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { error: 'Module not found or does not belong to this course' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const validatedData = forumSchema.parse(body);
    
    // Create forum
    const forum = await prisma.forum.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        courseId: courseId,
        moduleId: moduleId, // Associate with module
        isActive: validatedData.isActive,
        isPublished: validatedData.isPublished ?? true,
        allowAnonymousPosts: validatedData.allowAnonymousPosts ?? false,
        requireModeration: validatedData.requireApproval ?? false,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
      }
    });
    
    return NextResponse.json({ forum }, { status: 201 });
    
  } catch (error) {
    console.error('[MODULE_FORUM_CREATE_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create module forum', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/courses/[courseId]/modules/[moduleId]/forums - Get all forums for a module
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        isPublished: true,
        instructorId: true,
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Check if user is authorized to access this course
    const isInstructor = userId === course.instructorId;
    const isAdmin = session?.user?.role === 'ADMIN';
    
    // If course is not published, only instructor or admin can access
    if (!course.isPublished && !isInstructor && !isAdmin) {
      // Check enrollment
      const enrollment = userId ? await prisma.enrollment.findFirst({
        where: {
          courseId,
          userId,
          status: 'ACTIVE'
        }
      }) : null;
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You do not have access to this course' },
          { status: 403 }
        );
      }
    }
    
    // Check if module exists and belongs to the course
    const module = await prisma.module.findUnique({
      where: {
        id: moduleId,
        courseId: courseId,
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { error: 'Module not found or does not belong to this course' },
        { status: 404 }
      );
    }
    
    // Get all forums for the module
    const forums = await prisma.forum.findMany({
      where: {
        moduleId: moduleId,
        courseId: courseId,
      },
      include: {
        _count: {
          select: {
            posts: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ forums });
    
  } catch (error) {
    console.error('[MODULE_FORUM_GET_ERROR]', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve module forums', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
