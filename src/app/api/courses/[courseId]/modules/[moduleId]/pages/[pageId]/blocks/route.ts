import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for creating or updating page content blocks
const contentBlocksSchema = z.array(
  z.object({
    id: z.string().optional(), // Optional for existing blocks
    type: z.enum(['text', 'image', 'video', 'code', 'embed']),
    content: z.string(),
    order: z.number().int().optional(),
    metadata: z.record(z.string(), z.any()).optional()
  })
);

// Log page content activity
const logPageContentActivity = async (userId: string | number, action: string, pageId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId.toString(),
        action,
        entityType: 'page_content',
        entityId: pageId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log page content activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET /api/courses/[courseId]/modules/[moduleId]/pages/[pageId]/blocks - Get all content blocks for a page
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

    const isInstructor = course?.instructorId === parseInt(userId.toString(), 10);

    if (!isInstructor) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: parseInt(userId.toString(), 10), 
          courseId, 
          status: { in: ['ACTIVE', 'COMPLETED'] } 
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to view page content' },
          { status: 403 }
        );
      }
    }

    // Verify page exists in this module
    const page = await prisma.lesson.findFirst({
      where: {
        id: pageId,
        moduleId,
        module: {
          courseId
        }
      }
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Try to fetch content blocks
    try {
      const blocks = await prisma.pageContentBlock.findMany({
        where: { pageId },
        orderBy: { order: 'asc' }
      });

      return NextResponse.json({ data: blocks });
    } catch (error) {
      console.error('Failed to fetch content blocks, table might not exist:', error);
      
      // Return fallback content blocks based on page content and video
      const fallbackBlocks = [
        {
          id: `text-${page.id}`,
          type: 'text',
          content: page.content || '',
          order: 0,
          metadata: {}
        }
      ];

      // Add video block if present
      if (page.videoUrl) {
        fallbackBlocks.push({
          id: `video-${page.id}`,
          type: 'video',
          content: page.title || 'Video Content',
          order: 1,
          metadata: {
            videoUrl: page.videoUrl,
            duration: page.duration || 0
          }
        });
      }

      return NextResponse.json({ 
        data: fallbackBlocks,
        warning: 'Using fallback content blocks from legacy page structure'
      });
    }
  } catch (error) {
    console.error('[PAGE_BLOCKS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch page content blocks' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[courseId]/modules/[moduleId]/pages/[pageId]/blocks - Update all content blocks for a page
export async function PUT(
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
        instructorId: parseInt(userId.toString(), 10)
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to update page content' },
        { status: 403 }
      );
    }

    // Verify page exists in this module
    const page = await prisma.lesson.findFirst({
      where: {
        id: pageId,
        moduleId,
        module: {
          courseId
        }
      }
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = contentBlocksSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const contentBlocks = validationResult.data;

    // Extract main content and video URL for backward compatibility
    let mainContent = '';
    let videoUrl = null;

    for (const block of contentBlocks) {
      // Use the first text block as the main content
      if (block.type === 'text' && !mainContent) {
        mainContent = block.content;
      }
      
      // Use the first video block's URL
      if (block.type === 'video' && !videoUrl && block.metadata?.videoUrl) {
        videoUrl = block.metadata.videoUrl;
      }
    }

    // Update in a transaction to ensure consistency
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update the lesson with main content and video URL
        const updatedPage = await tx.lesson.update({
          where: { id: pageId },
          data: {
            content: mainContent,
            videoUrl: videoUrl
          }
        });

        // Try to use the pageContentBlock table if it exists
        try {
          // Delete existing content blocks
          await tx.pageContentBlock.deleteMany({
            where: { pageId }
          });

          // Create new content blocks
          const createdBlocks = [];
          for (let i = 0; i < contentBlocks.length; i++) {
            const block = contentBlocks[i];
            const createdBlock = await tx.pageContentBlock.create({
              data: {
                pageId,
                type: block.type,
                content: block.content,
                order: block.order !== undefined ? block.order : i,
                metadata: block.metadata ? JSON.stringify(block.metadata) : null
              }
            });
            createdBlocks.push(createdBlock);
          }
          
          return { 
            page: updatedPage, 
            blocks: createdBlocks,
            usedContentBlocksTable: true
          };
        } catch (error) {
          console.error('Failed to use pageContentBlock table:', error);
          // Return just the page if content blocks table doesn't exist
          return { 
            page: updatedPage, 
            blocks: contentBlocks,
            usedContentBlocksTable: false
          };
        }
      });

      // Log activity
      await logPageContentActivity(userId.toString(), 'update_page_content', pageId, {
        blockCount: contentBlocks.length
      });

      // Revalidate paths
      revalidatePath(`/courses/${courseId}`);
      revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
      revalidatePath(`/courses/${courseId}/modules/${moduleId}/pages/${pageId}`);

      return NextResponse.json({
        data: result.blocks,
        usedContentBlocksTable: result.usedContentBlocksTable
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      throw new Error(`Failed to update page content: ${error.message}`);
    }
  } catch (error: any) {
    console.error('[PAGE_BLOCKS_PUT]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update page content blocks' },
      { status: 500 }
    );
  }
}
