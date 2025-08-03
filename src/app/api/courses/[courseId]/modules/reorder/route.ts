import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Verify user is course instructor
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructor: {
          id: Number(userId)
        }
      },
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    console.log('Reorder request body:', JSON.stringify(body));
    
    if (!body.updates || !Array.isArray(body.updates)) {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
    }
    
    const updates = body.updates;
    
    // Update each module individually to avoid transaction issues
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        return NextResponse.json({ 
          error: `Invalid module data: ${JSON.stringify(update)}`
        }, { status: 400 });
      }
      
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Module" SET "order" = ${update.order} WHERE id = '${update.id}' AND "courseId" = '${courseId}'`
        );
      } catch (dbError) {
        console.error(`Error updating module ${update.id}:`, dbError);
      }
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error reordering modules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
