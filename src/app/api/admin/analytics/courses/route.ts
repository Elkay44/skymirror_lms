import { NextRequest, NextResponse } from 'next/server';
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
    
    const { timeframe, compareWithPrevious } = analyticsQuerySchema.parse(searchParams);

    // Calculate date ranges based on timeframe
    const now = new Date();
    let startDate = new Date();
    let compareStartDate = new Date();
    let compareEndDate = new Date();

    switch (timeframe) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7);
        compareStartDate.setDate(now.getDate() - 14);
        compareEndDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        compareStartDate.setDate(now.getDate() - 60);
        compareEndDate.setDate(now.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(now.getDate() - 90);
        compareStartDate.setDate(now.getDate() - 180);
        compareEndDate.setDate(now.getDate() - 90);
        break;
      case 'allTime':
        startDate = new Date(2000, 0, 1); // Set to a very old date
        compareWithPrevious = false; // No comparison for all time
        break;
    }

    // Get current period metrics
    const [
      totalCourses,
      newCourses,
      publishedCourses,
      pendingApprovalCourses,
      totalEnrollments,
      newEnrollments,
      avgCompletionRate,
      avgRating,
      mostPopularCategories,
      statusDistribution
    ] = await Promise.all([
      // Total active courses
      prisma.course.count({
        where: {
          status: { not: 'ARCHIVED' },
        }
      }),
      
      // New courses created in the period
      prisma.course.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: now
          }
        }
      }),
      
      // Published courses
      prisma.course.count({
        where: {
          status: 'PUBLISHED',
          isPublished: true
        }
      }),
      
      // Courses pending approval
      prisma.course.count({
        where: {
          status: 'PENDING_APPROVAL'
        }
      }),
      
      // Total enrollments
      prisma.enrollment.count(),
      
      // New enrollments in the period
      prisma.enrollment.count({
        where: {
          enrolledAt: {
            gte: startDate,
            lte: now
          }
        }
      }),
      
      // Average completion rate
      prisma.enrollment.aggregate({
        where: {
          enrolledAt: { lte: now }
        },
        _avg: {
          completionPercentage: true
        }
      }).then(result => result._avg.completionPercentage || 0),
      
      // Average rating
      prisma.courseReview.aggregate({
        _avg: {
          rating: true
        }
      }).then(result => result._avg.rating || 0),
      
      // Most popular categories
      prisma.course.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      }).then(results => results.map(item => ({
        category: item.category,
        count: item._count.id
      }))),
      
      // Status distribution
      prisma.course.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }).then(results => {
        // Convert to an object for easier frontend consumption
        const distribution: Record<string, number> = {};
        results.forEach(item => {
          distribution[item.status] = item._count.id;
        });
        return distribution;
      })
    ]);

    // Get comparison data if requested
    let comparisonData = null;
    if (compareWithPrevious && timeframe !== 'allTime') {
      const [
        prevNewCourses,
        prevNewEnrollments,
        prevAvgCompletionRate,
        prevAvgRating
      ] = await Promise.all([
        // New courses in previous period
        prisma.course.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lte: compareEndDate
            }
          }
        }),
        
        // New enrollments in previous period
        prisma.enrollment.count({
          where: {
            enrolledAt: {
              gte: compareStartDate,
              lte: compareEndDate
            }
          }
        }),
        
        // Average completion rate in previous period
        prisma.enrollment.aggregate({
          where: {
            enrolledAt: { lte: compareEndDate }
          },
          _avg: {
            completionPercentage: true
          }
        }).then(result => result._avg.completionPercentage || 0),
        
        // Average rating in previous period
        prisma.courseReview.aggregate({
          where: {
            createdAt: {
              lte: compareEndDate
            }
          },
          _avg: {
            rating: true
          }
        }).then(result => result._avg.rating || 0)
      ]);

      comparisonData = {
        newCourses: {
          current: newCourses,
          previous: prevNewCourses,
          percentChange: prevNewCourses > 0
            ? ((newCourses - prevNewCourses) / prevNewCourses) * 100
            : null
        },
        newEnrollments: {
          current: newEnrollments,
          previous: prevNewEnrollments,
          percentChange: prevNewEnrollments > 0
            ? ((newEnrollments - prevNewEnrollments) / prevNewEnrollments) * 100
            : null
        },
        avgCompletionRate: {
          current: avgCompletionRate,
          previous: prevAvgCompletionRate,
          percentChange: prevAvgCompletionRate > 0
            ? ((avgCompletionRate - prevAvgCompletionRate) / prevAvgCompletionRate) * 100
            : null
        },
        avgRating: {
          current: avgRating,
          previous: prevAvgRating,
          percentChange: prevAvgRating > 0
            ? ((avgRating - prevAvgRating) / prevAvgRating) * 100
            : null
        }
      };
    }

    // Get recent activity for courses
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        resourceType: 'COURSE',
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Return the analytics data
    return NextResponse.json({
      timeframe,
      metrics: {
        totalCourses,
        newCourses,
        publishedCourses,
        pendingApprovalCourses,
        totalEnrollments,
        newEnrollments,
        avgCompletionRate,
        avgRating
      },
      insights: {
        mostPopularCategories,
        statusDistribution
      },
      comparison: comparisonData,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        resourceId: activity.resourceId,
        user: activity.user,
        timestamp: activity.createdAt,
        details: activity.details ? JSON.parse(activity.details) : null
      }))
    });
  } catch (error) {
    console.error('[ADMIN_ANALYTICS_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
