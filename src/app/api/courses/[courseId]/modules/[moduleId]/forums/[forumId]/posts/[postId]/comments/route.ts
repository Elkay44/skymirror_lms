import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts/[postId]/comments
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string; postId: string } }
) {
  try {
    const { courseId, moduleId, forumId, postId } = params;
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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.forumComment.count({
      where: { postId: postId }
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch comments with pagination and user information
    const comments = await prisma.forumComment.findMany({
      where: { postId: postId },
      orderBy: {
        createdAt: 'asc' // Show oldest comments first
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
      },
      skip: offset,
      take: limit,
    });

    return NextResponse.json({
      comments,
      pagination: {
        total: totalCount,
        pages: totalPages,
        page: page,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/modules/[moduleId]/forums/[forumId]/posts/[postId]/comments
export async function POST(
  request: Request,
  { params }: { params: { courseId: string; moduleId: string; forumId: string; postId: string } }
) {
  try {
    const { courseId, moduleId, forumId, postId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the post exists and belongs to the specified forum
    const post = await prisma.forumPost.findFirst({
      where: { 
        id: postId,
        forumId: forumId
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Check if the post is locked
    if (post.isLocked) {
      return NextResponse.json(
        { error: 'This post is locked and does not accept new comments' },
        { status: 403 }
      );
    }
    
    // Get the forum to validate it exists
    const forum = await prisma.forum.findUnique({
      where: { id: forumId }
    });
    
    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }
    
    // Get the module
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
    
    if (!module || module.courseId !== courseId) {
      return NextResponse.json({ error: 'Invalid module or course' }, { status: 400 });
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
          { error: 'You must be enrolled in an active course to comment on posts.' },
          { status: 403 }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    
    const commentSchema = z.object({
      content: z.string().min(3).max(2000),
      parentCommentId: z.string().optional()
    });

    const validation = commentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid comment data', issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { content, parentCommentId } = validation.data;

    // If this is a reply, verify that the parent comment exists and belongs to the same post
    if (parentCommentId) {
      const parentComment = await prisma.forumComment.findUnique({
        where: { 
          id: parentCommentId,
          postId: postId
        }
      });
      
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found or does not belong to this post' },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.forumComment.create({
      data: {
        content,
        parentCommentId,
        post: { connect: { id: postId } },
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

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
