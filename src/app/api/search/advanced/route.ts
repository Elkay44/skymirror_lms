import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getOrSetCache, CACHE_TTL } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';

// Define search schema with strong validation
const advancedSearchSchema = z.object({
  query: z.string().trim().min(1, "Search query must not be empty").max(200),
  types: z.array(
    z.enum(['course', 'module', 'lesson', 'quiz', 'user', 'discussion', 'resource'])
  ).default(['course']),
  filters: z.object({
    categories: z.array(z.string()).optional(),
    levels: z.array(z.string()).optional(),
    price: z.object({
      min: z.number().min(0).optional(),
      max: z.number().optional(),
      isFree: z.boolean().optional()
    }).optional(),
    rating: z.number().min(0).max(5).optional(),
    duration: z.object({
      min: z.number().min(0).optional(),
      max: z.number().optional()
    }).optional(),
    date: z.object({
      from: z.string().optional(), // ISO date string
      to: z.string().optional()    // ISO date string
    }).optional(),
    tags: z.array(z.string()).optional(),
    instructorId: z.number().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  }).optional(),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(10)
  }).default({ page: 1, limit: 10 }),
  sort: z.object({
    field: z.enum([
      'title', 'createdAt', 'updatedAt', 'price', 'rating', 'enrollmentCount', 'relevance'
    ]).default('relevance'),
    order: z.enum(['asc', 'desc']).default('desc')
  }).default({ field: 'relevance', order: 'desc' })
});

