import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for creating a new page
const createPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  isPublished: z.boolean().optional(),
  order: z.number().int().positive().optional(),
  contentBlocks: z.array(
    z.object({
      type: z.enum(['text', 'image', 'video', 'code', 'embed']),
      content: z.string(),
      metadata: z.record(z.string(), z.any()).optional()
    })
  ).optional(),
});

// Log page activity
const logPageActivity = async (userId: string | number, action: string, pageId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId.toString(),
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

// GET /api/courses/[courseId]/modules/[moduleId]/pages - Get all pages for a module
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is instructor or enrolled in the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    const isInstructor = course?.instructorId === Number(userId);

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: Number(userId), 
          courseId, 
          status: { in: ['ACTIVE', 'COMPLETED'] } 
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to view pages' },
          { status: 403 }
        );
      }
    }

    // For now, we'll use the lessons table with a filter for "page" type
    // In a real implementation, you might have a separate pages table or model
    const pages = await prisma.lesson.findMany({
      where: { 
        moduleId,
        // This assumes we've added a "type" field to lessons table
        // If not, this is a good place to add that distinction
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        videoUrl: true,
        duration: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform the data to match the expected ModulePage structure
    const transformedPages = pages.map(page => ({
      id: page.id,
      moduleId,
      title: page.title,
      slug: page.title.toLowerCase().replace(/\s+/g, '-'),
      description: page.description || '',
      order: page.order,
      isPublished: true, // Default to true for now
      contentBlocks: [
        {
          id: `block-${page.id}`,
          type: 'text' as const,
          order: 1,
          content: page.content || '',
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        },
        // If video URL exists, add a video block
        ...(page.videoUrl ? [
          {
            id: `video-${page.id}`,
            type: 'video' as const,
            order: 2,
            title: `${page.title} Video`,
            videoUrl: page.videoUrl,
            duration: page.duration || 0,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt
          }
        ] : [])
      ],
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      publishedAt: page.createdAt, // For simplicity, use createdAt as publishedAt
    }));

    return NextResponse.json({
      data: transformedPages,
      total: transformedPages.length
    });
  } catch (error) {
    console.error('[PAGES_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/pages - Create a new page
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const { courseId, moduleId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user is an instructor for this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: Number(userId),
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You do not have permission to create pages for this course' },
        { status: 403 }
      );
    }

    // Ensure module belongs to the course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId,
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found in this course' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validationResult = createPageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { title, description, content, isPublished = true, contentBlocks, order } = validationResult.data;

    // Use provided order or determine the next available order
    let nextOrder = order;
    if (!nextOrder) {
      const highestOrderItem = await prisma.lesson.findFirst({
        where: { moduleId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      
      nextOrder = highestOrderItem ? highestOrderItem.order + 1 : 1;
    }

    // Create a new lesson to represent the page
    const page = await prisma.lesson.create({
      data: {
        title,
        description: description || "",
        content: content || "",
        order: nextOrder,
        moduleId,
        type: 'PAGE', // Assuming the schema now supports page type
        duration: 0,
        isPublished: isPublished || true,
      },
    });

    // Transform to match expected page format
    const transformedPage = {
      id: page.id,
      moduleId,
      title: page.title,
      slug: page.title.toLowerCase().replace(/\s+/g, '-'),
      description: page.description || '',
      order: page.order,
      isPublished: body.isPublished ?? true,
      contentBlocks: [
        {
          id: `block-${page.id}`,
          type: 'text' as const,
          order: 1,
          content: body.content || '',
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        }
      ],
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      publishedAt: page.createdAt,
    };

    // Log activity
    await logPageActivity(userId.toString(), 'create_page', page.id, { title });
    
    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
    
    return NextResponse.json(transformedPage, { status: 201 });
  } catch (error: any) {
    console.error('[PAGES_POST]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create page' },
      { status: 500 }
    );
  }
}
