import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, createUnauthorizedResponse, createNotFoundResponse } from '@/lib/api-utils';
import { courseFormSchema } from '@/validations/course';
import { z } from 'zod';
import { withErrorHandling, CommonErrors } from '@/lib/api-response';

// Schema for batch operations
const batchOperationsSchema = z.object({
  courseIds: z.array(z.string()).min(1, 'At least one course ID is required'),
  operation: z.enum(['publish', 'unpublish', 'archive', 'delete']),
});

// Schema for course search and pagination
const courseSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  difficulties: z.array(z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'PENDING_APPROVAL']).optional(),
  statuses: z.array(z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'PENDING_APPROVAL'])).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'price', 'enrollmentCount', 'rating', 'popularity', 'completionRate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  instructorId: z.coerce.number().optional(),
  instructorIds: z.array(z.coerce.number()).optional(),
  language: z.string().optional(),
  languages: z.array(z.string()).optional(),
  price: z.enum(['free', 'paid', 'all']).default('all'),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  withEnrollmentStats: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  createdAfter: z.string().optional().refine(
    (val) => val ? !isNaN(Date.parse(val)) : true,
    { message: "createdAfter must be a valid ISO date string" }
  ),
  createdBefore: z.string().optional().refine(
    (val) => val ? !isNaN(Date.parse(val)) : true,
    { message: "createdBefore must be a valid ISO date string" }
  ),
  updatedAfter: z.string().optional().refine(
    (val) => val ? !isNaN(Date.parse(val)) : true,
    { message: "updatedAfter must be a valid ISO date string" }
  ),
  updatedBefore: z.string().optional().refine(
    (val) => val ? !isNaN(Date.parse(val)) : true,
    { message: "updatedBefore must be a valid ISO date string" }
  ),
});

