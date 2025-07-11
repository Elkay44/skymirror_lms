import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { ForumPostType, ForumAttachment } from '@/types/forum';
import { ForumPost } from '@/lib/types/forum-types';
import { revalidatePath } from 'next/cache';

// Schema for forum operations
const forumPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters long'),
  pinned: z.boolean().optional().default(false),
  isQuestion: z.boolean().optional(),
  tagList: z.array(z.string()).optional().default([]),
  allowComments: z.boolean().optional().default(true),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string().url('Invalid URL'),
      size: z.number().optional(),
      type: z.string().optional()
    })
  ).optional().default([])
});

// Schema for comment operations
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000),
  parentId: z.string().optional(),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string().url('Invalid URL'),
      size: z.number().optional(),
      type: z.string().optional()
    })
  ).optional().default([])
});

// Schema for pagination and filtering
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'commentCount', 'viewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filter: z.enum(['all', 'announcements', 'questions', 'pinned', 'mine', 'unanswered', 'popular']).optional().default('all'),
  tag: z.string().optional(),
  search: z.string().optional(),
});

// Ensure the route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/courses/[courseId]/forums/advanced - Get forum posts with filtering and pagination
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    
    // Check if user is authorized to access this course
    const enrollment = userId ? await prisma.enrollment.findFirst({
      where: {
        courseId,
        userId,
        status: 'ACTIVE'
      }
    }) : null;
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        instructorId: true
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const isInstructor = userId === course.instructorId;
    const isAdmin = session?.user?.role === 'ADMIN';
    
    // Check if course is public or user is enrolled/instructor/admin
    if (!course.isPublished && !isInstructor && !isAdmin && !enrollment) {
      return NextResponse.json(
        { error: 'You do not have access to this course forum' },
        { status: 403 }
      );
    }
    
    // Parse query parameters for pagination and filtering
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      filter,
      tag,
      search
    } = paginationSchema.parse(searchParams);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the filter conditions
    const whereConditions: any = {
      courseId
    };
    
    // Apply additional filters
    if (filter === 'announcements') {
      whereConditions.type = 'ANNOUNCEMENT';
    }
    
    if (filter === 'questions') {
      whereConditions.type = 'QUESTION';
    }
    
    if (filter === 'pinned') {
      whereConditions.pinned = true;
    }
    
    if (filter === 'mine' && userId) {
      whereConditions.authorId = userId;
    }
    
    if (filter === 'unanswered') {
      whereConditions.type = 'QUESTION';
      whereConditions.resolved = false;
    }
    
    // For tags filter
    if (tag) {
      whereConditions.tagList = {
        hasSome: [tag]
      };
    }
    
    // For text search
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.forumPost.count({
      where: whereConditions
    });
    
    const totalPages = Math.ceil(totalCount / limit);
    
    // Set up sorting
    let orderBy: any = {};
    
    // Handle sorting
    switch (sortBy) {
      case 'commentCount':
        orderBy = { comments: { _count: sortOrder } };
        break;
      case 'viewCount':
        orderBy = { views: sortOrder };
        break;
      default:
        orderBy[sortBy] = sortOrder;
    }
    
    // Get forum posts with related data
    const posts = await prisma.forumPost.findMany({
      where: whereConditions,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        comments: {
          take: 3, // Just get a sample for preview
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            forumPostView: true
          }
        },
        likes: userId ? {
          where: {
            userId
          }
        } : undefined
      },
      orderBy,
      skip,
      take: limit
    });
    
    // Additional sorting for popular posts if needed
    let sortedPosts = [...posts];
    if (filter === 'popular') {
      sortedPosts = sortedPosts.sort((a, b) => {
        // Calculate a popularity score based on comments, likes and views
        const scoreA = ((a._count?.comments || 0) * 2) + (a._count?.likes || 0) + (a.viewCount || 0) / 10;
        const scoreB = ((b._count?.comments || 0) * 2) + (b._count?.likes || 0) + (b.viewCount || 0) / 10;
        return scoreB - scoreA; // Higher score first for popular
      });
    }
    
    // Transform posts for the response
    const formattedPosts = sortedPosts.map(post => {
      const userLiked = post.likes && post.likes.length > 0;
        
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        pinned: post.isPinned, 
        // Provide default values for missing properties in the interface
        type: 'DISCUSSION', // Default type 
        resolved: false,    // Default resolved status
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        tagList: [], // Empty array as default since tagList doesn't exist
        attachments: [], // Empty array as default since attachments doesn't exist
        views: post.viewCount ?? 0,
        commentCount: post._count?.comments ?? 0,
        likeCount: post._count?.likes ?? 0,
        userLiked
      };
    });
    
    // If user is viewing, increment the view count (async)
    if (userId) {
      // Use a non-blocking operation to update view counts
      Promise.all(posts.map(async (post) => {
        // Note: Since ForumPostView doesn't exist in the schema, we'll update the viewCount directly
        // instead of creating a separate view record
        await prisma.forumPost.update({
          where: { id: post.id },
          data: { viewCount: { increment: 1 } }
        });
      })).catch(error => {
        console.error('[VIEW_COUNT_UPDATE_ERROR]', error);
      });
    }
    
    // Get counts for metadata
    const forumStats = await prisma.$queryRaw<Array<{ total_posts: string, total_comments: string, unanswered: string }>>`
      SELECT 
        COUNT(fp.id) as total_posts,
        COALESCE(SUM((SELECT COUNT(*) FROM "ForumComment" fc WHERE fc."postId" = fp.id)), 0) as total_comments,
        COUNT(CASE WHEN fp."type" = 'QUESTION' AND fp."isLocked" = false THEN 1 END) as unanswered
      FROM "ForumPost" fp 
      WHERE fp."forumId" IN (SELECT id FROM "Forum" WHERE "courseId" = ${courseId})
    `;
    
    // totalCount and totalPages were already calculated earlier in the code
    
    // Return the forum posts with metadata
    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        totalPosts: totalCount,
        totalPages
      },
      stats: forumStats.length > 0 ? {
        totalPosts: parseInt(forumStats[0].total_posts),
        totalComments: parseInt(forumStats[0].total_comments),
        unansweredQuestions: parseInt(forumStats[0].unanswered)
      } : {
        totalPosts: 0,
        totalComments: 0,
        unansweredQuestions: 0
      }
    });
  } catch (error) {
    console.error('[CREATE_FORUM_POST_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create forum post', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Define additional methods as needed (PATCH, DELETE, etc.)
// PATCH could be used to update a post or toggle resolution status
// DELETE would be for removing posts
