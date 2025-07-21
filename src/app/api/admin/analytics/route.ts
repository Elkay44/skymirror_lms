/* eslint-disable */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Ensure the route is always dynamically rendered
export const dynamic = 'force-dynamic';

interface AnalyticsData {
  users: {
    total: number;
    byRole: Array<{
      role: string;
      count: number;
    }>;
  };
  achievements: {
    total: number;
    byType: Array<{
      type: string;
      count: number;
    }>;
  };
}

// GET /api/admin/analytics - Get basic analytics data for admin dashboard
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify admin role
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

    // Get user statistics
    const [
      totalUsers,
      usersByRole,
      totalAchievements,
      achievementsByType
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        },
        orderBy: {
          _count: {
            role: 'desc'
          }
        }
      }),
      
      // Total achievements
      prisma.achievement.count(),
      
      // Achievements by type
      prisma.achievement.groupBy({
        by: ['type'],
        _count: {
          type: true
        },
        orderBy: {
          _count: {
            type: 'desc'
          }
        }
      })
    ]);

    // Prepare response data
    const responseData: AnalyticsData = {
      users: {
        total: totalUsers,
        byRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count.role
        }))
      },
      achievements: {
        total: totalAchievements,
        byType: achievementsByType.map(item => ({
          type: item.type,
          count: item._count.type
        }))
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
