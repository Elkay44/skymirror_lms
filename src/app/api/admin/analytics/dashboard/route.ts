/* eslint-disable */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Ensure the route is always dynamically rendered
export const dynamic = 'force-dynamic';

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalStudents: number;
  totalMentors: number;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
}

// GET /api/admin/analytics/dashboard - Get admin analytics dashboard data
export async function GET() {
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

    // Get user statistics
    const [
      totalUsers,
      totalAdmins,
      totalStudents,
      totalMentors,
      usersByRole
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total admins
      prisma.user.count({
        where: { role: 'ADMIN' }
      }),
      
      // Total students
      prisma.user.count({
        where: { role: 'STUDENT' }
      }),
      
      // Total mentors
      prisma.user.count({
        where: { role: 'MENTOR' }
      }),
      
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
      })
    ]);

    // Prepare response data
    const responseData: DashboardStats = {
      totalUsers,
      totalAdmins,
      totalStudents,
      totalMentors,
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.role
      }))
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}
