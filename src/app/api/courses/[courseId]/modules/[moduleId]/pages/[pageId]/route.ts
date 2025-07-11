import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for updating a page
const updatePageSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  order: z.number().optional(),
  contentBlocks: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['text', 'image', 'video', 'code', 'embed']),
      content: z.string(),
      order: z.number().int().optional(),
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

// GET /api/courses/[courseId]/modules/[moduleId]/pages/[pageId] - Get a specific page
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; pageId: string } }
) {
  try {
    const { courseId, moduleId, pageId } = params;
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
          { error: 'You must be enrolled in this course to view this page' },
          { status: 403 }
        );
      }
    }

    // Fetch the page (lesson)
    const page = await prisma.lesson.findFirst({
      where: { 
        id: pageId,
        moduleId
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Transform to match expected page format
    const transformedPage = {
      id: page.id,
      moduleId,
      title: page.title,
      slug: page.title.toLowerCase().replace(/\s+/g, '-'),
      description: page.description || '',
      order: page.order,
      isPublished: true, // Default to true for now
      contentBlocks: contentBlocks.length > 0 ? contentBlocks : [
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
    };

    return NextResponse.json(transformedPage);
  } catch (error) {
    console.error('[PAGE_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/modules/[moduleId]/pages/[pageId] - Update a page
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; pageId: string } }
) {
  try {
    const { courseId, moduleId, pageId } = params;
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
        { error: 'You do not have permission to update pages for this course' },
        { status: 403 }
      );
    }

    // Ensure page exists in this module and course
    const existingPage = await prisma.lesson.findFirst({
      where: {
        id: pageId,
        moduleId,
        module: {
          courseId
        }
      },
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    const validationResult = updatePageSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { title, description, content, isPublished, order, contentBlocks } = validationResult.data;

    // Extract content and videoUrl from contentBlocks if present
    let videoUrl: string | undefined = undefined;
    if (contentBlocks && Array.isArray(contentBlocks)) {
      for (const block of contentBlocks) {
        if (block.type === 'video' && block.metadata?.videoUrl) {
          videoUrl = block.metadata.videoUrl as string;
        }
      }
    }

    // Use a transaction to update the page and content blocks if provided
    const updatedPage = await prisma.$transaction(async (tx) => {
      // Update the page in the lessons table
      const updated = await tx.lesson.update({
        where: { id: pageId },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          content: content !== undefined ? content : undefined,
          order: order !== undefined ? order : undefined,
          isPublished: isPublished !== undefined ? isPublished : undefined,
          type: 'PAGE', // Ensure it's marked as a page
        },
      });
      
      // Handle content blocks if provided
      if (contentBlocks && contentBlocks.length > 0) {
        // Try to delete existing content blocks if the table exists
        try {
          await tx.pageContentBlock.deleteMany({
            where: { pageId }
          });
          
          // Create new content blocks
          for (let i = 0; i < contentBlocks.length; i++) {
            const block = contentBlocks[i];
            await tx.pageContentBlock.create({
              data: {
                pageId,
                type: block.type,
                content: block.content,
                order: block.order || i,
                metadata: block.metadata ? JSON.stringify(block.metadata) : null
              }
            });
          }
        } catch (error) {
          console.error('Error updating content blocks:', error);
          // Continue without failing if content blocks table doesn't exist
        }
      }
      
      return updated;
    });

    // Log activity
    await logPageActivity(userId.toString(), 'update_page', pageId, { title });
    
    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}/pages/${pageId}`);
    
    // Get any content blocks if they exist in a separate table
    const updatedContentBlocks = await prisma.pageContentBlock.findMany({
      where: { pageId },
      orderBy: { order: 'asc' }
    }).catch(() => []); // If the table doesn't exist, use empty array
    
    // Transform to match expected page format for response
    const transformedUpdatedPage = {
      id: updatedPage.id,
      moduleId,
      title: updatedPage.title,
      slug: updatedPage.title.toLowerCase().replace(/\s+/g, '-'),
      description: updatedPage.description || '',
      order: updatedPage.order,
      isPublished: updatedPage.isPublished ?? true,
      contentBlocks: updatedContentBlocks.length > 0 ? updatedContentBlocks : [
        {
          id: `block-${updatedPage.id}`,
          type: 'text' as const,
          order: 1,
          content: updatedPage.content || '',
          createdAt: updatedPage.createdAt,
          updatedAt: updatedPage.updatedAt
        },
        // If video URL exists, add a video block
        ...(updatedPage.videoUrl ? [
          {
            id: `video-${updatedPage.id}`,
            type: 'video' as const,
            order: 2,
            title: `${updatedPage.title} Video`,
            videoUrl: updatedPage.videoUrl,
            duration: updatedPage.duration || 0,
            createdAt: updatedPage.createdAt,
            updatedAt: updatedPage.updatedAt
          }
        ] : [])
      ],
      createdAt: updatedPage.createdAt,
      updatedAt: updatedPage.updatedAt,
      publishedAt: updatedPage.createdAt, // For simplicity, use createdAt as publishedAt
    };

    return NextResponse.json(transformedUpdatedPage);
  } catch (error) {
    console.error('[PAGE_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/modules/[moduleId]/pages/[pageId] - Delete a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; pageId: string } }
) {
  try {
    const { courseId, moduleId, pageId } = params;
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
        { error: 'You do not have permission to delete pages for this course' },
        { status: 403 }
      );
    }

    // Ensure page exists in this module and course
    const existingPage = await prisma.lesson.findFirst({
      where: {
        id: pageId,
        moduleId,
        module: {
          courseId
        }
      },
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Delete in a transaction to handle content blocks if they exist
    await prisma.$transaction(async (tx) => {
      // Try to delete content blocks if the table exists
      try {
        await tx.pageContentBlock.deleteMany({
          where: { pageId }
        });
      } catch (error) {
        // Continue if the table doesn't exist
      }
      
      // Delete the page (lesson)
      await tx.lesson.delete({
        where: { id: pageId },
      });
    });
    
    // Reorder remaining pages
    const remainingPages = await prisma.lesson.findMany({
      where: { 
        moduleId,
      },
      orderBy: { order: 'asc' },
    });

    // Update order for remaining pages
    for (let i = 0; i < remainingPages.length; i++) {
      await prisma.lesson.update({
        where: { id: remainingPages[i].id },
        data: { order: i },
      });
    }
    
    // Log activity
    await logPageActivity(userId.toString(), 'delete_page', pageId, { title: existingPage.title });
    
    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PAGE_DELETE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete page' },
      { status: 500 }
    );
  }
}
