import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Schema for analytics dashboard filters
const filterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  instructorIds: z.array(z.string().or(z.number())).optional(),
});

// Type definitions for analytics data
type InstructorData = {
  id: number;
  name: string | null;
  image: string | null;
  courseCount: number;
  enrollmentCount: number;
  revenue: number;
};

type RevenueData = {
  total: number;
  byMonth: Array<{
    date: Date;
    amount: number;
  }>;
};

type EnrollmentData = {
  total: number;
  completed: number;
  completionRate: number;
  byDate: Array<{
    date: Date;
    count: number;
  }>;
};

type CourseData = {
  id: string;
  title: string;
  imageUrl: string | null;
  instructorName: string | null;
  enrollmentCount?: number;
  reviewCount?: number;
};

type AnalyticsData = {
  overview: {
    totalRevenue: number;
    totalEnrollments: number;
    totalCourses: number;
    totalUsers: number;
  };
  revenue: RevenueData;
  enrollments: EnrollmentData;
  courses: {
    total: number;
    published: number;
    draft: number;
    featured: number;
    archived: number;
    publishedPercent: number;
  };
  users: {
    total: number;
    active: number;
    instructors: number;
    activePercent: number;
  };
  content: {
    modules: number;
    lessons: number;
    averageLessonsPerModule: number;
    averageModulesPerCourse: number;
    comments: number;
    forumPosts: number;
    completedLessons: number;
  };
  topCourses: {
    byEnrollment: CourseData[];
    byRating: CourseData[];
  };
  topInstructors: InstructorData[];
  recentActivity: Array<{
    id: string;
    type: string;
    resourceId: string;
    resourceType: string;
    createdAt: Date;
    user: {
      id: number;
      name: string | null;
      image: string | null;
    } | null;
  }>;
};

// Ensure the route is always dynamically rendered
export const dynamic = 'force-dynamic';

// Cache TTL for analytics data (5 minutes)
const CACHE_TTL = 300;

/**
 * GET /api/admin/analytics/dashboard - Get admin analytics dashboard data
 */
