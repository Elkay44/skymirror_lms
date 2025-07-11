import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for admin course filtering and pagination
const adminCourseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  instructorId: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'status', 'enrollmentCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/admin/courses - Get courses with advanced filtering, search, and pagination
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const {
      page,
      limit,
      status,
      instructorId,
      search,
      sortBy,
      sortOrder
    } = adminCourseQuerySchema.parse(searchParams);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (instructorId) {
      whereClause.instructorId = instructorId;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build sorting options
    const orderBy: any = {};
    
    // Handle special case for enrollment count sorting
    if (sortBy === 'enrollmentCount') {
      // We'll handle this with a separate count query below
      orderBy.createdAt = sortOrder; // Default fallback
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Get total count of matching courses for pagination
    const totalCount = await prisma.course.count({ where: whereClause });

    // Query courses with relationships
    let courses = await prisma.course.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
        },
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    });

    // If sorting by enrollment count, we need to handle it manually
    if (sortBy === 'enrollmentCount') {
      courses = courses.sort((a, b) => {
        const countA = a._count.enrollments;
        const countB = b._count.enrollments;
        return sortOrder === 'asc' 
          ? countA - countB 
          : countB - countA;
      });
    }

    // Transform data for the response
    const transformedCourses = courses.map(course => {
      // Count total lessons across all modules
      const totalLessons = course.modules.reduce(
        (sum, module) => sum + module._count.lessons, 0
      );
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        status: course.status,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        instructor: course.instructor,
        enrollmentCount: course._count.enrollments,
        moduleCount: course.modules.length,
        lessonCount: totalLessons,
        price: course.price,
      };
    });

    return NextResponse.json({
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      }
    });
  } catch (error) {
    console.error('[ADMIN_COURSES_ERROR]', error);
    
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

// POST /api/admin/courses/actions - Admin actions for courses
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { action, courseId, data } = body;

    if (!action || !courseId) {
      return NextResponse.json(
        { error: 'Action and courseId are required' },
        { status: 400 }
      );
    }

    // Handle different admin actions
    switch (action) {
      case 'feature': {
        // Feature a course (could be for homepage highlighting)
        await prisma.course.update({
          where: { id: courseId },
          data: { isFeatured: true }
        });
        return NextResponse.json({ message: 'Course featured successfully' });
      }
      
      case 'unfeature': {
        await prisma.course.update({
          where: { id: courseId },
          data: { isFeatured: false }
        });
        return NextResponse.json({ message: 'Course unfeatured successfully' });
      }
      
      case 'changeInstructor': {
        if (!data?.instructorId) {
          return NextResponse.json(
            { error: 'Instructor ID is required for this action' },
            { status: 400 }
          );
        }
        
        // Verify the new instructor exists and is actually an instructor
        const newInstructor = await prisma.user.findFirst({
          where: {
            id: Number(data.instructorId),
            role: 'INSTRUCTOR'
          }
        });
        
        if (!newInstructor) {
          return NextResponse.json(
            { error: 'Invalid instructor ID or user is not an instructor' },
            { status: 400 }
          );
        }
        
        await prisma.course.update({
          where: { id: courseId },
          data: { instructorId: Number(data.instructorId) }
        });
        
        return NextResponse.json({ message: 'Course instructor changed successfully' });
      }
      
      case 'setCoursePrice': {
        if (typeof data?.price !== 'number' || data.price < 0) {
          return NextResponse.json(
            { error: 'Valid price is required for this action' },
            { status: 400 }
          );
        }
        
        await prisma.course.update({
          where: { id: courseId },
          data: { price: data.price }
        });
        
        return NextResponse.json({ message: 'Course price updated successfully' });
      }
      
      case 'approveCourse': {
        // This would be used in a course approval workflow
        await prisma.course.update({
          where: { id: courseId },
          data: { 
            status: 'PUBLISHED',
            isPublished: true,
            adminApproved: true,
            approvedAt: new Date()
          }
        });
        
        return NextResponse.json({ message: 'Course approved and published successfully' });
      }
      
      case 'rejectCourse': {
        if (!data?.rejectionReason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          );
        }
        
        await prisma.course.update({
          where: { id: courseId },
          data: { 
            status: 'DRAFT',
            isPublished: false,
            adminApproved: false,
            adminFeedback: data.rejectionReason
          }
        });
        
        return NextResponse.json({ message: 'Course rejected with feedback' });
      }
      
      default:
        return NextResponse.json(
          { error: 'Unsupported action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ADMIN_COURSE_ACTION_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
