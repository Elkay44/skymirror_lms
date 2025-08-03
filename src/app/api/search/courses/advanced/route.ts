import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { courseSearchSchema } from '@/validations/course';

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/search/courses/advanced - Advanced course search with server-side filtering and pagination
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    
    // Parse query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate using Zod schema
    const {
      search,
      page,
      limit,
      sortBy,
      sortOrder,
      category,
      level,
      instructor,
      priceRange,
      status,
      featured,
      language,
      createdAfter,
      createdBefore,
      includeDrafts
    } = courseSearchSchema.parse(searchParams);
    
    // Build the filter conditions
    const whereConditions: any = {};
    
    // Text search
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructor: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Category filter
    if (category) {
      whereConditions.category = category;
    }
    
    // Level filter
    if (level) {
      whereConditions.level = level;
    }
    
    // Instructor filter
    if (instructor) {
      whereConditions.instructor = {
        OR: [
          { name: { contains: instructor, mode: 'insensitive' } },
          { id: isNaN(Number(instructor)) ? undefined : Number(instructor) }
        ].filter(Boolean)
      };
    }
    
    // Price range filter
    if (priceRange) {
      const priceFilter: any = {};
      if (priceRange.min !== undefined) {
        priceFilter.gte = priceRange.min;
      }
      if (priceRange.max !== undefined) {
        priceFilter.lte = priceRange.max;
      }
      
      if (Object.keys(priceFilter).length > 0) {
        whereConditions.price = priceFilter;
      }
    }
    
    // Status filter - handle differently based on user role
    const userRole = session?.user?.role;
    
    // Regular users can only see published courses unless they're the instructor
    if (!userId || (userRole !== 'ADMIN' && userRole !== 'INSTRUCTOR')) {
      whereConditions.isPublished = true;
    } 
    // Instructors can see their own drafts
    else if (userRole === 'INSTRUCTOR') {
      if (status === 'DRAFT') {
        whereConditions.status = 'DRAFT';
        whereConditions.instructorId = userId;
      } else if (status !== 'ALL') {
        // For non-DRAFT statuses, filter by status
        whereConditions.status = status;
      } else {
        // For 'ALL' status, show both published and instructor's drafts
        whereConditions.OR = [
          { status: 'PUBLISHED' },
          { instructorId: userId, status: 'DRAFT' }
        ];
      }
    }
    // Admins can see all courses based on status filter
    else if (userRole === 'ADMIN') {
      if (status !== 'ALL') {
        whereConditions.status = status;
      }
      // For 'ALL' status, no status filter is applied (show all courses)
    }
    
    // Handle includeDrafts for instructors and admins
    if ((userRole === 'INSTRUCTOR' || userRole === 'ADMIN') && includeDrafts) {
      // If we're already filtering by instructor's courses, just remove the published filter
      if (userRole === 'INSTRUCTOR') {
        delete whereConditions.isPublished;
      }
    }
    
    // Featured filter
    if (featured === 'YES') {
      whereConditions.featured = true;
    } else if (featured === 'NO') {
      whereConditions.featured = false;
    }
    
    // Language filter
    if (language) {
      whereConditions.language = language;
    }
    
    // Date range filters
    if (createdAfter || createdBefore) {
      const dateFilter: any = {};
      
      if (createdAfter) {
        dateFilter.gte = new Date(createdAfter);
      }
      
      if (createdBefore) {
        dateFilter.lte = new Date(createdBefore);
      }
      
      whereConditions.createdAt = dateFilter;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build sort options
    let orderBy: any = {};
    
    // Special handling for popularity and rating since they require aggregates
    if (sortBy === 'popularity') {
      // We'll handle this separately below
      orderBy = { createdAt: 'desc' }; // Default fallback
    } else if (sortBy === 'rating') {
      // We'll handle this separately below
      orderBy = { createdAt: 'desc' }; // Default fallback
    } else if (sortBy === 'enrollmentCount') {
      // We'll handle this separately below
      orderBy = { createdAt: 'desc' }; // Default fallback
    } else {
      orderBy[sortBy] = sortOrder;
    }
    
    // Get total count for pagination
    const totalCount = await prisma.course.count({
      where: whereConditions
    });
    
    // Fetch the courses with related data
    let courses = await prisma.course.findMany({
      where: whereConditions,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          }
        },
        reviews: {
          select: {
            rating: true,
          }
        },
        modules: {
          select: {
            id: true,
            _count: {
              select: {
                lessons: true,
              }
            }
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });
    
    // Sort by popularity (enrollment count) if requested
    if (sortBy === 'enrollmentCount' || sortBy === 'popularity') {
      courses = courses.sort((a, b) => {
        const countA = a._count.enrollments;
        const countB = b._count.enrollments;
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      });
    }
    
    // Sort by rating if requested
    if (sortBy === 'rating') {
      courses = courses.sort((a, b) => {
        const avgRatingA = a.reviews.length > 0
          ? a.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / a.reviews.length
          : 0;
        const avgRatingB = b.reviews.length > 0
          ? b.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / b.reviews.length
          : 0;
        return sortOrder === 'asc' ? avgRatingA - avgRatingB : avgRatingB - avgRatingA;
      });
    }
    
    // Calculate the total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Transform the courses for response
    const formattedCourses = courses.map(course => {
      // Calculate average rating
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / course.reviews.length
        : 0;
      
      // Count total lessons across all modules
      const totalLessons = course.modules.reduce(
        (sum: number, module: { _count: { lessons: number } }) => sum + module._count.lessons, 0
      );
      
      
      return {
        id: course.id,
        title: course.title,
        shortDescription: course.shortDescription,
        imageUrl: course.imageUrl,
        price: course.price,
        status: course.status,
        isPublished: course.isPublished,
        featured: course.featured,
        category: course.category,
        level: course.level,
        language: course.language,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        publishedAt: course.publishedAt,
        instructor: course.instructor,
        stats: {
          enrollments: course._count.enrollments,
          reviews: course._count.reviews,
          modules: course.modules.length,
          lessons: totalLessons,
          rating: avgRating
        }
      };
    });
    
    // Return the paginated and filtered results
    return NextResponse.json({
      courses: formattedCourses,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        search: search || null,
        category: category || null,
        level: level || null,
        instructor: instructor || null,
        priceRange: priceRange || null,
        status: status || null,
        featured: featured || null,
        language: language || null
      }
    });
  } catch (error) {
    console.error('[ADVANCED_COURSE_SEARCH_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to search courses', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
