import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for creating/updating a comment
const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment cannot exceed 2000 characters'),
  parentId: z.string().optional(), // For replies to other comments
});

// Schema for pagination and filtering
const commentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['newest', 'oldest', 'popular']).default('newest'),
});

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/courses/[courseId]/discussions/[discussionId]/comments - Get comments for a discussion
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; discussionId: string } }
) {
  try {
    const { courseId, discussionId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    
    // Extract query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    // Parse and validate query parameters
    const { page, limit, sortBy } = commentQuerySchema.parse(searchParams);
    
    // Calculate pagination offsets
    const skip = (page - 1) * limit;
    
    // Verify the discussion exists and belongs to the specified course
    const discussion = await prisma.discussionPost.findUnique({
      where: {
        id: discussionId,
        courseId,
      },
    });
    
    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found or does not belong to this course' },
        { status: 404 }
      );
    }
    
    // Check if the user is enrolled in the course, is the instructor, or is an admin
    if (userId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          instructorId: true,
          enrollments: {
            where: { userId }
          }
        }
      });
      
      const isInstructor = course?.instructorId === userId;
      const isEnrolled = course?.enrollments && course.enrollments.length > 0;
      
      if (!isInstructor && !isEnrolled) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        
        if (user?.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'You must be enrolled in this course to access comments' },
            { status: 403 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get total count for pagination
    const totalCount = await prisma.comment.count({
      where: {
        discussionId,
        parentId: null, // Only count top-level comments
      }
    });
    
    // Determine sorting order
    let orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { 
          likes: {
            _count: 'desc'
          }
        };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }
    
    // Fetch top-level comments with pagination and sorting
    const comments = await prisma.comment.findMany({
      where: {
        discussionId,
        parentId: null, // Only fetch top-level comments
      },
      orderBy,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          }
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          }
        },
        likes: userId ? {
          where: {
            userId
          }
        } : undefined,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              }
            },
            _count: {
              select: {
                likes: true,
              }
            },
            likes: userId ? {
              where: {
                userId
              }
            } : undefined,
          }
        }
      }
    });
    
    // Transform comments data
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
      likeCount: comment._count.likes,
      isLiked: userId ? comment.likes.length > 0 : false,
      replyCount: comment._count.replies,
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        user: reply.user,
        likeCount: reply._count.likes,
        isLiked: userId ? reply.likes.length > 0 : false,
      })),
      isInstructorComment: comment.user.role === 'INSTRUCTOR' || comment.user.role === 'ADMIN',
    }));
    
    return NextResponse.json({
      comments: transformedComments,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      },
      sortBy
    });
  } catch (error) {
    console.error('[GET_COMMENTS_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/discussions/[discussionId]/comments - Create a comment
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; discussionId: string } }
) {
  try {
    const { courseId, discussionId } = params;
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Verify the discussion exists and belongs to the specified course
    const discussion = await prisma.discussionPost.findUnique({
      where: {
        id: discussionId,
        courseId,
      },
      include: {
        user: {
          select: { id: true }
        }
      }
    });
    
    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found or does not belong to this course' },
        { status: 404 }
      );
    }
    
    // Check if the user is enrolled in the course, is the instructor, or is an admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        instructorId: true,
        enrollments: {
          where: { userId }
        }
      }
    });
    
    const isInstructor = course?.instructorId === userId;
    const isEnrolled = course?.enrollments && course.enrollments.length > 0;
    
    if (!isInstructor && !isEnrolled) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to comment' },
          { status: 403 }
        );
      }
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const { content, parentId } = commentSchema.parse(body);
    
    // If parentId is provided, verify it exists and belongs to the discussion
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: {
          id: parentId,
          discussionId,
        }
      });
      
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found or does not belong to this discussion' },
          { status: 400 }
        );
      }
      
      // Prevent nested replies (only allow one level of replies)
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: 'Nested replies are not supported. You can only reply to top-level comments' },
          { status: 400 }
        );
      }
    }
    
    // Get user role for the response
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, image: true }
    });
    
    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        discussionId,
        userId,
        parentId
      }
    });
    
    // If this is a reply to a comment, create a notification for the comment author
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true }
      });
      
      if (parentComment && parentComment.userId !== userId) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            title: 'New Reply to Your Comment',
            message: `${user?.name || 'Someone'} replied to your comment`,
            type: 'COMMENT',
            linkUrl: `/courses/${courseId}/discussions/${discussionId}#comment-${comment.id}`
          }
        });
      }
    } 
    // If this is a comment on a discussion, notify the discussion author
    else if (discussion.user.id !== userId) {
      await prisma.notification.create({
        data: {
          userId: discussion.user.id,
          title: 'New Comment on Your Discussion',
          message: `${user?.name || 'Someone'} commented on your discussion "${discussion.title}"`,
          type: 'COMMENT',
          linkUrl: `/courses/${courseId}/discussions/${discussionId}#comment-${comment.id}`
        }
      });
    }
    
    // If this is an instructor/admin responding to a question, mark it as answered
    if ((isInstructor || user?.role === 'ADMIN') && discussion.type === 'QUESTION') {
      await prisma.discussionPost.update({
        where: { id: discussionId },
        data: { isAnswered: true }
      });
    }
    
    return NextResponse.json({
      message: parentId ? 'Reply added successfully' : 'Comment added successfully',
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: {
          id: userId,
          name: user?.name,
          image: user?.image,
          role: user?.role
        },
        likeCount: 0,
        isLiked: false,
        isInstructorComment: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'
      }
    });
  } catch (error) {
    console.error('[CREATE_COMMENT_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
