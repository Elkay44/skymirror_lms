import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Cache TTL in milliseconds for instructor dashboard data
const CACHE_TTL = 60 * 1000; // 1 minute cache

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const instructorDashboardCache = new Map<string, CacheEntry>();

// GET /api/instructor/dashboard - Get instructor dashboard data
export async function GET() {
  try {
    // Get the user session to check if they're authenticated
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Convert userId to number and validate
    const instructorId = parseInt(userId.toString(), 10);
    if (isNaN(instructorId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Check if the user is an instructor or admin
    const user = await prisma.user.findUnique({
      where: { id: String(instructorId) },
      select: { role: true },
    });
    
    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only instructors and admins can access this endpoint' },
        { status: 403 }
      );
    }
    
    // Check cache first
    const cacheKey = `instructor-dashboard-${instructorId}`;
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

    // Get recent enrollments across instructor's courses
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
        createdAt: 'desc' as const,
      },
      take: 5,
    });

    // Get recent activities
    const recentActivities = await (prisma as any).activityLog.findMany({
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
        createdAt: 'desc' as const,
      },
      take: 10,
    });

    // Calculate total students across all courses
    const enrollments = await (prisma as any).enrollment.findMany({
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
        instructorId: instructorId,
      },
      include: {
        enrollments: {
          select: {
            id: true,
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
    });

    // Format the response data with proper types
    const responseData = {
      stats: {
        totalCourses,
        publishedCourses: publishedCount,
        draftCourses: draftCount,
        totalStudents,
        recentEnrollments: recentEnrollments.map(enrollment => {
          // Handle cases where user or course might be null
          const userName = 'user' in enrollment ? (enrollment.user as { name?: string }).name || 'Unknown' : 'Unknown';
          const userEmail = 'user' in enrollment ? (enrollment.user as { email?: string }).email || '' : '';
          const userImage = 'user' in enrollment ? (enrollment.user as { image?: string }).image : undefined;
          const courseTitle = 'course' in enrollment ? (enrollment as any).course?.title || 'Unknown Course' : 'Unknown Course';
          
          return {
            id: enrollment.id,
            userName,
            userEmail,
            userImage,
            courseTitle,
            enrolledAt: enrollment.createdAt,
          };
        }),
        recentActivities: recentActivities.map((activity: any) => {
          // Handle cases where user or course might be null
          const userName = 'user' in activity ? (activity as any).user?.name || 'Unknown' : 'System';
          const userEmail = 'user' in activity ? (activity as any).user?.email || '' : '';
          const courseTitle = 'course' in activity ? (activity as any).course?.title || 'Unknown Course' : 'System';
          
          return {
            id: activity.id,
            action: activity.action || 'Unknown action',
            details: 'details' in activity ? activity.details : '',
            userName,
            userEmail,
            courseTitle,
            timestamp: activity.createdAt,
          };
        }),
        courseCompletion: courses.map(course => {
          const enrollmentsCount = course.enrollments?.length || 0;
          const modules = course.modules || [];
          const totalLessons = modules.reduce(
            (sum: number, module: { _count?: { lessons?: number } }) => sum + (module?._count?.lessons || 0),
            0
          );

          return {
            courseId: course.id,
            courseTitle: course.title,
            totalEnrollments: enrollmentsCount,
            totalLessons,
          };
        }),
      },
      lastUpdated: new Date().toISOString(),
    };

    // Update cache
    instructorDashboardCache.set(cacheKey, {
      data: responseData,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching instructor dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
