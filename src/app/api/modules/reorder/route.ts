import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Simple endpoint that doesn't rely on dynamic segments
export async function PATCH(request: NextRequest) {
  console.log('📥 Module reorder API called');
  const requestStartTime = Date.now();
  try {
    // Authenticate the user
    console.log('👤 Authenticating user...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ Authentication failed: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`✅ User authenticated: ${session.user.id}`);

    // Parse the request body
    console.log('📦 Parsing request body...');
    let body;
    try {
      body = await request.json();
      console.log('📄 Request payload:', JSON.stringify(body));
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body'
      }, { status: 400 });
    }

    // Validate the request structure
    if (!body.updates || !Array.isArray(body.updates) || !body.courseId) {
      console.log('❌ Invalid request format:', body);
      return NextResponse.json({ 
        error: 'Invalid request format. Required: courseId and updates array'
      }, { status: 400 });
    }

    const { updates, courseId } = body;
    console.log(`📋 Processing ${updates.length} module updates for course ${courseId}`);

    // Check if the user is authorized to modify this course
    console.log(`🔐 Checking authorization for course ${courseId}...`);
    
    // First get the course
    const course = await prisma.course.findUnique({
      where: { 
        id: courseId
      }
    });

    if (!course) {
      console.log(`❌ Course not found: ${courseId}`);
      return NextResponse.json({ 
        error: 'Course not found'
      }, { status: 404 });
    }

    // Then check if the current user is the instructor
    if (course.instructorId !== Number(session.user.id)) {
      console.log(`❌ Authorization failed: User ${session.user.id} not authorized for course ${courseId}`);
      return NextResponse.json({ 
        error: 'You are not authorized to modify this course'
      }, { status: 403 });
    }
    console.log('✅ Authorization check passed');
    

    // Process each update individually to avoid transaction errors
    console.log('⚙️ Starting module order updates...');
    const results = [];
    let updateSuccessCount = 0;
    
    for (const update of updates) {
      // Validate each update item
      if (!update.id || typeof update.order !== 'number') {
        console.log(`⚠️ Skipping invalid update: ${JSON.stringify(update)}`);
        results.push({ id: update.id || 'unknown', success: false, error: 'Invalid update format' });
        continue;
      }
      
      try {
        console.log(`📝 Updating module ${update.id} to order ${update.order}...`);
        
        // Use the most basic SQL update possible to avoid issues
        const result = await prisma.$executeRaw`
          UPDATE "Module"
          SET "order" = ${update.order}
          WHERE "id" = ${update.id} AND "courseId" = ${courseId}
        `;
        
        console.log(`✅ Module ${update.id} updated successfully, result:`, result);
        results.push({ id: update.id, success: true });
        updateSuccessCount++;
      } catch (error) {
        console.error(`❌ Error updating module ${update.id}:`, error);
        results.push({ 
          id: update.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown database error' 
        });
      }
    }

    // Calculate execution time
    const executionTime = Date.now() - requestStartTime;
    console.log(`⏱️ Module reorder API completed in ${executionTime}ms with ${updateSuccessCount}/${updates.length} successful updates`);
    
    // Revalidate cache paths to ensure fresh data
    if (updateSuccessCount > 0) {
      console.log(`🔄 Revalidating cache for course ${courseId}...`);
      try {
        // Revalidate the instructor modules page
        revalidatePath(`/dashboard/instructor/courses/${courseId}/modules`);
        
        // Revalidate the course page if published
        if (course.isPublished) {
          revalidatePath(`/courses/${courseId}`);
        }
        
        // Revalidate the API endpoints
        revalidatePath(`/api/courses/${courseId}/modules`);
        
        console.log('✅ Cache revalidation complete');
      } catch (cacheError) {
        console.error('❌ Cache revalidation error:', cacheError);
        // Continue anyway since the database update was successful
      }
    }

    return NextResponse.json({
      success: updateSuccessCount > 0,
      message: updateSuccessCount > 0 
        ? `Successfully updated ${updateSuccessCount} of ${updates.length} modules` 
        : 'No modules were updated',
      results,
      executionTimeMs: executionTime
    });
  } catch (error) {
    const executionTime = Date.now() - requestStartTime;
    console.error(`❌ Critical error in module reorder API (${executionTime}ms):`, error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error processing module reorder request', 
      details: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: executionTime
    }, { status: 500 });
  }
}
