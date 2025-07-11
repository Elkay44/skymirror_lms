import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Simple endpoint that doesn't rely on dynamic segments
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    console.log('Reorder request body:', body);

    if (!body.updates || !Array.isArray(body.updates) || !body.courseId) {
      return NextResponse.json({ 
        error: 'Invalid request format. Required: courseId and updates array'
      }, { status: 400 });
    }

    const { updates, courseId } = body;

    // Check if the user is authorized to modify this course
    const course = await prisma.course.findUnique({
      where: { 
        id: courseId,
        instructorId: Number(session.user.id)
      }
    });

    if (!course) {
      return NextResponse.json({ 
        error: 'Course not found or you are not authorized to modify it'
      }, { status: 403 });
    }

    // Process each update individually to avoid transaction errors
    const results = [];
    
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        continue; // Skip invalid updates
      }
      
      try {
        // Use raw SQL to ensure simplicity and avoid type issues
        await prisma.$executeRaw`
          UPDATE "Module"
          SET "order" = ${update.order}
          WHERE id = ${update.id} AND "courseId" = ${courseId}
        `;
        
        results.push({ id: update.id, success: true });
      } catch (error) {
        console.error(`Error updating module ${update.id}:`, error);
        results.push({ id: update.id, success: false, error: 'Database error' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Module order updated',
      results
    });
  } catch (error) {
    console.error('Error in module reorder API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