export async function GET(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    const userId = Number(session.user.id);
    
    // Apply rate limiting to prevent API abuse
    const limiter = rateLimit({
      limit: 10,
      timeframe: 60, // 10 requests per minute
      identifier: `analytics_${userId}`
    });
    
    const rateLimitResponse = await limiter.check(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Parse query parameters for filtering
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    // Parse and validate filters
    const parsedFilters = filterSchema.safeParse({
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      categoryIds: searchParams.categoryIds ? JSON.parse(searchParams.categoryIds as string) : undefined,
      instructorIds: searchParams.instructorIds ? JSON.parse(searchParams.instructorIds as string) : undefined,
    });
    
    if (!parsedFilters.success) {
      return NextResponse.json(
        { error: 'Invalid filters', details: parsedFilters.error },
        { status: 400 }
      );
    }
    
    // Extract validated filters
    const filters = parsedFilters.data;
    
    // Build date filter condition if dates are provided
    const dateFilter: Record<string, any> = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.lte = new Date(filters.endDate);
    }
    
    // Build course where conditions
    const whereConditions: Record<string, any> = {};
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      whereConditions.categoryId = { in: filters.categoryIds };
    }
    if (filters.instructorIds && filters.instructorIds.length > 0) {
      whereConditions.instructorId = { in: filters.instructorIds };
    }
    if (Object.keys(dateFilter).length > 0) {
      whereConditions.createdAt = dateFilter;
    }
    
    // Calculate the date 30 days ago for active user metrics
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    // Generate cache key based on filters
    const cacheKey = `admin_analytics_${JSON.stringify(filters)}`;
    
    // Get analytics data
    // Run all database queries in parallel for performance
    const [
      // Course statistics
      courseCounts,
      
      // User statistics
      userCounts,
      
      // Enrollment statistics
      enrollmentCounts,
      enrollmentCompletions,
      enrollmentsByDate,
      
      // Top instructors with their courses and enrollments
      topInstructors,
      
      // Top courses by enrollment
      topEnrolledCourses,
      
      // Top courses by rating (approximated with reviews count)
      topRatedCourses,
      
      // Content statistics
      moduleCount,
      lessonCount,
      
      // Activity statistics
      commentCount,
      forumPostCount,
      completedLessonCount,
      
      // Recent activities
      recentActivities
    ] = await Promise.all([
      // Course statistics
      prisma.course.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      
      // User statistics
      prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ 
          where: { 
            updatedAt: { gte: oneMonthAgo } 
          } 
        }),
        prisma.user.count({ 
          where: { 
            role: 'INSTRUCTOR' 
          } 
        })
      ]),
      
      // Enrollment statistics
      prisma.enrollment.count({
        where: {
          course: Object.keys(whereConditions).length ? { ...whereConditions } : undefined,
          createdAt: Object.keys(dateFilter).length ? dateFilter : undefined
        }
      }),
      prisma.enrollment.count({
        where: {
          course: Object.keys(whereConditions).length ? { ...whereConditions } : undefined,
          completedAt: { not: null },
          createdAt: Object.keys(dateFilter).length ? dateFilter : undefined
        }
      }),
      prisma.enrollment.groupBy({
        by: ['createdAt'],
        _count: {
          id: true
        },
        where: {
          course: Object.keys(whereConditions).length ? { ...whereConditions } : undefined,
          createdAt: Object.keys(dateFilter).length ? dateFilter : undefined
        },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Top instructors with their courses and enrollments
      prisma.user.findMany({
        where: {
          role: 'INSTRUCTOR'
        },
        select: {
          id: true,
          name: true,
          image: true,
          _count: {
            select: { 
              createdCourses: { where: whereConditions },
              enrollments: true
            }
          }
        },
        orderBy: { 
          createdAt: 'desc'
        },
        take: 5
      }),
      
      // Top courses by enrollment
      prisma.course.findMany({
        where: whereConditions,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          instructor: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: [{ 
          createdAt: 'desc'
        }],
        take: 5
      }),
      
      // Top courses (as a proxy for rating)
      prisma.course.findMany({
        where: whereConditions,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          instructor: {
            select: {
              id: true,
              name: true
            }
          },
          _count: true
        },
        orderBy: { 
          createdAt: 'desc' 
        },
        take: 5
      }),
      
      // Module count
      prisma.module.count({
        where: {
          course: Object.keys(whereConditions).length ? { ...whereConditions } : undefined
        }
      }),
      
      // Lesson count
      prisma.lesson.count({
        where: {
          module: {
            course: Object.keys(whereConditions).length ? { ...whereConditions } : undefined
          }
        }
      }),
      
      // Comment count - using Enrollment as a placeholder since Comment model doesn't exist
      prisma.enrollment.count({
        where: {
          createdAt: Object.keys(dateFilter).length ? dateFilter : undefined
        }
      }),
      
      // Forum post count - we'll use enrollment data as a placeholder
      prisma.enrollment.count({
        where: {
          createdAt: Object.keys(dateFilter).length ? dateFilter : undefined
        }
      }),
      
      // Completed lesson count
      prisma.progress.count({ 
        where: { 
          lesson: { module: { course: Object.keys(whereConditions).length ? { ...whereConditions } : undefined } },
          completed: true,
          createdAt: Object.keys(dateFilter).length ? dateFilter : undefined 
        } 
      }),
      
      // Recent enrollments (using as placeholder for activities)
      prisma.enrollment.findMany({
        where: {
          createdAt: Object.keys(dateFilter).length ? dateFilter : undefined
        },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);
    
    // Process course statistics
    const totalCourses = courseCounts.reduce((sum: number, item: {status: string, _count: {id: number}}) => sum + item._count.id, 0);
    const publishedCourses = courseCounts.find((item: {status: string, _count: {id: number}}) => item.status === 'PUBLISHED')?._count.id || 0;
    const coursesInDraft = courseCounts.find((item: {status: string, _count: {id: number}}) => item.status === 'DRAFT')?._count.id || 0;
    const featuredCourses = courseCounts.find((item: {status: string, _count: {id: number}}) => item.status === 'FEATURED')?._count.id || 0;
    const archivedCourses = courseCounts.find((item: {status: string, _count: {id: number}}) => item.status === 'ARCHIVED')?._count.id || 0;
    
    // Process user statistics
    const [totalUsers, activeUsers, instructorCount] = userCounts;
    
    // Process enrollment data
    const totalEnrollments = enrollmentCounts;
    const completedEnrollments = enrollmentCompletions;
    
    // Process enrollment data by date
    const enrollmentData: EnrollmentData = {
      total: totalEnrollments,
      completed: completedEnrollments,
      completionRate: totalEnrollments > 0 ? 
        Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
      byDate: enrollmentsByDate.map((item: {createdAt: Date, _count: {id: number}}) => ({
        date: item.createdAt,
        count: item._count.id
      }))
    };
    
    // Process top instructors data
    const instructorData = topInstructors.map((instructor: any) => ({
      id: instructor.id,
      name: instructor.name,
      image: instructor.image,
      courseCount: instructor._count.createdCourses,
      enrollmentCount: instructor._count.enrollments,
      revenue: 0 // No revenue model in schema yet
    }));
    
    // Process module and lesson stats
    const totalModules = moduleCount;
    const totalLessons = lessonCount;
    const totalComments = commentCount;
    const totalForumPosts = forumPostCount;
    const totalCompletedLessons = completedLessonCount;
    
    // Mock revenue data since we don't have a Payment model
    // In a real implementation, this would come from a Payment/Transaction model
    const revenueData: RevenueData = {
      total: 0,
      byMonth: [
        { date: new Date(), amount: 0 } // Placeholder
      ]
    };
    
    // Compile all analytics data
    const analyticsData: AnalyticsData = {
      overview: {
        totalRevenue: revenueData.total,
        totalEnrollments,
        totalCourses,
        totalUsers
      },
      revenue: revenueData,
      enrollments: enrollmentData,
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: coursesInDraft,
        featured: featuredCourses,
        archived: archivedCourses,
        publishedPercent: totalCourses > 0 ? 
          Math.round((publishedCourses / totalCourses) * 100) : 0
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        instructors: instructorCount,
        activePercent: totalUsers > 0 ? 
          Math.round((activeUsers / totalUsers) * 100) : 0
      },
      content: {
        modules: totalModules,
        lessons: totalLessons,
        averageLessonsPerModule: totalModules > 0 ? 
          Math.round(totalLessons / totalModules * 10) / 10 : 0,
        averageModulesPerCourse: totalCourses > 0 ? 
          Math.round(totalModules / totalCourses * 10) / 10 : 0,
        comments: totalComments,
        forumPosts: totalForumPosts,
        completedLessons: totalCompletedLessons
      },
      topInstructors: instructorData,
      topCourses: {
        byEnrollment: topEnrolledCourses.map((course: any) => ({
          id: course.id,
          title: course.title,
          imageUrl: course.imageUrl,
          instructorName: course.instructor?.name || null,
          enrollmentCount: course._count?.enrollments || 0
        })),
        byRating: topRatedCourses.map((course: any) => ({
          id: course.id,
          title: course.title,
          imageUrl: course.imageUrl,
          instructorName: course.instructor?.name || null,
          reviewCount: course._count || 0
        }))
      },
      recentActivity: recentActivities.map((enrollment: any) => ({
        id: enrollment.id,
        type: 'enrollment',
        resourceId: enrollment.course.id,
        resourceType: 'course',
        createdAt: enrollment.createdAt,
        user: enrollment.user
      }))
    };
    
    // Return the analytics data
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin analytics data' },
      { status: 500 }
    );
  }
}