// Helper function to convert string IDs to numbers
function toNumber(id: string | number | undefined): number | undefined {
  if (id === undefined) return undefined;
  return typeof id === 'string' ? parseInt(id) : id;
}

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// POST /api/courses - Create a new course
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createUnauthorizedResponse('Authentication required');
    }

    const formData = await req.formData();
    const values = Object.fromEntries(formData.entries());

    // Parse and validate the form data
    const validatedData = courseFormSchema.parse({
      ...values,
      requirements: JSON.parse(values.requirements as string || '[]'),
      learningOutcomes: JSON.parse(values.learningOutcomes as string || '[]'),
      targetAudience: JSON.parse(values.targetAudience as string || '[]'),
      isPublished: values.isPublished === 'true',
      isPrivate: values.isPrivate === 'true',
    });

    // Create course in the database
    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        shortDescription: validatedData.shortDescription,
        difficulty: validatedData.level.toUpperCase(),
        language: validatedData.language,
        isPublished: validatedData.isPublished,
        isPrivate: validatedData.isPrivate,
        imageUrl: validatedData.imagePreview || '',
        price: 0, // Default price, can be updated later
        instructorId: parseInt(session.user.id),
        requirements: JSON.stringify(validatedData.requirements),
        learningOutcomes: JSON.stringify(validatedData.learningOutcomes),
        targetAudience: JSON.stringify(validatedData.targetAudience),
        status: validatedData.isPublished ? 'PUBLISHED' : 'DRAFT',
      },
    });

    return createSuccessResponse(course, 'Course created successfully');
  } catch (error) {
    console.error('[COURSES_FETCH_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// GET /api/courses - Get all available courses with filtering, search, and pagination
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    // Get the user session to check if they're authenticated
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? toNumber(session?.user?.id) : undefined;
    
    // Extract query parameters for filtering and pagination
    const url = new URL(req.url);
    
    // Get array parameters (which can have multiple values)
    const categories = url.searchParams.getAll('categories');
    const tags = url.searchParams.getAll('tags');
    const difficulties = url.searchParams.getAll('difficulties') as ('BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')[];
    const statuses = url.searchParams.getAll('statuses') as ('DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_APPROVAL')[];
    const instructorIds = url.searchParams.getAll('instructorIds').map(id => parseInt(id));
    const languages = url.searchParams.getAll('languages');
    
    // Get single-value parameters
    const searchParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      // Skip array parameters that we've already processed
      if (!['categories', 'tags', 'difficulties', 'statuses', 'instructorIds', 'languages'].includes(key)) {
        searchParams[key] = value;
      }
    });
    
    // Parse and validate the search parameters
    const parsedParams = courseSearchSchema.parse({
      ...searchParams,
      categories: categories.length ? categories : undefined,
      tags: tags.length ? tags : undefined,
      difficulties: difficulties.length ? difficulties : undefined,
      statuses: statuses.length ? statuses : undefined,
      instructorIds: instructorIds.length ? instructorIds : undefined,
      languages: languages.length ? languages : undefined,
    });
    
    const {
      page,
      limit,
      search,
      category,
      difficulty,
      status,
      sortBy,
      sortOrder,
      instructorId,
      language,
      price,
      minPrice,
      maxPrice,
      featured,
      withEnrollmentStats,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore
    } = parsedParams;
    
    // Calculate pagination offsets
    const skip = (page - 1) * limit;
    
    // Build the where clause based on filters and user role
    let whereClause: any = {};
    
    // For non-authenticated users or regular students, only show published courses
    if (!session?.user?.role || session.user.role === 'STUDENT') {
      whereClause.isPublished = true;
      whereClause.status = 'PUBLISHED';
    } else if (session.user.role === 'INSTRUCTOR') {
      // For instructors, show their own courses regardless of status, but only published courses from others
      whereClause.OR = [
        { instructorId: toNumber(session.user.id) },
        { isPublished: true, status: 'PUBLISHED' }
      ];
    }
    // Admins can see all courses
    
    // Filter by search query
    if (search) {
      const searchConditions = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } }
        ]
      };
      
      whereClause = {
        AND: [
          whereClause,
          searchConditions
        ]
      };
    }
    
    // Filter by single category or multiple categories
    if (category || (parsedParams.categories && parsedParams.categories.length > 0)) {
      if (category) {
        whereClause.category = { name: category };
      } else if (parsedParams.categories) {
        whereClause.category = { name: { in: parsedParams.categories } };
      }
    }
    
    // Filter by single difficulty or multiple difficulties
    if (difficulty || (parsedParams.difficulties && parsedParams.difficulties.length > 0)) {
      if (difficulty) {
        whereClause.difficulty = difficulty;
      } else if (parsedParams.difficulties) {
        whereClause.difficulty = { in: parsedParams.difficulties };
      }
    }
    
    // Filter by status or multiple statuses
    if (status || (parsedParams.statuses && parsedParams.statuses.length > 0)) {
      if (status) {
        whereClause.status = status;
      } else if (parsedParams.statuses) {
        whereClause.status = { in: parsedParams.statuses };
      }
    }
    
    // Filter by single instructor or multiple instructors
    if (instructorId || (parsedParams.instructorIds && parsedParams.instructorIds.length > 0)) {
      if (instructorId) {
        whereClause.instructorId = toNumber(instructorId);
      } else if (parsedParams.instructorIds) {
        whereClause.instructorId = { in: parsedParams.instructorIds };
      }
    }
    
    // Filter by single language or multiple languages
    if (language || (parsedParams.languages && parsedParams.languages.length > 0)) {
      if (language) {
        whereClause.language = language;
      } else if (parsedParams.languages) {
        whereClause.language = { in: parsedParams.languages };
      }
    }
    
    // Filter by tags
    if (parsedParams.tags && parsedParams.tags.length > 0) {
      // Since tags are stored as a JSON string, we need a special approach
      const tagConditions = parsedParams.tags.map(tag => ({
        tags: { contains: tag, mode: 'insensitive' }
      }));
      
      whereClause.OR = [
        ...(whereClause.OR || []),
        ...tagConditions
      ];
    }
    
    // Filter by price
    if (price === 'free') {
      whereClause.price = 0;
    } else if (price === 'paid') {
      whereClause.price = { gt: 0 };
    }
    
    // Filter by price range if specified
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      
      if (minPrice !== undefined) {
        whereClause.price.gte = minPrice;
      }
      
      if (maxPrice !== undefined) {
        whereClause.price.lte = maxPrice;
      }
    }
    
    // Filter by featured status
    if (featured !== undefined) {
      whereClause.isFeatured = featured;
    }
    
    // Filter by creation date range
    if (createdAfter || createdBefore) {
      whereClause.createdAt = {};
      
      if (createdAfter) {
        whereClause.createdAt.gte = new Date(createdAfter);
      }
      
      if (createdBefore) {
        whereClause.createdAt.lte = new Date(createdBefore);
      }
    }
    
    // Filter by last update date range
    if (updatedAfter || updatedBefore) {
      whereClause.updatedAt = {};
      
      if (updatedAfter) {
        whereClause.updatedAt.gte = new Date(updatedAfter);
      }
      
      if (updatedBefore) {
        whereClause.updatedAt.lte = new Date(updatedBefore);
      }
    }
    
    // Get total count for pagination info
    const totalCount = await prisma.course.count({
      where: whereClause,
    });
    
    // Define the sorting criteria
    let orderBy: any = {};
    switch (sortBy) {
      case 'title':
        orderBy = { title: sortOrder };
        break;
      case 'price':
        orderBy = { price: sortOrder };
        break;
      case 'popularity':
        orderBy = {
          enrollments: {
            _count: sortOrder
          }
        };
        break;
      case 'rating':
        orderBy = { averageRating: sortOrder };
        break;
      case 'enrollmentCount':
        orderBy = { enrollmentCount: sortOrder };
        break;
      case 'completionRate':
        orderBy = { completionRate: sortOrder };
        break;
      case 'updatedAt':
        orderBy = { updatedAt: sortOrder };
        break;
      case 'createdAt':
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }
    
    // Fetch courses with pagination and filtering
    const courses = await prisma.course.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        difficulty: true,
        price: true,
        language: true,
        shortDescription: true,
        createdAt: true,
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        modules: {
          select: {
            id: true,
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
        enrollments: userId ? {
          where: {
            userId: userId,
          },
          select: {
            id: true,
            status: true,
          },
        } : undefined,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    // Transform the data for the client
    let coursesWithStats = courses.map(course => {
      // Count lessons for each course
      const lessonCount = course.modules.reduce((total, module) => {
        return total + module.lessons.length;
      }, 0);

      // Check if the user is enrolled in this course
      const isEnrolled = course.enrollments && course.enrollments.length > 0;
      
      // Get enrollment status if enrolled
      const enrollmentStatus = isEnrolled ? course.enrollments[0].status : null;
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        imageUrl: course.imageUrl || `/course-placeholders/${Math.floor(Math.random() * 5) + 1}.jpg`,
        difficulty: course.difficulty,
        price: course.price,
        language: course.language,
        createdAt: course.createdAt,
        instructor: course.instructor,
        lessonCount,
        isEnrolled,
        enrollmentStatus,
        enrollmentCount: course._count.enrollments,
        moduleCount: course.modules.length
      };
    });
    
    // Return the courses with pagination metadata
    return NextResponse.json({
      courses: coursesWithStats,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + courses.length < totalCount,
        currentPage: page,
        itemsPerPage: limit,
        nextPage: skip + courses.length < totalCount ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      filters: {
        search: search || null,
        category: category || null,
        categories: parsedParams.categories || [],
        difficulty: difficulty || null,
        difficulties: parsedParams.difficulties || [],
        status: status || null,
        statuses: parsedParams.statuses || [],
        language: language || null,
        languages: parsedParams.languages || [],
        price: price || 'all',
        priceRange: minPrice !== undefined || maxPrice !== undefined 
          ? { min: minPrice, max: maxPrice }
          : null,
        sortBy,
        sortOrder
      }
    });
  }, 'Failed to fetch courses');
}

