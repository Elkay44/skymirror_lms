import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, createUnauthorizedResponse } from '@/lib/api-utils';
import { courseFormSchema } from '@/validations/course';
import { z } from 'zod';
import { convertBase64ToUrl } from '@/utils/imageUtils';
import { generateCourseSlug } from '@/utils/slugify';

// Schema for batch operations
const batchOperationsSchema = z.object({
  courseIds: z.array(z.string()).min(1, 'At least one course ID is required'),
  operation: z.enum(['publish', 'unpublish', 'archive', 'delete']),
});

// Helper function to convert string IDs to numbers
function toNumber(id: string | number | undefined): number | undefined {
  if (id === undefined) return undefined;
  return typeof id === 'string' ? parseInt(id) : id;
}

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// POST /api/courses - Create a new course
export async function POST(req: Request) {
  console.log('=== STARTING COURSE CREATION ===');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID found');
      return createUnauthorizedResponse('Authentication required');
    }
    
    console.log('User authenticated with ID:', session.user.id);

    const formData = await req.formData();
    const values = Object.fromEntries(formData.entries());
    
    // Log form data (without sensitive info)
    console.log('Received form data:', {
      title: values.title,
      category: values.category,
      level: values.level,
      hasImage: !!values.imagePreview,
      isPublished: values.isPublished,
      isPrivate: values.isPrivate,
      fields: Object.keys(values)
    });

    // Parse and validate the form data
    const validatedData = courseFormSchema.parse({
      ...values,
      requirements: JSON.parse(values.requirements as string || '[]'),
      learningOutcomes: JSON.parse(values.learningOutcomes as string || '[]'),
      targetAudience: JSON.parse(values.targetAudience as string || '[]'),
      isPublished: values.isPublished === 'true',
      isPrivate: values.isPrivate === 'true',
      level: values.level // Let the schema handle the case conversion
    });

    // Generate unique slug
    const slug = generateCourseSlug(validatedData.title);

    // Create course in the database
    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        shortDescription: validatedData.shortDescription,
        slug: slug,
        image: validatedData.imagePreview ? await convertBase64ToUrl(validatedData.imagePreview) : null,
        isPublished: validatedData.isPublished,
        isPrivate: validatedData.isPrivate || false,
        price: validatedData.price || 0,
        level: validatedData.level.toUpperCase(), // Store in uppercase in the database
        category: validatedData.category,
        language: validatedData.language,
        instructorId: session.user.id, // Keep as string since schema expects String
        status: validatedData.isPublished ? 'PUBLISHED' : 'DRAFT',
        featured: validatedData.featured || false,
        requirements: JSON.stringify(validatedData.requirements),
        learningOutcomes: JSON.stringify(validatedData.learningOutcomes),
        targetAudience: JSON.stringify(validatedData.targetAudience),
      }
    });

    return createSuccessResponse(course, 'Course created successfully');
  } catch (error: unknown) {
    console.error('[COURSES_CREATE_ERROR]', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        type: err.code
      }));
      const errorObj = {
        error: 'Validation error',
        message: 'Failed to validate course data',
        details: validationErrors
      };
      return NextResponse.json(errorObj, { status: 400 });
    }

    // Handle image upload errors
    if (error instanceof Error && error.message.includes('Failed to process image')) {
      const errorObj = {
        error: 'Image upload failed',
        message: 'Failed to process course image. Please try uploading a different image.',
        details: {
          type: 'image_processing_error',
          originalMessage: error.message
        }
      };
      return NextResponse.json(errorObj, { status: 400 });
    }

    // Handle database errors
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      const errorObj = {
        error: 'Database error',
        message: error.message,
        details: {
          type: 'database_error',
          code: (error as any).code || 'UNKNOWN'
        }
      };
      return NextResponse.json(errorObj, { status: 500 });
    }

    // Handle other errors
    if (error instanceof Error) {
      const errorObj = {
        error: 'Failed to create course',
        message: error.message || 'An unexpected error occurred',
        details: {
          name: error.name,
          stack: error.stack
        }
      };
      return NextResponse.json(errorObj, { status: 500 });
    }

    // Fallback for unknown errors
    const errorObj = {
      error: 'Failed to create course',
      message: 'An unexpected error occurred',
      details: {
        type: 'unknown_error'
      }
    };
    return NextResponse.json(errorObj, { status: 500 });
  }
}

