import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for analytics timeframe filtering
const analyticsQuerySchema = z.object({
  timeframe: z.enum(['last7days', 'last30days', 'last90days', 'allTime']).default('last30days'),
  compareWithPrevious: z.enum(['true', 'false']).transform(value => value === 'true').default('true'),
});

// Ensure the API route is always dynamically rendered
export const dynamic = 'force-dynamic';

// GET /api/admin/analytics/courses - Get analytics data for courses
export async function GET(req: Request) {
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
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const { timeframe, compareWithPrevious } = analyticsQuerySchema.parse(queryParams);

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let previousPeriodStartDate: Date | null = null;

    switch (timeframe) {
      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        if (compareWithPrevious) {
          previousPeriodStartDate = new Date(startDate);
          previousPeriodStartDate.setDate(startDate.getDate() - 7);
        }
        break;
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        if (compareWithPrevious) {
          previousPeriodStartDate = new Date(startDate);
          previousPeriodStartDate.setDate(startDate.getDate() - 30);
        }
        break;
      case 'last90days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        if (compareWithPrevious) {
          previousPeriodStartDate = new Date(startDate);
          previousPeriodStartDate.setDate(startDate.getDate() - 90);
        }
        break;
      default: // allTime
        startDate = new Date(0); // Unix epoch start
    }

    // Get course enrollments for the current period
    const currentPeriodEnrollments = await prisma.enrollment.findMany({
      where: {
        enrolledAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        id: true,
        enrolledAt: true,
        course: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    // Get course enrollments for the previous period if comparison is requested
    let previousPeriodEnrollments: Array<{ id: string; courseId: string }> = [];
    if (compareWithPrevious && previousPeriodStartDate) {
      previousPeriodEnrollments = await prisma.enrollment.findMany({
        where: {
          enrolledAt: {
            gte: previousPeriodStartDate,
            lt: startDate,
          },
        },
        select: {
          id: true,
          courseId: true,
        },
      });
    }

    // Process enrollment data
    const courseStats = new Map();
    
    // Process current period enrollments
    currentPeriodEnrollments.forEach(enrollment => {
      const courseId = enrollment.course.id;
      if (!courseStats.has(courseId)) {
        courseStats.set(courseId, {
          id: courseId,
          title: enrollment.course.title,
          category: enrollment.course.category,
          currentEnrollments: 0,
          previousEnrollments: 0,
          enrollmentDates: [],
        });
      }
      const course = courseStats.get(courseId);
      course.currentEnrollments++;
      course.enrollmentDates.push(enrollment.enrolledAt);
    });

    // Process previous period enrollments if comparison is requested
    if (compareWithPrevious) {
      previousPeriodEnrollments.forEach(enrollment => {
        const courseId = enrollment.courseId;
        if (!courseStats.has(courseId)) {
          courseStats.set(courseId, {
            id: courseId,
            title: 'Unknown Course',
            category: 'Unknown',
            currentEnrollments: 0,
            previousEnrollments: 0,
            enrollmentDates: [],
          });
        }
        courseStats.get(courseId).previousEnrollments++;
      });
    }

    // Convert map to array and calculate growth rates
    const courses = Array.from(courseStats.values()).map(course => {
      const growthRate = compareWithPrevious && course.previousEnrollments > 0
        ? ((course.currentEnrollments - course.previousEnrollments) / course.previousEnrollments) * 100
        : 0;
      
      // Calculate enrollment trend (daily/weekly/monthly based on timeframe)
      let enrollmentTrend = 'stable';
      if (course.enrollmentDates.length > 1) {
        const sortedDates = [...course.enrollmentDates].sort((a, b) => a.getTime() - b.getTime());
        const firstDate = sortedDates[0];
        const lastDate = sortedDates[sortedDates.length - 1];
        const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0) {
          const enrollmentsPerDay = sortedDates.length / daysDiff;
          if (enrollmentsPerDay > 5) enrollmentTrend = 'increasing';
          else if (enrollmentsPerDay < 2) enrollmentTrend = 'decreasing';
        }
      }

      return {
        ...course,
        growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
        enrollmentTrend,
      };
    });

    // Sort courses by number of enrollments (descending)
    courses.sort((a, b) => b.currentEnrollments - a.currentEnrollments);

    // Get top 5 courses
    const topCourses = courses.slice(0, 5);

    // Calculate total enrollments
    const totalEnrollments = courses.reduce((sum, course) => sum + course.currentEnrollments, 0);
    const previousTotalEnrollments = compareWithPrevious 
      ? courses.reduce((sum, course) => sum + course.previousEnrollments, 0)
      : 0;
    
    const totalGrowthRate = compareWithPrevious && previousTotalEnrollments > 0
      ? ((totalEnrollments - previousTotalEnrollments) / previousTotalEnrollments) * 100
      : 0;

    // Calculate enrollments by category
    const enrollmentsByCategory: Record<string, number> = {};
    courses.forEach(course => {
      if (!enrollmentsByCategory[course.category]) {
        enrollmentsByCategory[course.category] = 0;
      }
      enrollmentsByCategory[course.category] += course.currentEnrollments;
    });

    // Prepare response data
    const responseData = {
      timeframe,
      totalCourses: courses.length,
      totalEnrollments,
      totalGrowthRate: Math.round(totalGrowthRate * 100) / 100,
      topCourses,
      enrollmentsByCategory: Object.entries(enrollmentsByCategory).map(([category, count]) => ({
        category,
        count,
      })),
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        category: course.category,
        enrollments: course.currentEnrollments,
        growthRate: course.growthRate,
        trend: course.enrollmentTrend,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course analytics' },
      { status: 500 }
    );
  }
}
