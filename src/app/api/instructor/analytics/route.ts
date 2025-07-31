import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';
import redis from '@/lib/redis';

// Cache configuration
const CACHE_TTL = 60 * 60; // 1 hour cache
const CACHE_KEY_PREFIX = 'analytics:instructor:';

// Cache invalidation configuration
const INVALIDATION_INTERVAL = 15 * 60; // 15 minutes
const INVALIDATION_KEYS = [
  'enrollment',
  'lessonView',
  'assignmentSubmission'
];

// Type for analytics data
interface AnalyticsData {
  timeSeries: {
    date: string;
    students: number;
    completion: number;
    engagement: number;
    assignments: number;
    courses: number;
  }[];
  heatmap: {
    day: string;
    hour: number;
    value: number;
  }[];
  metrics: {
    totalStudents: number;
    totalCourses: number;
    courseCompletion: number;
    averageEngagement: number;
    assignmentsSubmitted: number;
    averageAssignmentScore: number;
  };
}

// GET /api/instructor/analytics - Get instructor analytics data
export async function GET() {
  let cachedData: string | null = null;
  try {
    // Get the user session to check if they're authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const userId = session.user?.id as string;
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check if the user is an instructor or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only instructors and admins can access this endpoint' },
        { status: 403 }
      );
    }

    // Generate cache key with role prefix
    const cacheKey = `${CACHE_KEY_PREFIX}${user.role.toLowerCase()}:${userId}:${format(new Date(), 'yyyy-MM-dd')}`;

    try {
      // Try to get data from cache if Redis is configured
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
          cachedData = await redis.get(cacheKey);
          if (cachedData) {
            return NextResponse.json(JSON.parse(cachedData));
          }
        } catch (error) {
          console.error('Redis cache operation failed:', error);
          // Continue with fresh data if cache operation fails
        }
      } else {
        console.warn('Redis not configured, skipping cache');
      }
    } catch (error) {
      console.error('Error in Redis setup:', error);
      // Continue with fresh data if Redis setup fails
    }

    // Get date range for analytics (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Get course enrollment statistics
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: {
          in: await prisma.course.findMany({
            where: {
              instructorId: userId
            },
            select: {
              id: true
            }
          }).then(courses => courses.map(c => c.id))
        },
        enrolledAt: {
          gte: thirtyDaysAgo,
          lte: today
        }
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        enrolledAt: true,
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Get student engagement data
    const activities = await prisma.lessonView.findMany({
      where: {
        lessonId: {
          in: await prisma.lesson.findMany({
            where: {
              moduleId: {
                in: await prisma.module.findMany({
                  where: {
                    courseId: {
                      in: await prisma.course.findMany({
                        where: {
                          instructorId: userId
                        },
                        select: {
                          id: true
                        }
                      }).then(courses => courses.map(c => c.id))
                    }
                  },
                  select: {
                    id: true
                  }
                }).then(modules => modules.map(m => m.id))
              }
            },
            select: {
              id: true
            }
          }).then(lessons => lessons.map(l => l.id))
        },
        lastViewed: {
          gte: thirtyDaysAgo,
          lte: today
        }
      },
      select: {
        id: true,
        userId: true,
        lessonId: true,
        lastViewed: true
      }
    });

    // Get assignment submissions
    const assignments = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId: {
          in: await prisma.assignment.findMany({
            where: {
              moduleId: {
                in: await prisma.module.findMany({
                  where: {
                    courseId: {
                      in: await prisma.course.findMany({
                        where: {
                          instructorId: userId
                        },
                        select: {
                          id: true
                        }
                      }).then(courses => courses.map(c => c.id))
                    }
                  },
                  select: {
                    id: true
                  }
                }).then(modules => modules.map(m => m.id))
              }
            },
            select: {
              id: true
            }
          }).then(assignments => assignments.map(a => a.id))
        },
        submittedAt: {
          gte: thirtyDaysAgo,
          lte: today
        }
      },
      select: {
        id: true,
        grade: true,
        feedback: true,
        submittedAt: true,
        assignment: {
          select: {
            title: true
          }
        }
      }
    }).then(data => data.map(item => ({
      ...item,
      score: item.grade
    })) as {
      id: string;
      score: number | null;
      feedback: string | null;
      submittedAt: Date;
      assignment: {
        title: string;
      };
    }[]);

    // Generate time series data
    const timeSeriesData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Calculate metrics for this date using precise date comparison
      const dateStr = format(date, 'yyyy-MM-dd');
      const students = enrollments.filter(e => {
        const enrolledAt = e.enrolledAt ? new Date(e.enrolledAt) : null;
        return enrolledAt ? enrolledAt.toISOString().startsWith(dateStr) : false;
      }).length;
      const completion = activities.filter(a => {
        const lastViewed = new Date(a.lastViewed);
        return lastViewed.toISOString().startsWith(dateStr);
      }).length;
      const engagement = activities.filter(a => {
        const lastViewed = new Date(a.lastViewed);
        return lastViewed.toISOString().startsWith(dateStr);
      }).length;
      const assignmentsCount = assignments.filter(a => {
        const submittedAt = new Date(a.submittedAt);
        return submittedAt.toISOString().startsWith(dateStr);
      }).length;

      return {
        date: dateStr,
        students,
        completion,
        engagement,
        assignments: assignmentsCount,
        courses: enrollments.filter(e => {
          const enrolledAt = e.enrolledAt ? new Date(e.enrolledAt) : null;
          return enrolledAt ? enrolledAt.toISOString().startsWith(dateStr) : false;
        }).length
      };
    });

    // Generate heatmap data
    const daysOfWeek: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap: Record<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun', number> = {
      'Mon': 1,
      'Tue': 2,
      'Wed': 3,
      'Thu': 4,
      'Fri': 5,
      'Sat': 6,
      'Sun': 0
    };

    const heatmapData: Array<{ day: string; hour: number; value: number }> = Array.from({ length: 24 }, (_, hour) => 
      daysOfWeek.map((day) => {
        const activitiesCount = activities.filter((a) => {
          const activityDate = new Date(a.lastViewed);
          const dayOfWeek = activityDate.getDay();
          const activityHour = activityDate.getHours();
          return dayOfWeek === dayMap[day] && activityHour === hour;
        }).length;

        return {
          day: day,
          hour: hour,
          value: activitiesCount
        };
      })
    ).flat();

    // Calculate metrics
    const completionRate = Math.round((activities.length / enrollments.length) * 100) || 0;
    const averageEngagement = Math.round((activities.length / (enrollments.length || 1)) * 100);
    const totalCourses = enrollments.filter(e => e.course).length;

    const totalAssignments = assignments.length;
    const totalAssignmentScores = assignments.reduce((sum, a) => sum + (a.score || 0), 0);
    const averageAssignmentScore = totalAssignments > 0 ? totalAssignmentScores / totalAssignments : 0;

    // Format the response data
    const responseData: AnalyticsData = {
      timeSeries: timeSeriesData,
      heatmap: heatmapData,
      metrics: {
        totalStudents: enrollments.length,
        totalCourses,
        courseCompletion: completionRate,
        averageEngagement,
        assignmentsSubmitted: assignments.length,
        averageAssignmentScore
      }
    };

    // Cache the data if Redis is configured
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        await redis.set(cacheKey, JSON.stringify(responseData), { ex: CACHE_TTL });
      } catch (error) {
        console.error('Failed to cache data:', error);
      }
    } else {
      console.warn('Redis not configured, skipping cache');
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching instructor analytics data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics data';
    
    // Try to get cached data even if there was an error
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
