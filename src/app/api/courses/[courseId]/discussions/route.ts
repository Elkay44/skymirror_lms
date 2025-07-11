import { NextRequest, NextResponse } from 'next/server';
import prismaBase from '@/lib/prisma';
import { extendPrismaClient } from '@/lib/prisma-extensions';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { withErrorHandling, CommonErrors } from '@/lib/api-response';
import { logCourseActivity, ActivityAction } from '@/lib/activity-log';
import { getFromCache, setCache, invalidateCache } from '@/lib/cache';

// Define types for discussions
type DiscussionWithUser = {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  user: {
    id: number;
    name: string | null;
    image: string | null;
    role: string;
  };
  [key: string]: any;
};

// Extend the prisma client with our custom extensions
const prisma = extendPrismaClient(prismaBase);

// Schema for creating a new discussion post
const discussionPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100, 'Title cannot exceed 100 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters long'),
  type: z.enum(['QUESTION', 'DISCUSSION', 'ANNOUNCEMENT', 'RESOURCE']).default('DISCUSSION'),
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  allowComments: z.boolean().default(true)
});

// Schema for pagination and filtering
const discussionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  type: z.enum(['ALL', 'QUESTION', 'DISCUSSION', 'ANNOUNCEMENT', 'RESOURCE']).default('ALL'),
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
  sortBy: z.enum(['recent', 'popular', 'unanswered', 'oldest', 'most_comments']).default('recent'),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  userId: z.coerce.number().optional(),
  pinnedOnly: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
  answered: z.enum(['true', 'false', 'all']).default('all'),
  timeframe: z.enum(['today', 'week', 'month', 'year', 'all']).default('all'),
});

