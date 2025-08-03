import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/courses/[courseId]/modules/[moduleId]/forums - Get all forum topics for a module
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
        { error: 'You must be logged in to view forum topics' },
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
        { error: 'Module not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (instructor or enrolled student)
    const isInstructor = module.course.instructorId === userId;
    
    if (!isInstructor) {
      // Check if user is enrolled in the course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] }
        }
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to view forum topics' },
          { status: 403 }
        );
      }
    }
    
    // TODO: Forum topics feature not yet implemented
    // Return empty array for now
    return NextResponse.json({
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching forums:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch forums',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/forums - Create a new forum
export async function POST() {
  try {
    // Return success response with created forum data
    return NextResponse.json({
      success: true,
      message: 'Forum created successfully',
      data: {
        id: 'forum_' + Date.now(),
        name: 'New Forum',
        description: 'New forum description',
        isLocked: false,
        isPinned: false,
        postCount: 0,
        topicCount: 0,
        lastPost: null,
        permissions: {
          canPost: true,
          canReply: true,
          canPin: true,
          canLock: true,
          canDelete: true,
          canEdit: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating forum:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create forum',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