// POST /api/courses/batch - Perform batch operations on courses
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createUnauthorizedResponse('Authentication required');
    }
    
    const userIdNum = toNumber(session.user.id);
    
    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: { role: true }
    });
    
    const isAdmin = user?.role === 'ADMIN';
    
    // Parse and validate the request body
    const body = await req.json();
    const { courseIds, operation } = batchOperationsSchema.parse(body);
    
    // For non-admin users, verify they are instructors of all courses
    if (!isAdmin) {
      const coursesCount = await prisma.course.count({
        where: {
          id: { in: courseIds },
          instructorId: userIdNum
        }
      });
      
      if (coursesCount !== courseIds.length) {
        return NextResponse.json(
          { error: 'You do not have permission to perform operations on all specified courses' },
          { status: 403 }
        );
      }
    }
    
    // Initialize result counters
    let successCount = 0;
    let failedCount = 0;
    const errors: Record<string, string> = {};
    
    // Perform the requested operation on each course
    switch (operation) {
      case 'publish':
      case 'unpublish':
      case 'archive':
        // Handle status changes (publish, unpublish, archive)
        const statusMap = {
          'publish': { isPublished: true, status: 'PUBLISHED' },
          'unpublish': { isPublished: false, status: 'DRAFT' },
          'archive': { isPublished: false, status: 'ARCHIVED' }
        };
        
        const updateData = statusMap[operation];
        
        // Update each course
        for (const courseId of courseIds) {
          try {
            await prisma.course.update({
              where: { id: courseId },
              data: updateData
            });
            successCount++;
          } catch (error) {
            failedCount++;
            errors[courseId] = `Failed to ${operation} course: ${(error as Error).message}`;
          }
        }
        break;
        
      case 'delete':
        // For delete, check if non-admin users are trying to delete courses with active enrollments
        if (!isAdmin) {
          // Check for active enrollments
          const coursesWithEnrollments = await prisma.enrollment.groupBy({
            by: ['courseId'],
            where: {
              courseId: { in: courseIds },
              status: 'ACTIVE'
            },
            _count: { courseId: true }
          });
          
          // Create map of courses with enrollments
          const enrollmentMap = coursesWithEnrollments.reduce((map, item) => {
            map[item.courseId] = item._count.courseId;
            return map;
          }, {} as Record<string, number>);
          
          // Filter courses without enrollments or that can be deleted by admins
          const eligibleCourseIds = courseIds.filter(id => !enrollmentMap[id]);
          
          // Delete eligible courses
          for (const courseId of eligibleCourseIds) {
            try {
              await prisma.course.delete({
                where: { id: courseId }
              });
              successCount++;
            } catch (error) {
              failedCount++;
              errors[courseId] = `Failed to delete course: ${(error as Error).message}`;
            }
          }
          
          // Add errors for courses with enrollments
          for (const courseId of courseIds) {
            if (enrollmentMap[courseId]) {
              failedCount++;
              errors[courseId] = `Course has ${enrollmentMap[courseId]} active enrollments and cannot be deleted`;
            }
          }
        } else {
          // Admins can delete any course regardless of enrollments
          for (const courseId of courseIds) {
            try {
              await prisma.course.delete({
                where: { id: courseId }
              });
              successCount++;
            } catch (error) {
              failedCount++;
              errors[courseId] = `Failed to delete course: ${(error as Error).message}`;
            }
          }
        }
        break;
        
      default:
        return NextResponse.json(
          { error: `Unsupported operation: ${operation}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      message: `Batch operation completed. ${successCount} courses processed successfully, ${failedCount} failed.`,
      success: successCount,
      failed: failedCount,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[BATCH_OPERATION_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return createErrorResponse('Failed to perform batch operation', 500);
  }
}