// GET /api/courses - Get all available courses with filtering, search, and pagination
export async function GET(req: Request) {
  console.log('=== STARTING COURSES API HANDLER ===');
  console.log('Request URL:', req.url);
  
  // Log all request headers for debugging
  const requestHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });
  console.log('Request Headers:', requestHeaders);
  
  try {
    // Get the user session to check if they're authenticated
    console.log('Getting user session...');
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? {
      userId: session.user?.id,
      email: session.user?.email,
      role: session.user?.role,
      expires: session.expires
    } : 'No active session');
    
    // Extract query parameters
    console.log('Extracting query parameters...');
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    console.log('Query Parameters:', queryParams);
    
    // Parse pagination and filter parameters with validation
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const difficulty = searchParams.get('difficulty') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
    const status = searchParams.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    
    console.log('Processed Parameters:', {
      page,
      limit,
      search,
      category,
      difficulty,
      status,
      sortBy,
      sortOrder
    });
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause
    const whereClause: any = {};
    
    // For non-authenticated users or regular students, only show published courses
    if (!session?.user?.role || session.user.role === 'STUDENT') {
      whereClause.isPublished = true;
    } else if (session.user.role === 'INSTRUCTOR') {
      // For instructors, show their own courses regardless of published status, but only published courses from others
      whereClause.OR = [
        { instructorId: session.user.id },
        { isPublished: true }
      ];
    }
    
    // Apply search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Apply category filter
    if (category) {
      whereClause.category = category;
    }
    
    // Apply difficulty filter
    if (difficulty) {
      whereClause.level = difficulty;
    }
    
    // Apply status filter (only for admins and instructors)
    if (status && (session?.user?.role === 'ADMIN' || session?.user?.role === 'INSTRUCTOR')) {
      whereClause.status = status;
    }
    
    // Set up sorting
    let orderBy: any = { createdAt: 'desc' };
    
    switch (sortBy) {
      case 'title':
        orderBy = { title: sortOrder };
        break;
      case 'price':
        orderBy = { price: sortOrder };
        break;
      case 'rating':
        orderBy = { averageRating: sortOrder };
        break;
      case 'enrollmentCount':
        orderBy = { totalStudents: sortOrder };
        break;
      case 'updatedAt':
        orderBy = { updatedAt: sortOrder };
        break;
      case 'createdAt':
      default:
        orderBy = { createdAt: sortOrder };
    }
    
    try {
      // Execute the query with pagination and include related data
      const [courses, totalCount] = await Promise.all([
        prisma.course.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            description: true,
            image: true,
            level: true,
            price: true,
            language: true,
            createdAt: true,
            updatedAt: true,
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            },
            modules: {
              select: {
                id: true,
                title: true,
                description: true,
                order: true,
                _count: {
                  select: { lessons: true }
                }
              },
              orderBy: { order: 'asc' }
            },
            _count: {
              select: {
                enrollments: true,
                modules: true
              }
            }
          }
        }),
        prisma.course.count({ where: whereClause })
      ]);
      
      console.log(`Fetched ${courses.length} courses successfully`);
      
      // Define types for the modules
      interface ModuleWithCount {
        _count: {
          lessons: number;
        };
        id: string;
        title: string;
        description: string | null;
        order: number;
      }

      // Transform the data for the client
      const coursesWithStats = courses.map(course => {
        // Calculate total lesson count
        const lessonCount = course.modules.reduce((total: number, module: ModuleWithCount) => {
          return total + (module._count?.lessons || 0);
        }, 0);
        
        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          imageUrl: course.image || '/course-placeholder.jpg',
          difficulty: course.level || 'BEGINNER',
          price: course.price || 0,
          language: course.language || 'en',
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          instructor: {
            id: course.instructor.id,
            name: course.instructor.name || 'Unknown Instructor',
            avatarUrl: course.instructor.image || undefined,
            title: 'Instructor',
            email: course.instructor.email
          },
          lessonCount,
          isEnrolled: false, // Will be set by the client if needed
          isFavorite: false, // Will be set by the client if needed
          isNew: new Date().getTime() - new Date(course.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000, // New if created in the last 30 days
          isBestSeller: false, // Could be based on enrollment count or other criteria
          progress: 0, // Will be set by the client if needed
          modules: course.modules.map((module: ModuleWithCount) => ({
            id: module.id,
            title: module.title,
            description: module.description || '',
            order: module.order,
            lessons: [] // Will be loaded separately if needed
          })),
          rating: 0, // Will be set by the client if needed
          reviewCount: 0, // Will be set by the client if needed
          studentCount: course._count?.enrollments || 0,
          moduleCount: course._count?.modules || 0,
          promoVideo: '' // Will be set if available
        };
      });
      
      // Return the paginated response
      return NextResponse.json({
        courses: coursesWithStats,
        pagination: {
          page,
          limit,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + courses.length < totalCount
        }
      });
      
    } catch (error) {
      console.error('Error in courses API:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch courses',
          details: (error as Error).message,
          stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in courses API:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/batch - Perform batch operations on courses
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createUnauthorizedResponse('Authentication required');
    }
    
    const userIdNum = toNumber(session.user.id);
    
    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: userIdNum?.toString() },
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
          const enrollments = await prisma.enrollment.findMany({
            where: {
              courseId: { in: courseIds },
              status: 'ACTIVE'
            },
            select: { courseId: true }
          });
          
          // Create map of courses with enrollments
          const enrollmentMap = enrollments.reduce((map: Record<string, number>, item) => {
            const courseId = item.courseId;
            map[courseId] = (map[courseId] || 0) + 1;
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
