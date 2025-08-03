import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Define the validation schema for reordering content blocks
const reorderBlocksSchema = z.object({
  blocks: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string; pageId: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { courseId, moduleId, pageId } = await params;
    
    // Validate input data
    const body = await request.json();
    const validation = reorderBlocksSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { blocks } = validation.data;

    // Use simple update operations instead of complex queries
    const results: Array<{id: string; order: number; updated: boolean; error?: string}> = [];
    
    try {
      // Use Promise.all to execute updates in parallel
      await Promise.all(blocks.map(async ({ id, order }) => {
        try {
          // Use a simpler approach to update each block
          // This avoids potential issues with table names or model references
          await prisma.$executeRawUnsafe(
            `UPDATE "ContentBlock" SET "order" = ${order} WHERE id = '${id}' AND "modulePageId" = '${pageId}'`
          );
          
          results.push({ id, order, updated: true });
        } catch (blockErr) {
          console.error(`Error updating block ${id}:`, blockErr);
          results.push({ id, order, updated: false, error: 'Failed to update block' });
        }
      }));
    } catch (batchError) {
      console.error('Error in batch update:', batchError);
    }

    // Log the action to console
    console.log(`User ${session.user.id} reordered blocks in page ${pageId} of module ${moduleId} in course ${courseId}`);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("[REORDER_BLOCKS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to reorder blocks" },
      { status: 500 }
    );
  }
}