// Types that represent response data
interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  type: string;
  imageUrl: string | null;
  slug?: string;
  url: string;
  metadata: Record<string, any>;
  relevanceScore: number;
  highlightedText?: string;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting to prevent abuse
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const identifier = `search_suggestions_${ip}`;
    const rateLimited = await rateLimit({
      limit: 10,
      timeframe: 60000, // 60 seconds in milliseconds
      identifier
    });
    
    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many searches. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const params = {
      query: url.searchParams.get('query') || '',
      types: url.searchParams.getAll('types'),
      filters: {
        categories: url.searchParams.getAll('categories'),
        levels: url.searchParams.getAll('levels'),
        price: {
          min: url.searchParams.has('price.min') ? Number(url.searchParams.get('price.min')) : undefined,
          max: url.searchParams.has('price.max') ? Number(url.searchParams.get('price.max')) : undefined,
          isFree: url.searchParams.get('isFree') === 'true'
        },
        rating: url.searchParams.has('rating') ? Number(url.searchParams.get('rating')) : undefined,
        duration: {
          min: url.searchParams.has('duration.min') ? Number(url.searchParams.get('duration.min')) : undefined,
          max: url.searchParams.has('duration.max') ? Number(url.searchParams.get('duration.max')) : undefined
        },
        date: {
          from: url.searchParams.get('date.from') || undefined,
          to: url.searchParams.get('date.to') || undefined
        },
        tags: url.searchParams.getAll('tags'),
        instructorId: url.searchParams.has('instructorId') ? Number(url.searchParams.get('instructorId')) : undefined,
        status: url.searchParams.get('status') as any
      },
      pagination: {
        page: Number(url.searchParams.get('page') || 1),
        limit: Number(url.searchParams.get('limit') || 10)
      },
      sort: {
        field: (url.searchParams.get('sortField') as any) || 'relevance',
        order: (url.searchParams.get('sortOrder') as any) || 'desc'
      }
    };
    
    // Validate parameters
    const validParams = advancedSearchSchema.parse(params);
    
    // Get user session for access control
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    const userRole = session?.user?.role || 'STUDENT';
    
    // Use cache for search results
    const cacheKey = {
      query: validParams.query,
      types: validParams.types,
      filters: validParams.filters,
      pagination: validParams.pagination,
      sort: validParams.sort,
      userId,
      userRole
    };
    
    const searchResults = await getOrSetCache('search', cacheKey, async () => {
      return await performSearch(validParams, userId, userRole);
    }, CACHE_TTL.MEDIUM);
    
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('[ADVANCED_SEARCH_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

async function performSearch(
  params: z.infer<typeof advancedSearchSchema>,
  userId?: number,
  userRole: string = 'STUDENT'
): Promise<{
  results: SearchResult[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { query, types, filters, pagination, sort } = params;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const searchResults: SearchResult[] = [];
  let totalCount = 0;
  
  // Function to calculate text match score based on query
  const calculateRelevance = (text: string, title: boolean = false): number => {
    if (!text) return 0;
    
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();
    
    // Exact match has highest score
    if (lowerText === lowerQuery) return title ? 100 : 50;
    
    // Title match at start
    if (title && lowerText.startsWith(lowerQuery)) return 80;
    
    // Title contains query
    if (title && lowerText.includes(lowerQuery)) return 60;
    
    // Description contains query
    if (lowerText.includes(lowerQuery)) return 40;
    
    // Word boundary match
    const words = lowerText.split(/\s+/);
    if (words.some(word => word === lowerQuery)) return 30;
    
    // Partial word match
    if (words.some(word => word.includes(lowerQuery))) return 20;
    
    return 10; // Some other match
  };
  
  // Extract highlight snippet for a match
  const extractHighlight = (text: string): string => {
    if (!text) return '';
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text.substring(0, 150) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet.replace(
      new RegExp(`(${query})`, 'gi'),
      '<mark>$1</mark>'
    );
  };
  
  // Common query parameters
  const commonWhere: any = {};
  
  // Add common filters
  if (filters?.date?.from) {
    commonWhere.createdAt = { gte: new Date(filters.date.from) };
  }
  if (filters?.date?.to) {
    commonWhere.createdAt = { 
      ...commonWhere.createdAt,
      lte: new Date(filters.date.to) 
    };
  }
  
  // Search in courses if requested
  if (types.includes('course')) {
    const courseWhere: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ],
      ...commonWhere
    };
    
    // Add course-specific filters
    if (filters?.categories?.length) {
      courseWhere.categoryId = { in: filters.categories };
    }
    
    if (filters?.levels?.length) {
      courseWhere.level = { in: filters.levels };
    }
    
    if (filters?.price) {
      if (filters.price.isFree) {
        courseWhere.price = 0;
      } else {
        if (filters.price.min !== undefined) {
          courseWhere.price = { gte: filters.price.min };
        }
        if (filters.price.max !== undefined) {
          courseWhere.price = { 
            ...courseWhere.price, 
            lte: filters.price.max 
          };
        }
      }
    }
    
    if (filters?.instructorId) {
      courseWhere.instructorId = filters.instructorId;
    }
    
    // Handle status based on user role
    if (userRole === 'ADMIN') {
      // Admins can filter by any status
      if (filters?.status) {
        courseWhere.status = filters.status;
      }
    } else if (userRole === 'INSTRUCTOR' && userId) {
      // Instructors can see their own courses of any status
      courseWhere.OR = [
        { instructorId: userId },
        { AND: [
          { status: 'PUBLISHED' },
          { isPublished: true }
        ]}
      ];
    } else {
      // Students and guests can only see published courses
      courseWhere.status = 'PUBLISHED';
      courseWhere.isPublished = true;
    }
    
    // Count total courses matching criteria
    const coursesCount = await prisma.course.count({ where: courseWhere });
    totalCount += coursesCount;
    
    // Only fetch if we need courses for this page
    if (coursesCount > 0) {
      // Determine sort order
      let orderBy: any = {};
      
      if (sort.field === 'relevance') {
        // For relevance sorting, we need to sort post-query
        orderBy = { title: 'asc' };
      } else if (sort.field === 'enrollmentCount') {
        orderBy = { 
          enrollments: { _count: sort.order } 
        };
      } else {
        orderBy = { [sort.field]: sort.order };
      }
      
      // Get courses matching the search
      const courses = await prisma.course.findMany({
        where: courseWhere,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          price: true,
          imageUrl: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          instructorId: true,
          difficulty: true,
          _count: {
            select: {
              enrollments: true
            }
          }
        },
        orderBy,
        take: types.length === 1 ? limit : Math.ceil(limit / types.length),
        skip: types.length === 1 ? skip : 0
      });
      
      // Map courses to search results
      courses.forEach(course => {
        const titleScore = calculateRelevance(course.title, true);
        const descriptionScore = calculateRelevance(course.description || '');
        // Tags are not included in the select, so we skip tag relevance calculation
        
        const relevanceScore = Math.max(titleScore, descriptionScore);
        
        searchResults.push({
          id: course.id,
          title: course.title,
          description: course.description,
          type: 'course',
          imageUrl: course.imageUrl,
          slug: undefined,
          url: `/courses/${course.id}`,
          relevanceScore,
          highlightedText: extractHighlight(course.description || course.title),
          metadata: {
            instructorId: course.instructorId,
            price: course.price,
            enrollmentCount: course._count?.enrollments || 0,
            difficulty: course.difficulty,
            createdAt: course.createdAt
          }
        });
      });
    }
  }
  
  // Search in lessons if requested
  if (types.includes('lesson')) {
    const lessonWhere: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ],
      ...commonWhere
    };
    
    // For lesson access control
    if (userRole === 'ADMIN') {
      // Admins can see all lessons
    } else if (userRole === 'INSTRUCTOR' && userId) {
      // Instructors can see their own lessons
      lessonWhere.module = {
        course: {
          instructorId: userId
        }
      };
    } else {
      // Students can only see published lessons from published courses
      lessonWhere.isPublished = true;
      lessonWhere.module = {
        isPublished: true,
        course: {
          isPublished: true,
          status: 'PUBLISHED'
        }
      };
    }
    
    // Count total lessons matching criteria
    const lessonsCount = await prisma.lesson.count({ 
      where: lessonWhere 
    });
    totalCount += lessonsCount;
    
    // Only fetch if we need lessons for this page
    if (lessonsCount > 0) {
      // Get lessons matching the search
      const lessons = await prisma.lesson.findMany({
        where: lessonWhere,
        include: {
          module: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          title: sort.order === 'asc' ? 'asc' : 'desc'
        },
        take: types.length === 1 ? limit : Math.ceil(limit / types.length),
        skip: types.length === 1 ? skip : 0
      });
      
      // Map lessons to search results
      lessons.forEach(lesson => {
        const titleScore = calculateRelevance(lesson.title, true);
        const descriptionScore = calculateRelevance(lesson.description || '');
        const contentScore = calculateRelevance(lesson.content || '');
        
        const relevanceScore = Math.max(titleScore, descriptionScore, contentScore);
        
        searchResults.push({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: 'lesson',
          imageUrl: null, // Can't rely on lesson.module.course.imageUrl
          url: `/lessons/${lesson.id}`,
          relevanceScore,
          highlightedText: extractHighlight(
            lesson.content || lesson.description || lesson.title
          ),
          metadata: {
            moduleId: lesson.moduleId,
            duration: lesson.duration,
            order: lesson.order
          }
        });
      });
    }
  }
  
  // Search in discussions if requested
  if (types.includes('discussion')) {
    const discussionWhere: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
      ...commonWhere
    };
    
    // Handle access control for discussions
    if (userRole === 'ADMIN') {
      // Admins can see all discussions
    } else if (userRole === 'INSTRUCTOR' && userId) {
      // Instructors can see discussions in their courses
      discussionWhere.forum = {
        module: {
          course: {
            instructorId: userId
          }
        }
      };
    } else if (userId) {
      // Students can see discussions in courses they're enrolled in
      discussionWhere.forum = {
        module: {
          course: {
            enrollments: {
              some: {
                userId
              }
            }
          }
        }
      };
    } else {
      // Guest users can't see any discussions
      discussionWhere.id = 'no-results'; // This ensures no results
    }
    
    // Count total discussions matching criteria
    const discussionsCount = await prisma.forumPost.count({ 
      where: discussionWhere 
    });
    totalCount += discussionsCount;
    
    // Only fetch if we need discussions for this page
    if (discussionsCount > 0) {
      // Get discussions matching the search
      const discussions = await prisma.forumPost.findMany({
        where: discussionWhere,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          forum: {
            select: {
              id: true,
              title: true,
              module: {
                select: {
                  id: true,
                  title: true,
                  course: {
                    select: {
                      id: true,
                      title: true,
                      imageUrl: true,
                      slug: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        },
        orderBy: {
          createdAt: sort.order === 'asc' ? 'asc' : 'desc'
        },
        take: types.length === 1 ? limit : Math.ceil(limit / types.length),
        skip: types.length === 1 ? skip : 0
      });
      
      // Map discussions to search results
      discussions.forEach(discussion => {
        const titleScore = calculateRelevance(discussion.title, true);
        const contentScore = calculateRelevance(discussion.content);
        
        const relevanceScore = Math.max(titleScore, contentScore);
        
        searchResults.push({
          id: discussion.id,
          title: discussion.title,
          description: discussion.content,
          type: 'discussion',
          imageUrl: null,
          url: `/forum/post/${discussion.id}`,
          relevanceScore,
          highlightedText: extractHighlight(discussion.content),
          metadata: {
            forumId: discussion.forumId,
            likes: discussion._count?.likes || 0,
            comments: discussion._count?.comments || 0,
            isPinned: discussion.isPinned || false,
            createdAt: discussion.createdAt,
            type: 'discussion' // Default type since the field doesn't exist in ForumPost model
          }
        });
      });
    }
  }
  
  // If sorting by relevance, sort the combined results
  if (sort.field === 'relevance') {
    searchResults.sort((a, b) => {
      if (sort.order === 'asc') {
        return a.relevanceScore - b.relevanceScore;
      } else {
        return b.relevanceScore - a.relevanceScore;
      }
    });
  }
  
  // Apply pagination to combined results if needed
  let paginatedResults = searchResults;
  if (types.length > 1) {
    const startIndex = skip;
    const endIndex = Math.min(startIndex + limit, searchResults.length);
    paginatedResults = searchResults.slice(startIndex, endIndex);
  }
  
  return {
    results: paginatedResults,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit)
  };
}

// POST endpoint for more complex search requests
export async function POST(req: NextRequest) {
  try {
    // Rate limiting to prevent abuse
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const identifier = `search_suggestions_${ip}`;
    const rateLimited = await rateLimit({
      limit: 10,
      timeframe: 60000, // 60 seconds in milliseconds
      identifier
    });
    
    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many searches. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate parameters
    const validParams = advancedSearchSchema.parse(body);
    
    // Get user session for access control
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    const userRole = session?.user?.role || 'STUDENT';
    
    // Use cache for search results
    const cacheKey = {
      query: validParams.query,
      types: validParams.types,
      filters: validParams.filters,
      pagination: validParams.pagination,
      sort: validParams.sort,
      userId,
      userRole
    };
    
    const searchResults = await getOrSetCache('search', cacheKey, async () => {
      return await performSearch(validParams, userId, userRole);
    }, CACHE_TTL.MEDIUM);
    
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('[ADVANCED_SEARCH_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
