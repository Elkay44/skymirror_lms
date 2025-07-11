import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Module } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  console.log(`🔍 GET /api/courses/${params.courseId}/modules - Fetching modules`);
  const startTime = Date.now();
  
  try {
    const { courseId } = params;
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
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true }
        }
      }
    }).catch(err => {
      console.error(`❌ Database error when finding course:`, err);
      return null;
    });

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
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId, instructorId: Number(userId) },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found or you are not the instructor' }, { status: 404 });
    }

    const { title, description, status, learningObjectives, estimatedDuration, prerequisites } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Find the last module to determine the new order.
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const highestOrder = lastModule ? lastModule.order : -1;

    // Create the new module with order field
    const newModule = await prisma.module.create({
      data: {
        title,
        description: description || '',
        courseId,
        order: highestOrder + 1,
      },
    });

    // Transform the module to match client expectations
    const responseModule = {
      id: newModule.id,
      title: newModule.title,
      description: newModule.description,
      courseId: newModule.courseId,
      order: newModule.order, 
      createdAt: newModule.createdAt,
      updatedAt: newModule.updatedAt,
      // Add client-expected fields that don't exist in the database
      status: 'draft',
      estimatedDuration: 0,
      duration: 0,
      isPublished: false,
      learningObjectives: [],
      prerequisites: [],
    };
    
    return NextResponse.json(responseModule, { status: 201 });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}
