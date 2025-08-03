import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { withErrorHandling } from '@/lib/api-response';

// Define schema for search request parameters
const searchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query too long"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().optional(),
  level: z.string().optional(),
  language: z.string().optional(),
  instructor: z.coerce.number().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['relevance', 'title', 'newest', 'oldest', 'price_asc', 'price_desc', 'rating']).default('relevance'),
  tags: z.array(z.string()).optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED', 'ALL']).optional(),
  dateCreatedAfter: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  dateCreatedBefore: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

/**
 * GET /api/search/courses - Advanced search API for courses with pagination and filtering
 */
export async function GET(req: Request) {
  return withErrorHandling(async () => {
    // Get current user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    
    // Parse query parameters
    const url = new URL(req.url);
    const params: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      if (key === 'tags') {
        // Handle tags as array
        params[key] = url.searchParams.getAll(key);
      } else {
        params[key] = value;
      }
    });
    
    // Parse and validate search parameters
    const {
      query,
      page,
      limit,
      category,
      level,
      language,
      instructor,
      priceMin,
      priceMax,
      sortBy,
      tags,
      status,
      dateCreatedAfter,
      dateCreatedBefore
    } = searchQuerySchema.parse(params);
    
    // Check user role for non-published content access
    let isInstructorOrAdmin = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
    }
    
    // Build the where clause for search
    const whereClause: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } }
      ],
    };
    
    // For non-admin/instructor users, restrict to published courses
    if (!isInstructorOrAdmin) {
      whereClause.isPublished = true;
      whereClause.status = 'PUBLISHED';
    } else if (status && status !== 'ALL') {
      // If user is admin/instructor and status filter is provided
      whereClause.status = status;
    }
    
    // Apply additional filters
    if (category) {
      whereClause.category = category;
    }
    
    if (level) {
      whereClause.level = level;
    }
    
    if (language) {
      whereClause.language = language;
    }
    
    if (instructor) {
      whereClause.instructorId = instructor;
    }
    
    // Price range filter
    if (priceMin !== undefined || priceMax !== undefined) {
      whereClause.price = {};
      if (priceMin !== undefined) {
        whereClause.price.gte = priceMin;
      }
      if (priceMax !== undefined) {
        whereClause.price.lte = priceMax;
      }
    }
    
    // Tags filter (searches for courses that have ANY of the provided tags)
    if (tags && tags.length > 0) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        ...tags.map((tag: string) => ({ tags: { has: tag.toLowerCase() } }))
      ];
    }
    
    // Date range filter
    if (dateCreatedAfter || dateCreatedBefore) {
      whereClause.createdAt = {};
      if (dateCreatedAfter) {
        whereClause.createdAt.gte = dateCreatedAfter;
      }
      if (dateCreatedBefore) {
        whereClause.createdAt.lte = dateCreatedBefore;
      }
    }
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Determine sort order
    let orderBy: any = {};
    switch (sortBy) {
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'relevance':
      default:
        // For relevance, we'll use a special ordering approach
        // First match by title, then by description
        orderBy = [
          {
            title: {
              score: {
                query,
                mode: 'insensitive'
              }
            }
          },
          {
            description: {
              score: {
                query,
                mode: 'insensitive'
              }
            }
          }
        ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.course.count({
      where: whereClause
    });
    
    // Execute the search query
    const courses = await prisma.course.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        modules: {
          select: {
            _count: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            ratings: true
          }
        }
      }
    });
    
    // Format the results to return to the client
    const formattedResults = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price,
      status: course.status,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      category: course.category,
      level: course.level,
      language: course.language,
      tags: course.tags as string[],
      moduleCount: course.modules.length,
      enrollmentCount: course._count?.enrollments || 0,
      averageRating: course.averageRating || 0,
      ratingCount: course.totalReviews || 0,
      instructor: {
        id: course.instructor.id,
        name: course.instructor.name,
        image: course.instructor.image
      }
    }));
    
    // Return search results with pagination info
    return NextResponse.json({
      results: formattedResults,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + courses.length < totalCount
      },
      filters: {
        query,
        category,
        level,
        language,
        instructor,
        priceRange: {
          min: priceMin,
          max: priceMax
        },
        tags,
        status,
        dateRange: {
          after: dateCreatedAfter,
          before: dateCreatedBefore
        }
      },
      sortBy
    });
  }, 'Error performing course search');
}

