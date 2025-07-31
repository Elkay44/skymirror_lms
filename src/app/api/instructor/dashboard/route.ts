import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardData, Activity, Course, CourseStatus, ActivityType } from '@/types/dashboard';
import { format } from 'date-fns';
import type { Session } from 'next-auth';

// Cache TTL in milliseconds for instructor dashboard data
const CACHE_TTL = 60 * 1000; // 1 minute cache

interface CacheEntry {
  data: DashboardData;
  expiresAt: number;
}

const instructorDashboardCache = new Map<string, CacheEntry>();

// GET /api/instructor/dashboard - Get instructor dashboard data
export async function GET() {
  try {
    // Get the user session to check if they're authenticated
    const session = await getServerSession(authOptions) as Session;
    if (!session?.user?.role || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const instructorId = userId.toString();
    
    // Check if the user is an instructor or admin
    const user = await prisma.user.findUnique({
      where: { id: instructorId },
      select: { 
        role: true,
        name: true
      },
    });
    
    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only instructors and admins can access this endpoint' },
        { status: 403 }
      );
    }

    // Create cache key based on instructor ID
    const cacheKey = `instructor_dashboard_${instructorId}`;

    // Check cache first
    const cachedData = instructorDashboardCache.get(cacheKey);
    if (cachedData && cachedData.expiresAt > Date.now()) {
      return NextResponse.json(cachedData.data);
    }

    // Get course statistics (published, draft, total)
    const [publishedCount, draftCount] = await Promise.all([
      prisma.course.count({
        where: { 
          instructorId: instructorId,
          isPublished: true 
        },
      }),
      prisma.course.count({
        where: { 
          instructorId: instructorId,
          isPublished: false 
        },
      })
    ]);

    const totalCourses = publishedCount + draftCount;

    // Get recent enrollments
    const recentEnrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          instructorId: instructorId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    // Get recent activities
    const recentActivities = await prisma.activityLog.findMany({
      where: {
        course: {
          instructorId: instructorId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }).catch((error) => {
      console.error('Error fetching recent activities:', error);
      throw error;
    });

    // Calculate total students across all courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          instructorId: instructorId,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });
    
    const totalStudents = enrollments.length;

    // Get course completion statistics
    const courses = await prisma.course.findMany({
      where: {
        instructorId,
      },
      include: {
        enrollments: {
          select: {
            id: true,
            progress: true,
          },
        },
        modules: {
          include: {
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
      },
    }).then(courses => {
      return courses.map((course: any) => ({
        ...course,
        completionRate: course.enrollments.reduce((sum: number, enrollment: {
          progress: number;
        }) => {
          return sum + (enrollment.progress || 0);
        }, 0) / (course.enrollments.length || 1),
        averageRating: course.averageRating || 0
      })) as Course[];
    }).catch((error) => {
      console.error('Error processing recent courses:', error);
      throw error;
    });

    // Get recent courses with enrollment data
    interface Enrollment {
      id: string;
      progress: number;
      userId: string;
      courseId: string;
    }

    interface Module {
      id: string;
      title: string;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCourses = await prisma.course.findMany({
      where: {
        instructorId: instructorId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        enrollments: {
          select: {
            id: true,
            progress: true,
            userId: true,
            courseId: true,
          },
        },
        modules: {
          include: {
            lessons: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    // Format the response data
    const responseData: DashboardData = {
      instructorName: user.name || 'Instructor',
      recentCourses: recentCourses.map((course: any) => ({
        id: course.id,
        title: course.title,
        imageUrl: course.imageUrl || null,
        averageRating: course.averageRating || 0,
        enrollments: course.enrollments,
        modules: course.modules.map((module: any) => ({
          id: module.id,
          title: module.title,
          lessons: module.lessons.length,
        })),
        status: course.status as CourseStatus,
        completionRate: course.enrollments.reduce((sum: number, enrollment: any) => {
          return sum + (enrollment.progress || 0);
        }, 0) / (course.enrollments.length || 1),
        updatedAt: format(new Date(course.updatedAt), 'yyyy-MM-dd HH:mm'),
      })) as Course[],
      recentActivity: recentActivities.map((activity) => ({
        id: activity.id,
        studentName: activity.user?.name || 'Unknown',
        studentImage: activity.user?.image || null,
        activityType: activity.type as ActivityType,
        courseId: activity.courseId,
        courseTitle: activity.course?.title || 'Unknown Course',
        message: activity.details || '',
        timestamp: format(new Date(activity.createdAt), 'yyyy-MM-dd HH:mm'),
      })) as Activity[],
      upcomingSessions: [],
      projectPerformance: [],
      earningsData: [],
      projectAnalytics: {
        labels: ['In Progress', 'Submitted', 'Reviewed', 'Approved'],
        data: [0, 0, 0, 0]
      },
      overallStats: {
        totalStudents: totalStudents,
        totalCourses: courses.length,
        totalRevenue: 0,
        newEnrollments: recentEnrollments.length,
        completionRate: recentCourses.reduce((sum: number, course: any) => {
          return sum + (course.enrollments.reduce((total: number, enrollment: any) => {
            return total + (enrollment.progress || 0);
          }, 0) / (course.enrollments.length || 1));
        }, 0) / (recentCourses.length || 1),
        averageRating: recentCourses.reduce((sum: number, course: any) => {
          return sum + (course.averageRating || 0);
        }, 0) / (recentCourses.length || 1)
      }
    };

    // Cache the response
    instructorDashboardCache.set(cacheKey, {
      data: responseData,
      expiresAt: Date.now() + CACHE_TTL
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching instructor dashboard data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
