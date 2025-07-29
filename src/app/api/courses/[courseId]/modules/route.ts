import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
// Module type will be inferred from Prisma client

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const startTime = Date.now();
  const { courseId } = await params;
  console.log(`🔍 GET /api/courses/${courseId}/modules - Fetching modules`);
  
  try {
    console.log(`📋 Processing request for course: ${courseId}`);
    
    // Authentication
    console.log('🔐 Checking authentication...');
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      console.log('❌ Authentication failed: No user session');
      return NextResponse.json(
        { error: 'You must be logged in to view course modules' },
        { status: 401 }
      );
    }
    console.log(`✅ User authenticated: ${userId}`);
    
    // Add cache control headers to prevent stale data
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Check if the course exists and if the user has access
    console.log(`🔎 Looking up course: ${courseId}...`);
    let course;
    try {
      // Try to find by ID first, then by publicId
      course = await prisma.course.findFirst({
        where: {
          OR: [
            { id: courseId },
            { publicId: courseId }
          ]
        },
        include: {
          instructor: {
            select: { id: true }
          }
        }
      });
      console.log(`✅ Course lookup result:`, course ? 'Found' : 'Not found');
    } catch (err) {
      console.error(`❌ Database error when finding course:`, err);
      return NextResponse.json(
        { error: 'Database error when finding course', details: err instanceof Error ? err.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!course) {
      console.log(`❌ Course not found: ${courseId}`);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404, headers }
      );
    }
    console.log(`✅ Found course: ${courseId} (Published: ${course.isPublished})`);
    

    // Check if the user is the instructor
    // Convert both IDs to strings for comparison
    const isInstructor = course.instructor.id.toString() === userId.toString();

    // If not the instructor and course is not published, return 404
    if (!isInstructor && !course.isPublished) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Fetch all modules for the course with lessons
    console.log(`🔎 Fetching modules for course: ${courseId}...`);
    try {
      console.log('🔧 Using explicit field selection to avoid removed type field');
      const modules = await prisma.module.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          courseId: true,
          order: true,
          createdAt: true,
          updatedAt: true,
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              moduleId: true,
              order: true,
              videoUrl: true,
              duration: true,
              content: true,
              createdAt: true,
              updatedAt: true,
              progress: {
                where: {
                  userId: isInstructor ? undefined : userId ? Number(userId) : undefined
                },
                select: {
                  completed: true,
                  completedAt: true,
                },
              },
            },
          },
        },
      });
      
      console.log(`✅ Found ${modules.length} modules`);
      
      // Fix TypeScript errors by using proper type annotations
      const modulesWithOrder = modules.map((module: any) => ({
        ...module,
        lessons: module.lessons?.map((lesson: any) => ({
          ...lesson,
          order: lesson.order
        }))
      }));
      
      const executionTime = Date.now() - startTime;
      console.log(`⏱ Module fetch completed in ${executionTime}ms`);
      
      return NextResponse.json({ 
        data: modulesWithOrder,
        total: modulesWithOrder.length,
        executionTimeMs: executionTime 
      }, { headers });
    } catch (dbError) {
      console.error(`❌ Error fetching modules from database:`, dbError);
      return NextResponse.json(
        { error: 'Database error when fetching modules', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500, headers }
      );
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Critical error in modules API (${executionTime}ms):`, error);
    
    // Create fresh headers for the error response
    const errorHeaders = new Headers();
    errorHeaders.set('Cache-Control', 'no-store, max-age=0');
    errorHeaders.set('Pragma', 'no-cache');
    
    return NextResponse.json({ 
      error: 'Failed to fetch modules', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    }, { 
      status: 500,
      headers: errorHeaders
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  console.log('🔵 POST /api/courses/[courseId]/modules - Creating new module');
  
  try {
    const { courseId } = await params;
    console.log(`📋 Processing request for course: ${courseId}`);
    
    // Authentication
    console.log('🔐 Checking authentication...');
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      console.log('❌ Unauthorized: No user session');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to create a module' 
      }, { status: 401 });
    }
    console.log(`✅ User authenticated: ${userId}`);

    // Validate request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('📦 Request body:', requestBody);
    } catch (error) {
      console.error('❌ Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Failed to parse JSON' },
        { status: 400 }
      );
    }

    const { title, description } = requestBody;
    
    if (!title) {
      console.log('❌ Validation error: Title is required');
      return NextResponse.json(
        { 
          error: 'Validation error', 
          message: 'Title is required',
          details: { received: { title, description } }
        }, 
        { status: 400 }
      );
    }

    console.log(`🔍 Checking course and instructor permissions for course: ${courseId}`);
    let course;
    try {
      course = await prisma.course.findFirst({
        where: { 
          OR: [
            { 
              id: courseId,
              instructor: {
                id: Number(userId)
              }
            },
            { 
              publicId: courseId,
              instructor: {
                id: Number(userId)
              }
            }
          ]
        },
        select: {
          id: true,
          title: true,
          instructorId: true,
          publicId: true
        }
      });
      console.log('✅ Course lookup result:', course ? 'Found' : 'Not found or not authorized');
    } catch (error) {
      console.error('❌ Database error when finding course:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: 'Failed to verify course and permissions',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (!course) {
      console.log(`❌ Course not found or user is not the instructor`);
      return NextResponse.json(
        { 
          error: 'Not Found',
          message: 'Course not found or you are not the instructor',
          details: { courseId, userId }
        }, 
        { status: 404 }
      );
    }

    console.log('🔍 Finding the last module to determine order...');
    let lastModule;
    try {
      lastModule = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      console.log(`✅ Last module order: ${lastModule?.order ?? 'No modules yet'}`);
    } catch (error) {
      console.error('❌ Error finding last module:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: 'Failed to determine module order',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    const highestOrder = lastModule ? lastModule.order : -1;
    const newOrder = highestOrder + 1;
    
    console.log(`🆕 Creating new module with order: ${newOrder}`);
    
    try {
      const newModule = await prisma.module.create({
        data: {
          title: title.trim(),
          description: (description || '').trim(),
          courseId,
          order: newOrder,
        },
        select: {
          id: true,
          title: true,
          description: true,
          courseId: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      console.log('✅ Module created successfully:', newModule.id);
      
      // Transform the module to match client expectations
      const responseModule = {
        ...newModule,
        // Add client-expected fields that don't exist in the database
        status: 'draft',
        estimatedDuration: 0,
        duration: 0,
        isPublished: false,
        learningObjectives: [],
        prerequisites: [],
      };
      
      return NextResponse.json(responseModule, { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    } catch (error) {
      console.error('❌ Error creating module:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: 'Failed to create module',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        }
      );
    }
  } catch (error: unknown) {
    console.error('Error in POST /api/courses/[courseId]/modules:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while creating the module',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}
