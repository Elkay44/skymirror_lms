import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for analytics query parameters
const analyticsQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'year', 'all']).default('month'),
  courseId: z.string().optional(),
  instructorId: z.string().optional(),
  category: z.string().optional(),
  includeRevenue: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
  includeEnrollments: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
  includeCompletions: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
  includeRatings: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
  includeEngagement: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
});

// Helper function to get start date based on timeframe
function getStartDate(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'day':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'week':
      const day = now.getDay();
      return new Date(now.setDate(now.getDate() - day));
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    case 'all':
    default:
      return new Date(0); // Unix epoch
  }
}

// Dynamic route to ensure fresh data
export const dynamic = 'force-dynamic';

// GET /api/admin/analytics - Get analytics data for admin dashboard
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify admin role
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
    
    // Parse and validate query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const {
      timeframe,
      courseId,
      instructorId,
      category,
      includeRevenue,
      includeEnrollments,
      includeCompletions,
      includeRatings,
      includeEngagement
    } = analyticsQuerySchema.parse(searchParams);
    
    const startDate = getStartDate(timeframe);
    
    // Build base filters for queries
    const baseFilters: any = {
      createdAt: { gte: startDate }
    };
    
    if (courseId) {
      baseFilters.courseId = courseId;
    }
    
    if (instructorId) {
      baseFilters.course = { instructorId: Number(instructorId) };
    }
    
    if (category) {
      baseFilters.course = { 
        ...(baseFilters.course || {}),
        category
      };
    }
    
    // Initialize result object
    const result: any = {
      timeframe,
      startDate,
      endDate: new Date(),
      filters: {
        courseId: courseId || null,
        instructorId: instructorId || null,
        category: category || null
      }
    };
    
    // Run parallel queries for different metrics to optimize performance
    const queries: Promise<any>[] = [];
    
    // 1. Enrollment metrics
    if (includeEnrollments) {
      const enrollmentsQuery = prisma.$transaction([
        // Total enrollments in timeframe
        prisma.enrollment.count({
          where: baseFilters
        }),
        
        // Enrollments by status
        prisma.enrollment.groupBy({
          by: ['status'],
          where: baseFilters,
          _count: true
        }),
        
        // Daily enrollment trends
        prisma.$queryRaw`
          SELECT DATE(DATE_TRUNC('day', "createdAt")) as date,
                 COUNT(*) as count
          FROM "Enrollment"
          WHERE "createdAt" >= ${startDate}
          ${courseId ? prisma.$queryRaw`AND "courseId" = ${courseId}` : prisma.$queryRaw``}
          GROUP BY DATE(DATE_TRUNC('day', "createdAt"))
          ORDER BY date ASC
        `
      ]);
      
      queries.push(enrollmentsQuery);
    } else {
      queries.push(Promise.resolve(null));
    }
    
    // 2. Revenue metrics
    if (includeRevenue) {
      const revenueQuery = prisma.$transaction([
        // Total revenue in timeframe
        prisma.enrollment.aggregate({
          where: {
            ...baseFilters,
            paymentStatus: 'COMPLETED'
          },
          _sum: {
            amountPaid: true
          }
        }),
        
        // Revenue by course
        prisma.enrollment.groupBy({
          by: ['courseId'],
          where: {
            ...baseFilters,
            paymentStatus: 'COMPLETED'
          },
          _sum: {
            amountPaid: true
          }
        }),
        
        // Monthly revenue trends
        prisma.$queryRaw`
          SELECT DATE_TRUNC('month', "createdAt") as month,
                 SUM("amountPaid") as revenue
          FROM "Enrollment"
          WHERE "createdAt" >= ${startDate}
          AND "paymentStatus" = 'COMPLETED'
          ${courseId ? prisma.$queryRaw`AND "courseId" = ${courseId}` : prisma.$queryRaw``}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month ASC
        `
      ]);
      
      queries.push(revenueQuery);
    } else {
      queries.push(Promise.resolve(null));
    }
    
    // 3. Completion metrics
    if (includeCompletions) {
      const completionsQuery = prisma.$transaction([
        // Total completed courses
        prisma.enrollment.count({
          where: {
            ...baseFilters,
            status: 'COMPLETED'
          }
        }),
        
        // Average completion time (in days)
        prisma.$queryRaw`
          SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 86400) as avg_completion_days
          FROM "Enrollment"
          WHERE "status" = 'COMPLETED'
          AND "createdAt" >= ${startDate}
          ${courseId ? prisma.$queryRaw`AND "courseId" = ${courseId}` : prisma.$queryRaw``}
        `,
        
        // Completion rate by course
        prisma.$queryRaw`
          SELECT
            c.id as "courseId",
            c.title as "courseTitle",
            COUNT(e.id) as "totalEnrollments",
            COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) as "completedEnrollments",
            ROUND(COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(e.id), 0), 2) as "completionRate"
          FROM "Course" c
          LEFT JOIN "Enrollment" e ON c.id = e."courseId"
          WHERE e."createdAt" >= ${startDate}
          ${courseId ? prisma.$queryRaw`AND c.id = ${courseId}` : prisma.$queryRaw``}
          ${instructorId ? prisma.$queryRaw`AND c."instructorId" = ${Number(instructorId)}` : prisma.$queryRaw``}
          GROUP BY c.id, c.title
          ORDER BY "completionRate" DESC
        `
      ]);
      
      queries.push(completionsQuery);
    } else {
      queries.push(Promise.resolve(null));
    }
    
    // 4. Rating metrics
    if (includeRatings) {
      const ratingsQuery = prisma.$transaction([
        // Overall average rating
        prisma.courseReview.aggregate({
          where: {
            ...baseFilters
          },
          _avg: {
            rating: true
          },
          _count: true
        }),
        
        // Ratings distribution
        prisma.courseReview.groupBy({
          by: ['rating'],
          where: baseFilters,
          _count: true
        }),
        
        // Top rated courses
        prisma.$queryRaw`
          SELECT
            c.id as "courseId",
            c.title as "courseTitle",
            AVG(r.rating) as "averageRating",
            COUNT(r.id) as "reviewCount"
          FROM "Course" c
          JOIN "CourseReview" r ON c.id = r."courseId"
          WHERE r."createdAt" >= ${startDate}
          ${courseId ? prisma.$queryRaw`AND c.id = ${courseId}` : prisma.$queryRaw``}
          ${instructorId ? prisma.$queryRaw`AND c."instructorId" = ${Number(instructorId)}` : prisma.$queryRaw``}
          GROUP BY c.id, c.title
          HAVING COUNT(r.id) >= 3
          ORDER BY "averageRating" DESC, "reviewCount" DESC
          LIMIT 10
        `
      ]);
      
      queries.push(ratingsQuery);
    } else {
      queries.push(Promise.resolve(null));
    }
    
    // 5. Engagement metrics
    if (includeEngagement) {
      const engagementQuery = prisma.$transaction([
        // Total discussion posts and comments
        prisma.$queryRaw`
          SELECT
            (SELECT COUNT(*) FROM "DiscussionPost" 
             WHERE "createdAt" >= ${startDate}
             ${courseId ? prisma.$queryRaw`AND "courseId" = ${courseId}` : prisma.$queryRaw``}) as "totalPosts",
            (SELECT COUNT(*) FROM "Comment" c
             JOIN "DiscussionPost" d ON c."discussionId" = d.id
             WHERE c."createdAt" >= ${startDate}
             ${courseId ? prisma.$queryRaw`AND d."courseId" = ${courseId}` : prisma.$queryRaw``}) as "totalComments"
        `,
        
        // Average lesson completion time
        prisma.$queryRaw`
          SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) / 60) as avg_completion_minutes
          FROM "LessonProgress"
          WHERE "completedAt" IS NOT NULL
          AND "createdAt" >= ${startDate}
          ${courseId ? prisma.$queryRaw`AND "lesson"."moduleId" IN (
            SELECT id FROM "Module" WHERE "courseId" = ${courseId}
          )` : prisma.$queryRaw``}
        `,
        
        // Most active courses by discussion activity
        prisma.$queryRaw`
          SELECT
            c.id as "courseId",
            c.title as "courseTitle",
            COUNT(DISTINCT d.id) as "discussionCount",
            COUNT(DISTINCT cm.id) as "commentCount",
            COUNT(DISTINCT d."userId") + COUNT(DISTINCT cm."userId") as "activeUsers"
          FROM "Course" c
          LEFT JOIN "DiscussionPost" d ON c.id = d."courseId"
          LEFT JOIN "Comment" cm ON d.id = cm."discussionId"
          WHERE (d."createdAt" >= ${startDate} OR cm."createdAt" >= ${startDate})
          ${courseId ? prisma.$queryRaw`AND c.id = ${courseId}` : prisma.$queryRaw``}
          ${instructorId ? prisma.$queryRaw`AND c."instructorId" = ${Number(instructorId)}` : prisma.$queryRaw``}
          GROUP BY c.id, c.title
          ORDER BY "activeUsers" DESC
          LIMIT 10
        `
      ]);
      
      queries.push(engagementQuery);
    } else {
      queries.push(Promise.resolve(null));
    }
    
    // Additional summary metrics
    const summaryQuery = prisma.$transaction([
      // Total active courses
      prisma.course.count({
        where: {
          isPublished: true,
          ...(instructorId ? { instructorId: Number(instructorId) } : {})
        }
      }),
      
      // Total active students
      prisma.user.count({
        where: {
          role: 'STUDENT',
          enrollments: {
            some: {
              createdAt: { gte: startDate },
              ...(courseId ? { courseId } : {})
            }
          }
        }
      }),
      
      // Total active instructors
      prisma.user.count({
        where: {
          role: 'INSTRUCTOR',
          courses: {
            some: {
              enrollments: {
                some: {
                  createdAt: { gte: startDate }
                }
              }
            }
          }
        }
      })
    ]);
    
    queries.push(summaryQuery);
    
    // Execute all queries in parallel
    const [
      enrollmentsData,
      revenueData,
      completionsData,
      ratingsData,
      engagementData,
      summaryData
    ] = await Promise.all(queries);
    
    // Populate result object with query results
    
    // Summary data
    const [totalActiveCourses, totalActiveStudents, totalActiveInstructors] = summaryData;
    
    result.summary = {
      totalActiveCourses,
      totalActiveStudents,
      totalActiveInstructors
    };
    
    // Enrollment data
    if (includeEnrollments && enrollmentsData) {
      const [totalEnrollments, enrollmentsByStatus, enrollmentTrends] = enrollmentsData;
      
      result.enrollments = {
        total: totalEnrollments,
        byStatus: enrollmentsByStatus.reduce((acc: any, item: any) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        dailyTrends: enrollmentTrends
      };
    }
    
    // Revenue data
    if (includeRevenue && revenueData) {
      const [totalRevenue, revenueByCoursePrisma, monthlyRevenueTrends] = revenueData;
      
      // Convert revenue by course to a more usable format
      const revenueByCourse = await Promise.all(
        revenueByCoursePrisma.map(async (item: any) => {
          const course = await prisma.course.findUnique({
            where: { id: item.courseId },
            select: { title: true }
          });
          
          return {
            courseId: item.courseId,
            courseTitle: course?.title || 'Unknown Course',
            revenue: item._sum.amountPaid
          };
        })
      );
      
      result.revenue = {
        total: totalRevenue._sum.amountPaid || 0,
        byCourse: revenueByCourse,
        monthlyTrends: monthlyRevenueTrends
      };
    }
    
    // Completion data
    if (includeCompletions && completionsData) {
      const [totalCompletedCourses, avgCompletionTime, completionRateByCourse] = completionsData;
      
      result.completions = {
        total: totalCompletedCourses,
        averageCompletionDays: avgCompletionTime[0]?.avg_completion_days || 0,
        byCourse: completionRateByCourse
      };
    }
    
    // Rating data
    if (includeRatings && ratingsData) {
      const [overallRating, ratingDistribution, topRatedCourses] = ratingsData;
      
      // Convert ratings distribution to a more usable format
      const ratingsMap: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) {
        ratingsMap[i] = 0;
      }
      
      ratingDistribution.forEach((item: any) => {
        ratingsMap[item.rating] = item._count;
      });
      
      result.ratings = {
        average: overallRating._avg.rating || 0,
        total: overallRating._count || 0,
        distribution: ratingsMap,
        topCourses: topRatedCourses
      };
    }
    
    // Engagement data
    if (includeEngagement && engagementData) {
      const [discussionStats, avgLessonCompletionTime, mostActiveCourses] = engagementData;
      
      result.engagement = {
        discussions: {
          totalPosts: Number(discussionStats[0]?.totalPosts || 0),
          totalComments: Number(discussionStats[0]?.totalComments || 0)
        },
        avgLessonCompletionMinutes: Number(avgLessonCompletionTime[0]?.avg_completion_minutes || 0),
        mostActiveCourses
      };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[ADMIN_ANALYTICS_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