// Schema for updating a discussion post's pin status
const pinDiscussionSchema = z.object({
  isPinned: z.boolean()
});

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/courses/[courseId]/discussions - Get all discussions for a course
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  return withErrorHandling(async () => {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    
    // Extract query parameters
    const reqUrl = new URL(req.url);
    const page = reqUrl.searchParams.get('page') ? parseInt(reqUrl.searchParams.get('page') as string, 10) : 1;
    const limit = reqUrl.searchParams.get('limit') ? parseInt(reqUrl.searchParams.get('limit') as string, 10) : 10;
    const moduleId = reqUrl.searchParams.get('moduleId');
    const lessonId = reqUrl.searchParams.get('lessonId');
    const type = reqUrl.searchParams.get('type') as 'QUESTION' | 'DISCUSSION' | 'ALL' | undefined;
    const sortBy = reqUrl.searchParams.get('sortBy') as 'recent' | 'oldest' | 'popular' | 'most_comments' | 'unanswered' | undefined || 'recent';
    const search = reqUrl.searchParams.get('search');
    const userIdFilter = reqUrl.searchParams.get('userId');
    const pinnedOnly = reqUrl.searchParams.get('pinnedOnly') === 'true';
    const answered = reqUrl.searchParams.get('answered');
    const timeframe = reqUrl.searchParams.get('timeframe');
    const tags = reqUrl.searchParams.getAll('tags');
    const onlyMine = reqUrl.searchParams.get('onlyMine') === 'true';
    const onlyResolved = reqUrl.searchParams.get('onlyResolved') === 'true';
    const onlyUnresolved = reqUrl.searchParams.get('onlyUnresolved') === 'true';
    const onlyPinned = reqUrl.searchParams.get('onlyPinned') === 'true';
    
    // Calculate pagination offsets
    const skip = (page - 1) * limit;

    // Check if the user is enrolled in the course or is the instructor
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
      
      // If the user is not an instructor or enrolled student, check if they have admin role
      if (!isInstructor && !isEnrolled) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        
        if (user?.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'You must be enrolled in this course to access discussions' },
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
    
    // Build where clause for filtering
    const whereClause: any = {
      courseId
    };
    
    // Add type filter if provided and not ALL
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }
    
    // Add moduleId filter if provided
    if (moduleId) {
      whereClause.moduleId = moduleId;
    }
    
    // Add lessonId filter if provided
    if (lessonId) {
      whereClause.lessonId = lessonId;
    }
    
    // Add user filter if provided
    if (userIdFilter) {
      whereClause.userId = Number(userIdFilter);
    }
    
    // Add pinned filter if true
    if (pinnedOnly) {
      whereClause.isPinned = true;
    }
    
    // Add answered filter for questions
    if (answered === 'true') {
      whereClause.isAnswered = true;
    } else if (answered === 'false') {
      whereClause.isAnswered = false;
    }
    
    // Add timeframe filter
    if (timeframe && timeframe !== 'all') {
      const now = new Date();
      let startDate;
      
      switch(timeframe) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      if (startDate) {
        whereClause.createdAt = { gte: startDate };
      }
    }
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add tags filter if provided
    if (tags && tags.length > 0) {
      // Since tags are stored as a JSON string, we need to check if any tag in the array is contained
      // This is a simplified approach - more complex tag filtering might require a different schema
      whereClause.OR = [
        ...(whereClause.OR || []),
        ...tags.map((tag: string) => ({
          tags: { contains: tag, mode: 'insensitive' }
        }))
      ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.discussionPost.count({
      where: whereClause
    });
    
    // Build orderBy clause based on sortBy parameter
    let orderBy: any = {};
    switch (sortBy) {
      case 'recent':
        orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'oldest':
        orderBy = [{ isPinned: 'desc' }, { createdAt: 'asc' }];
        break;
      case 'popular':
        orderBy = [{ isPinned: 'desc' }, { likesCount: 'desc' }, { viewCount: 'desc' }];
        break;
      case 'most_comments':
        orderBy = [{ isPinned: 'desc' }, { commentsCount: 'desc' }];
        break;
      case 'unanswered':
        if (whereClause.type !== 'QUESTION') {
          whereClause.type = 'QUESTION';
        }
        whereClause.isAnswered = false;
        orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
        break;
      default:
        orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    }
    
    // Get discussions with pagination
    const discussions = await prisma.discussionPost.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    });
    
    // Convert tags from string to array
    const parsedData = discussions.map((d: DiscussionWithUser) => {
      try {
        const tags = d.tags ? JSON.parse(d.tags) : [];
        const author = {
          id: d.user.id,
          name: d.user.name,
          image: d.user.image,
          role: d.user.role,
          isInstructor: d.user.role === 'INSTRUCTOR' || d.user.role === 'ADMIN'
        };
        return { ...d, tags, author };
      } catch (error) {
        return { ...d, tags: [], author: d.user };
      }
    });
    
    // Increment view count for returned discussions
    const discussionIds = discussions.map((d: { id: string }) => d.id);
    if (discussionIds.length > 0) {
      await prisma.$transaction(
        discussionIds.map((id: string) =>
          prisma.discussionPost.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
          })
        )
      );
    }
    
    // Format the response to include counts and transform the data
    const formattedDiscussions = parsedData.map((discussion: DiscussionWithUser) => ({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      type: discussion.type,
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      isAnswered: discussion.isAnswered,
      isPinned: discussion.isPinned || false,
      isPrivate: discussion.isPrivate || false,
      allowComments: discussion.allowComments !== false, // Default to true if field doesn't exist
      moduleId: discussion.moduleId,
      lessonId: discussion.lessonId,
      viewCount: discussion.viewCount || 0,
      tags: discussion.tags,
      author: discussion.author,
      commentsCount: discussion._count.comments,
      likesCount: discussion._count.likes,
    }));
    
    // Get some summary statistics
    const summaryStats = await prisma.$transaction([
      prisma.discussionPost.count({
        where: {
          courseId,
          type: 'QUESTION',
          isAnswered: false
        }
      }),
      prisma.discussionPost.count({
        where: {
          courseId,
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      })
    ]);
    
    const [unansweredQuestionsCount, newPostsLastWeekCount] = summaryStats;
    
    // Return the formatted discussions with pagination and summary stats
    return NextResponse.json({
      discussions: formattedDiscussions,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + discussions.length < totalCount
      },
      stats: {
        unansweredQuestionsCount,
        newPostsLastWeekCount
      }
    });
  }, 'Error fetching discussions');
}

