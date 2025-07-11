import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Forum creation validation schema
const createForumSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  courseId: z.string().uuid('Invalid course ID'),
  isPublished: z.boolean().optional(),
  allowAnonymousPosts: z.boolean().optional(),
  requireModeration: z.boolean().optional(),
});

// Log forum activity
const logForumActivity = async (userId: string | number, action: string, forumId: string, details: any = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: 'forum',
        entityId: forumId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log forum activity:', error);
    // Non-blocking - we don't fail the request if logging fails
  }
};

// GET handler - Get all forums or filter by courseId
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = session.user.id;
    const role = session.user.role;
    
    // Query parameters
    let where: any = {};
    
    if (courseId) {
      where.courseId = courseId;
      
      // For students, check course enrollment
      if (role === 'STUDENT') {
        // Check if student is enrolled in this course
        const enrollment = await prisma.enrollment.findFirst({
          where: { 
            courseId, 
            userId: parseInt(userId.toString(), 10) // Convert string to number
          },
        });
        
        if (!enrollment) {
          return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
        }
      }
    } else {
      // If no courseId is specified, filter based on user role
      if (role === 'STUDENT') {
        // Students can only see forums from courses they're enrolled in
        where.course = {
          enrollments: {
            some: { userId },
          },
        };
      } else if (role === 'INSTRUCTOR') {
        // Instructors see forums from courses they teach
        where.course = {
          instructorId: userId,
        };
      }
    }
    
    // Get forums with optional filtering
    const forums = await prisma.forum.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });
    
    return NextResponse.json({ forums });
  } catch (error: any) {
    console.error('Error getting forums:', error);
    return NextResponse.json({ error: 'Failed to fetch forums' }, { status: 500 });
  }
}

// POST handler - Create a new forum
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors and admins can create forums
    const role = session.user.role;
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only instructors and administrators can create forums' }, { status: 403 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Get request body
    const body = await request.json();
    
    // Validate input
    const validationResult = createForumSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { 
      title, 
      description, 
      courseId, 
      isPublished,
      allowAnonymousPosts,
      requireModeration,
    } = validationResult.data;
    
    // Check if course exists and user has access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // If instructor, check they teach this course
    // Compare as strings to ensure consistent comparison
    const instructorId = course.instructorId?.toString();
    if (role === 'INSTRUCTOR' && instructorId !== userId.toString()) {
      return NextResponse.json({ error: 'You do not have permission to create forums for this course' }, { status: 403 });
    }
    
    // Create forum
    const forum = await prisma.forum.create({
      data: {
        title,
        description: description || '',
        courseId,
        isPublished: isPublished ?? false,
        allowAnonymousPosts: allowAnonymousPosts ?? false,
        requireModeration: requireModeration ?? false,
        createdById: userId,
      },
    });
    
    // Log activity
    await logForumActivity(userId.toString(), 'create_forum', forum.id, { title, courseId });
    
    // Revalidate cache
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/forums`);
    
    return NextResponse.json({ forum }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating forum:', error);
    return NextResponse.json({ error: 'Failed to create forum' }, { status: 500 });
  }
}
