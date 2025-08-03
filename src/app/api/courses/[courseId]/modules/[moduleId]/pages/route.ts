import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[courseId]/modules/[moduleId]/pages - Get all pages for a module
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to view pages' },
        { status: 401 }
      );
    }
    
    // Verify the module exists and belongs to the course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId: courseId
      },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
            isPublished: true
          }
        }
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (instructor or enrolled student)
    const isInstructor = module.course.instructorId === userId;
    let hasAccess = isInstructor;
    
    if (!isInstructor) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId
        }
      });
      hasAccess = !!enrollment && module.course.isPublished;
    }
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // For now, return empty pages array since Page model doesn't exist in schema
    // TODO: Add Page model to Prisma schema and implement real page functionality
    const pages: any[] = [];
    
    return NextResponse.json({
      success: true,
      data: pages,
      module: {
        id: module.id,
        title: module.title,
        isPublished: true, // TODO: Add isPublished field to Module model
        courseId: module.courseId
      },
      canCreate: isInstructor,
      canEdit: isInstructor,
      canDelete: isInstructor
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/pages - Create a new page
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to create pages' },
        { status: 401 }
      );
    }
    
    // Verify the module exists and user is the instructor
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId: courseId,
        course: {
          instructorId: userId
        }
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found or access denied' },
        { status: 404 }
      );
    }
    
    // TODO: Implement page creation when Page model is added to schema
    return NextResponse.json({
      success: false,
      error: 'Page functionality not yet implemented',
      message: 'Page model needs to be added to Prisma schema'
    }, { status: 501 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
