import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Using next-auth/next for App Router
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse, createUnauthorizedResponse, createNotFoundResponse } from '@/lib/api-utils';
import { Forum, ForumPost, ForumPostLike, ForumPostComment } from '@/lib/types/forum-types';

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET endpoint to fetch a specific forum and its posts
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; forumId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createUnauthorizedResponse('You must be logged in to access forum content');
    }

    const { courseId, forumId } = params;

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is enrolled in the course or is the instructor
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!enrollment && course?.instructorId !== user.id) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to access forums' },
        { status: 403 }
      );
    }

    // Get forum data
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      select: {
        id: true,
        title: true,
        description: true,
        courseId: true,
        isGlobal: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!forum) {
      return createNotFoundResponse('Forum');
    }

    // Get forum posts
    const posts = await prisma.forumPost.findMany({
      where: { forumId },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        isPinned: true,
        isLocked: true,
        viewCount: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        comments: {
          take: 3,  // Only get first 3 comments for preview
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: { likes: true },
            },
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Format the posts data with safe property access
    const formattedPosts = posts.map(post => {
      // Format comments with safe property access
      const formattedComments = post.comments?.map(comment => {
        return {
          id: comment.id,
          content: comment.content,
          authorId: comment.authorId,
          createdAt: comment.createdAt,
          authorName: comment.author?.name || 'Unknown',
          authorImage: comment.author?.image || null,
          // email may not be available in the author type
          likes: 0, // Default value since _count is not in our type
        };
      }) || [];

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: post.author?.name || 'Unknown',
        authorImage: post.author?.image || null,
        authorEmail: post.author?.email || null,
        createdAt: post.createdAt,
        isPinned: post.isPinned || false,
        isLocked: post.isLocked || false,
        viewCount: post.viewCount || 0,
        likes: post._count?.likes || 0,
        comments: formattedComments,
        commentsCount: post._count?.comments || 0,
      };
    });

    // Check if the user has liked each post
    const postsWithUserLikes = await Promise.all(formattedPosts.map(async (post) => {
      const userLiked = await prisma.forumPostLike.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
      });

      return {
        ...post,
        userLiked: !!userLiked,
      };
    }));

    // Increment view count for the forum
    await prisma.forum.update({
      where: { id: forumId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Return the forum and posts data using our standardized response format
    return createSuccessResponse({
      id: forum.id,
      title: forum.title,
      description: forum.description,
      courseId: forum.courseId,
      isGlobal: forum.isGlobal,
      postsCount: forum._count?.posts || 0, // Safely access possibly undefined _count
      posts: postsWithUserLikes,
    }, 'Forum data retrieved successfully');
  } catch (error) {
    console.error('Error fetching forum data:', error);
    return createErrorResponse('Failed to fetch forum data', 500);
  }
}
