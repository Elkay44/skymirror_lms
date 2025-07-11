import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Cache TTL in seconds for instructor dashboard data
const CACHE_TTL = 60; // 1 minute cache
const instructorDashboardCache = new Map();

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
    
    // Check if the user is an instructor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        name: true,
        email: true,
        image: true,
        role: true 
      },
    });
    
    if (!user || user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Only instructors can access this endpoint' },
        { status: 403 }
      );
    }
    
    // Check cache first
    const cacheKey = `instructor-dashboard-${userId}`;
    const cachedData = instructorDashboardCache.get(cacheKey);
    if (cachedData && cachedData.expiresAt > Date.now()) {
      return NextResponse.json(cachedData.data);
    }
    
    // Get course statistics (published, draft, total)
    const coursesData = await prisma.course.groupBy({
      by: ['isPublished'],
      where: { instructorId: userId },
      _count: true,
    });
    
    const courseStats = {
      published: coursesData.find(item => item.isPublished === true)?._count || 0,
      draft: coursesData.find(item => item.isPublished === false)?._count || 0,
      total: coursesData.reduce((acc, item) => acc + item._count, 0)
    };
    
    // Get total enrollment count across all courses
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        course: {
          instructorId: userId
        }
      }
    });
    
    // Get recent enrollments (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentEnrollmentsCount = await prisma.enrollment.count({
      where: {
        createdAt: { gte: oneWeekAgo },
        course: {
          instructorId: userId
        }
      }
    });
    
    // Get completion rate statistics
    // First, get all lessons for instructor's courses
    const coursesWithModulesAndLessons = await prisma.course.findMany({
      where: { instructorId: userId },
      select: {
        id: true,
        title: true,
        modules: {
          select: {
            id: true,
            lessons: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    });
    
    // Calculate total lessons
    let totalLessons = 0;
    const lessonIds: string[] = [];
    
    coursesWithModulesAndLessons.forEach(course => {
      course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          totalLessons++;
          lessonIds.push(lesson.id);
        });
      });
    });
    
    // Get progress data for these lessons
    const progressStats = await prisma.progress.groupBy({
      by: ['completed'],
      where: {
        lessonId: { in: lessonIds }
      },
      _count: true
    });
    
    const completedLessonsCount = progressStats.find(item => item.completed === true)?._count || 0;
    const completionRate = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
    
    // Get most active courses (by recent activity)
    const mostActiveCourses = await prisma.course.findMany({
      where: { instructorId: userId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        _count: {
          select: {
            enrollments: true
          }
        },
        enrollments: {
          take: 1,
          orderBy: {
            updatedAt: 'desc'
          },
          select: {
            updatedAt: true
          }
        }
      },
      orderBy: [
        { enrollments: { _count: 'desc' } },
        { updatedAt: 'desc' }
      ],
      take: 5
    });
    
    // Format most active courses
    const activeCourses = mostActiveCourses.map(course => ({
      id: course.id,
      title: course.title,
      imageUrl: course.imageUrl || `/course-placeholders/${Math.floor(Math.random() * 5) + 1}.jpg`,
      enrollmentCount: course._count.enrollments,
      lastActivity: course.enrollments[0]?.updatedAt ? getRelativeTimeString(course.enrollments[0].updatedAt) : 'No recent activity'
    }));
    
    // Get recent student progress as an alternative to feedback
    const recentProgress = await prisma.progress.findMany({
      where: {
        completed: true,
        lesson: {
          module: {
            course: {
              instructorId: userId
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 5
    });
    
    // Format student progress as activity feed
    const studentActivity = recentProgress.map(progress => ({
      id: progress.id,
      type: 'lesson_completion',
      createdAt: getRelativeTimeString(progress.createdAt),
      user: {
        id: progress.user.id,
        name: progress.user.name,
        image: progress.user.image
      },
      lesson: progress.lesson.title,
      module: progress.lesson.module.title,
      course: progress.lesson.module.course.title
    }));
    
    // Create instructor dashboard data
    const dashboardData = {
      instructor: {
        name: user.name,
        email: user.email,
        image: user.image,
      },
      courseStats,
      enrollmentStats: {
        total: enrollmentCount,
        recentEnrollments: recentEnrollmentsCount,
        enrollmentGrowth: enrollmentCount > 0 ? 
          Math.round((recentEnrollmentsCount / enrollmentCount) * 100) : 0
      },
      completionStats: {
        completionRate,
        totalLessons,
        completedLessons: completedLessonsCount
      },
      activeCourses,
      studentActivity: studentActivity,
      // Additional placeholder data
      revenueStats: {
        totalRevenue: 0, // Placeholder for actual revenue calculation
        recentRevenue: 0,
        projectedRevenue: 0
      },
      upcomingSchedule: [
        {
          id: '1',
          title: 'Office Hours',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          studentCount: 5
        }
      ]
    };
    
    // Save to cache before returning the response
    instructorDashboardCache.set(cacheKey, {
      data: dashboardData,
      expiresAt: Date.now() + (CACHE_TTL * 1000)
    });
    
    // Set cache header for browsers
    const response = NextResponse.json(dashboardData);
    response.headers.set('Cache-Control', `max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate`);
    
    return response;
  } catch (error) {
    console.error('Error fetching instructor dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructor dashboard data' },
      { status: 500 }
    );
  }
}

// Helper function to format relative time
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  } else {
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
}