/**
 * POST /api/search/courses - Process more complex search queries with body data
 */
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    
    // For POST requests, parse the search query from the request body
    const body = await req.json();
    
    // Check if this is an admin/instructor for access control
    let isInstructorOrAdmin = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
    }
    
    // Validate the request body using the same schema as GET
    const {
      query,
      page,
      limit,
      category,
      level,
      language,
      instructor,
      priceMin,
      priceMax,
      sortBy,
      tags,
      status,
      dateCreatedAfter,
      dateCreatedBefore
    } = searchQuerySchema.parse(body);
    
    // Build the search query (similar to GET but can include more complex criteria)
    const whereClause: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } }
      ],
    };
    
    // For non-admin/instructor users, restrict to published courses
    if (!isInstructorOrAdmin) {
      whereClause.isPublished = true;
      whereClause.status = 'PUBLISHED';
    } else if (status && status !== 'ALL') {
      // If user is admin/instructor and status filter is provided
      whereClause.status = status;
    }
    
    // Apply all other filters as in GET handler
    if (category) whereClause.category = category;
    if (level) whereClause.level = level;
    if (language) whereClause.language = language;
    if (instructor) whereClause.instructorId = instructor;
    
    // Price range filter
    if (priceMin !== undefined || priceMax !== undefined) {
      whereClause.price = {};
      if (priceMin !== undefined) whereClause.price.gte = priceMin;
      if (priceMax !== undefined) whereClause.price.lte = priceMax;
    }
    
    // Tags filter
    if (tags && tags.length > 0) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        ...tags.map((tag: string) => ({ tags: { has: tag.toLowerCase() } }))
      ];
    }
    
    // Date range filter
    if (dateCreatedAfter || dateCreatedBefore) {
      whereClause.createdAt = {};
      if (dateCreatedAfter) whereClause.createdAt.gte = dateCreatedAfter;
      if (dateCreatedBefore) whereClause.createdAt.lte = dateCreatedBefore;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Determine sort order
    let orderBy: any = {};
    switch (sortBy) {
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'relevance':
      default:
        orderBy = [
          {
            title: {
              score: {
                query,
                mode: 'insensitive'
              }
            }
          },
          {
            description: {
              score: {
                query,
                mode: 'insensitive'
              }
            }
          }
        ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.course.count({
      where: whereClause
    });
    
    // Execute the search query
    const courses = await prisma.course.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        modules: {
          select: {
            _count: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            ratings: true
          }
        }
      }
    });
    
    // Format the results (using the averageRating field from the Course model)
    const formattedResults = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price,
      status: course.status,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      category: course.category,
      level: course.level,
      language: course.language,
      tags: course.tags as string[],
      moduleCount: course.modules.length,
      enrollmentCount: course._count?.enrollments || 0,
      averageRating: course.averageRating || 0,
      ratingCount: course.totalReviews || 0,
      instructor: {
        id: course.instructor.id,
        name: course.instructor.name,
        image: course.instructor.image
      }
    }));
    
    // Return search results with pagination info
    return NextResponse.json({
      results: formattedResults,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + courses.length < totalCount
      },
      filters: {
        query,
        category,
        level,
        language,
        instructor,
        priceRange: {
          min: priceMin,
          max: priceMax
        },
        tags,
        status,
        dateRange: {
          after: dateCreatedAfter,
          before: dateCreatedBefore
        }
      },
      sortBy
    });
  }, 'Error performing course search');
}
