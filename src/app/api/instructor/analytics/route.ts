import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format, subDays, subMonths } from 'date-fns';
import redis from '@/lib/redis';

// Cache configuration
const CACHE_TTL = 60 * 60; // 1 hour cache
const CACHE_KEY_PREFIX = 'analytics:instructor:';


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
    courses: any[];
  };
}

// GET /api/instructor/analytics - Get instructor analytics data
export async function GET(request: Request) {
  let cachedData: string | null = null;
  console.log('Analytics API called');
  
  try {
    // Get the user session to check if they're authenticated
    const session = await getServerSession(authOptions);
    
    // Log request headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Request headers:', JSON.stringify(headers, null, 2));
    
    console.log('Session data:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      sessionKeys: session ? Object.keys(session) : []
    });
    
    if (!session?.user) {
      console.error('No valid session found');
      return NextResponse.json(
        { 
          error: 'Authentication required',
          details: 'No valid session found',
          timestamp: new Date().toISOString()
        },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user has instructor or admin role
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      console.error('Unauthorized access attempt:', {
        userId: session.user.id,
        userRole: session.user.role
      });
      return NextResponse.json(
        { 
          error: 'Access denied',
          details: 'You do not have permission to access this resource',
          requiredRole: 'INSTRUCTOR or ADMIN',
          yourRole: session.user.role
        },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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
      if (redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
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
    const thirtyDaysAgo = subDays(today, 30);
    const threeMonthsAgo = subMonths(today, 3);

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

    console.log('Fetching instructor courses for user:', userId);
    
    // Get all instructor's courses with detailed stats
    const instructorCourses = await prisma.course.findMany({
      where: { 
        instructorId: session.user.id,
        isPublished: true
      },
      include: {
        _count: {
          select: {
            enrollments: { 
              where: { 
                enrolledAt: { gte: threeMonthsAgo },
                status: 'ACTIVE'
              } 
            },
            modules: true
          }
        },
        modules: {
          include: {
            _count: { 
              select: { 
                lessons: true,
                assignments: true
              } 
            },
            assignments: {
              include: {
                _count: {
                  select: {
                    submissions: {
                      where: {
                        status: 'SUBMITTED',
                        submittedAt: { gte: thirtyDaysAgo }
                      }
                    }
                  }
                },
                submissions: {
                  where: { 
                    submittedAt: { gte: thirtyDaysAgo },
                    status: 'SUBMITTED'
                  },
                  select: {
                    id: true,
                    grade: true,  // Changed from score to grade
                    status: true,
                    submittedAt: true
                  }
                }
              }
            },
            lessons: {
              include: {
                _count: {
                  select: {
                    activityLogs: true,
                    views: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${instructorCourses.length} published courses`);

    // Define types for the course data structure
    type ModuleType = {
      _count: {
        lessons: number;
        assignments: number;
      };
      assignments: Array<{
        _count: {
          submissions: number;
        };
        submissions: Array<{
          id: string;
          grade: number | null;
          status: string;
          submittedAt: Date | null;
        }>;
      }>;
      lessons: Array<{
        _count: {
          activityLogs: number;
          views: number;
        };
      }>;
    };

    type CourseType = {
      id: string;
      title: string;
      _count: {
        enrollments: number;
        modules: number;
      };
      modules: ModuleType[];
      updatedAt: Date;
    };

    // Transform course data for the frontend
    const coursesWithStats = instructorCourses.map((course: CourseType) => {
      console.log(`Processing course: ${course.title} (${course.id})`);
      
      // Process the course data
      const totalLessons = course.modules.reduce(
        (sum: number, module) => sum + (module._count?.lessons || 0),
        0
      );
      
      const viewedLessons = course.modules.reduce(
        (sum: number, module) => {
          if (!module.lessons) return sum;
          return sum + module.lessons.reduce(
            (lessonSum: number, lesson) => lessonSum + ((lesson._count?.views || 0) > 0 ? 1 : 0),
            0
          );
        },
        0
      );

      const totalAssignments = course.modules.reduce(
        (sum: number, module) => sum + (module._count?.assignments || 0),
        0
      );

      const submittedAssignments = course.modules.reduce(
        (assignmentSum: number, module) => {
          if (!module.assignments) return assignmentSum;
          return assignmentSum + module.assignments.reduce(
            (sum: number, assignment) => sum + (assignment._count?.submissions || 0),
            0
          );
        },
        0
      );

      const assignmentScores = course.modules.flatMap(module => 
        (module.assignments || []).flatMap(assignment => 
          (assignment.submissions || [])
            .filter((sub: { grade: number | null }) => sub.grade !== null)
            .map((sub: { grade: number | null }) => sub.grade as number)
        )
      );
      
      const averageScore = assignmentScores.length > 0 
        ? assignmentScores.reduce((a: number, b: number) => a + b, 0) / assignmentScores.length 
        : 0;

      return {
        id: course.id,
        title: course.title,
        completionRate: totalLessons > 0 
          ? Math.round((viewedLessons / totalLessons) * 100) 
          : 0,
        enrollmentCount: course._count?.enrollments || 0,
        assignmentCount: totalAssignments,
        submittedAssignments,
        lastUpdated: course.updatedAt.toISOString(),
        averageScore: Math.round(averageScore),
        modulesCount: course._count?.modules || 0,
        totalLessons
      };
    });

    // Get assignment submissions for the time series data
    const assignments = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          module: {
            courseId: {
              in: instructorCourses.map((course: { id: string }) => course.id)
            }
          }
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

    // Calculate metrics
    const totalStudents = new Set(enrollments.map(e => e.userId)).size;
    const totalAssignments = assignments.length;
    const totalEngagement = activities.length;
    
    // Calculate overall completion rate
    const totalPossibleEngagement = instructorCourses.reduce((sum: number, course) => {
      const courseStudents = new Set(
        enrollments
          .filter((e: { courseId: string }) => e.courseId === course.id)
          .map((e: { userId: string }) => e.userId)
      ).size;
      const courseLessons = course.modules.reduce(
        (moduleSum: number, module: { _count: { lessons: number } }) => 
          moduleSum + module._count.lessons, 0
      );
      return sum + (courseStudents * courseLessons);
    }, 0);
    
    const completionRate = totalPossibleEngagement > 0
      ? Math.min(Math.round((totalEngagement / totalPossibleEngagement) * 100), 100)
      : 0;

    // Generate time series data (last 30 days)
    const timeSeries = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, 29 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dailyEnrollments = enrollments.filter(
        e => format(new Date(e.enrolledAt), 'yyyy-MM-dd') === dateStr
      ).length;
      
      const dailyActivities = activities.filter(
        a => format(new Date(a.lastViewed), 'yyyy-MM-dd') === dateStr
      ).length;
      
      const dailyAssignments = assignments.filter(
        a => format(new Date(a.submittedAt), 'yyyy-MM-dd') === dateStr
      ).length;
      
      return {
        date: dateStr,
        students: dailyEnrollments,
        completion: Math.min(Math.round((dailyActivities / 10) * 100), 100),
        engagement: dailyActivities,
        assignments: dailyAssignments,
        courses: 0 // Not used in current implementation
      };
    });

    // Generate heatmap data (based on activity hours)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap = days.flatMap((day, dayIndex) => 
      Array.from({ length: 24 }, (_, hour) => ({
        day,
        hour,
        value: activities.filter(a => {
          const activityDate = new Date(a.lastViewed);
          return activityDate.getDay() === dayIndex && 
                 activityDate.getHours() === hour;
        }).length
      }))
    );

    // Calculate average assignment score across all courses
    const allScores = coursesWithStats.flatMap(course => 
      course.averageScore ? [course.averageScore] : []
    );
    const averageAssignmentScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    // Prepare response data
    const analyticsData: AnalyticsData = {
      timeSeries,
      heatmap,
      metrics: {
        totalStudents,
        totalCourses: coursesWithStats.length,
        courseCompletion: completionRate,
        averageEngagement: Math.min(Math.round((totalEngagement / (totalStudents || 1)) * 10), 100),
        assignmentsSubmitted: totalAssignments,
        averageAssignmentScore,
        courses: coursesWithStats
      }
    };

    // Cache the response if Redis is configured
    if (redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(analyticsData));
        console.log('Analytics data cached successfully');
      } catch (error) {
        console.error('Failed to cache analytics data:', error);
      }
    }

    console.log('Returning analytics data');
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error in instructor analytics API:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString(),
      path: '/api/instructor/analytics'
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
