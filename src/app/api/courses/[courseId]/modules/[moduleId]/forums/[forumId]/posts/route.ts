import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts - Get posts for a specific forum
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string } }
) {
  try {
    const { courseId, moduleId, forumId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access this resource.' },
        { status: 401 }
      );
    }

    // Get the course to check if it exists and access permissions
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        isPublished: true,
        instructorId: true,
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user is enrolled or is the instructor or an admin
    const isInstructor = course.instructorId === Number(userId);
    const isAdmin = session?.user?.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: Number(userId),
          courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] }
        }
      });

      // If the course is not published and the user is not enrolled, deny access
      if (!course.isPublished && !enrollment) {
        return NextResponse.json(
          { error: 'Course is not published. You must be enrolled to access its content.' },
          { status: 403 }
        );
      }

      // If user is not enrolled, deny access
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to access its content.' },
          { status: 403 }
        );
      }
    }

    // Parse URL for query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const sort = url.searchParams.get('sort') || 'createdAt';
    const order = url.searchParams.get('order') || 'desc';

    // Get total count for pagination
    const totalCount = await prisma.forumPost.count({
      where: { forumId: forumId }
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch forum posts with pagination, sorting, and user information
    const posts = await prisma.forumPost.findMany({
      where: { forumId: forumId },
      orderBy: {
        [sort]: order
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      },
      skip: offset,
      take: limit,
    });

    return NextResponse.json({
      posts,
      pagination: {
        total: totalCount,
        pages: totalPages,
        page: page,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum posts' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts - Create a new forum post
export async function POST(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string } }
) {
  try {
    const { courseId, moduleId, forumId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the course, module and forum exist
    const forum = await prisma.forum.findUnique({
      where: { 
        id: forumId,
        moduleId: moduleId
      }
    });

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }

    // Get the module information separately
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            isPublished: true,
            instructorId: true
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    if (module.course.id !== courseId) {
      return NextResponse.json({ error: 'Invalid course or module' }, { status: 400 });
    }

    // Check access permissions
    const isInstructor = module.course.instructorId === Number(userId);
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isInstructor && !isAdmin) {
      // For students, check if they are enrolled and the course is published
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: Number(userId),
          courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] }
        }
      });

      if (!module.course.isPublished || !enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in an active course to post in forums.' },
          { status: 403 }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    
    const postSchema = z.object({
      title: z.string().min(3).max(255),
      content: z.string().min(10),
      isPinned: z.boolean().optional().default(false),
      isLocked: z.boolean().optional().default(false)
    });

    const validation = postSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid post data', issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, content, isPinned, isLocked } = validation.data;

    // Only instructors and admins can create pinned or locked posts
    if ((isPinned || isLocked) && !isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: 'Only instructors and admins can create pinned or locked posts.' },
        { status: 403 }
      );
    }

    // Create the forum post
    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        isPinned: isPinned || false,
        isLocked: isLocked || false,
        viewCount: 0,
        forum: { connect: { id: forumId } },
        author: { connect: { id: Number(userId) } }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { error: 'Failed to create forum post' },
      { status: 500 }
    );
  }
}