// POST /api/courses/[courseId]/discussions - Create a new discussion
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  return withErrorHandling(async () => {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Check if the user is enrolled in the course or is the instructor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        instructorId: true,
        enrollments: {
          where: { userId }
        }
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const isInstructor = course.instructorId === userId;
    const isEnrolled = course.enrollments && course.enrollments.length > 0;
    
    // If the user is not an instructor or enrolled student, check if they have admin role
    if (!isInstructor && !isEnrolled) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to create discussions' },
          { status: 403 }
        );
      }
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const { 
      title, 
      content, 
      type, 
      moduleId, 
      lessonId, 
      tags, 
      isPinned, 
      isPrivate,
      allowComments 
    } = discussionPostSchema.parse(body);
    
    // Check if user has permission to pin posts (only instructors and admins)
    if (isPinned) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
      
      if (!isInstructorOrAdmin) {
        return CommonErrors.forbidden('Only instructors and administrators can pin discussions');
      }
    }
    
    // If moduleId is provided, verify it belongs to the course
    if (moduleId) {
      const module = await prisma.module.findUnique({
        where: {
          id: moduleId,
          courseId
        }
      });
      
      if (!module) {
        return NextResponse.json(
          { error: 'Module does not belong to this course' },
          { status: 400 }
        );
      }
      
      // If lessonId is provided, verify it belongs to the module
      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({
          where: {
            id: lessonId,
            moduleId
          }
        });
        
        if (!lesson) {
          return NextResponse.json(
            { error: 'Lesson does not belong to this module' },
            { status: 400 }
          );
        }
      }
    } else if (lessonId) {
      return NextResponse.json(
        { error: 'Cannot specify lessonId without moduleId' },
        { status: 400 }
      );
    }
    
    // Create the discussion post
    const discussion = await prisma.discussionPost.create({
      data: {
        title,
        content,
        type,
        courseId,
        moduleId,
        lessonId,
        userId,
        tags: tags ? JSON.stringify(tags) : null,
        isPinned,
        isPrivate,
        allowComments,
        viewCount: 0,
        likesCount: 0,
        commentsCount: 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        }
      }
    });
    
    // Log activity
    await logCourseActivity(
      userId,
      courseId,
      'update' as ActivityAction, 
      {
        discussionId: discussion.id,
        title,
        type,
        moduleId,
        lessonId,
        isPinned
      }
    );
    
    // Invalidate course discussion cache
    await invalidateCache('discussion', courseId);
    
    // Create notifications for instructors when students post questions
    if (type === 'QUESTION' && !isInstructor && course?.instructorId) {
      await prismaBase.notification.create({
        data: {
          userId: course.instructorId,
          title: 'New Question Posted',
          message: `A new question has been posted in your course: ${title}`,
          type: 'DISCUSSION',
          linkUrl: `/courses/${courseId}/discussions/${discussion.id}`
        }
      });
    }
    
    return NextResponse.json({
      message: 'Discussion created successfully',
      discussion: {
        ...discussion,
        tags: tags || [],
        author: {
          ...discussion.user,
          isInstructor: discussion.user.role === 'INSTRUCTOR' || discussion.user.role === 'ADMIN'
        }
      }
    });
  }, 'Error creating discussion');
}

// PATCH /api/courses/[courseId]/discussions - Update pin status of discussions
export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  return withErrorHandling(async () => {
    const { courseId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }
    
    const userId = Number(session.user.id);
    
    // Check if user has permission to pin posts (only instructors and admins)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
    
    if (!isInstructorOrAdmin) {
      return CommonErrors.forbidden('Only instructors and administrators can update discussion pin status');
    }
    
    // Parse and validate request body
    const body = await req.json();
    const { isPinned } = pinDiscussionSchema.parse(body);
    const { discussionId } = z.object({ discussionId: z.string() }).parse(body);
    
    // Check if discussion exists and belongs to this course
    const discussion = await prisma.discussionPost.findUnique({
      where: {
        id: discussionId,
        courseId
      },
      select: {
        id: true,
        title: true
      }
    });
    
    if (!discussion) {
      return CommonErrors.notFound('Discussion not found or does not belong to this course');
    }
    
    // Update pin status
    const updatedDiscussion = await prisma.discussionPost.update({
      where: { id: discussionId },
      data: { isPinned },
      select: {
        id: true,
        title: true,
        isPinned: true
      }
    });
    
    // Log activity
    await logCourseActivity(
      userId,
      courseId,
      'update' as ActivityAction, 
      {
        discussionId,
        title: discussion.title,
        isPinned: isPinned
      }
    );
    
    // Invalidate cache
    await invalidateCache('discussion', courseId);
    
    return NextResponse.json({
      message: isPinned ? 'Discussion pinned successfully' : 'Discussion unpinned successfully',
      discussion: updatedDiscussion
    });
  }, 'Error updating discussion pin status');
}
