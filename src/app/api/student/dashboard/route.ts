import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('No session found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!session.user) {
      console.log('No user data in session');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const userId = session.user.id as string;
    if (!userId) {
      console.log('Invalid user ID in session');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('Fetching dashboard data for user:', userId);

    // Get total study hours by counting study session activities
    const studySessions = await prisma.activityLog.count({
      where: {
        userId,
        type: 'STUDY_SESSION',
      },
    });

    // Each study session is considered 1 hour
    const totalStudyHours = studySessions;

    // Get total certificates
    const certificates = await prisma.certification.count({
      where: {
        userId,
      },
    });

    // Calculate streak
    const lastActivity = await prisma.activityLog.findFirst({
      where: {
        userId,
        type: 'STUDY_SESSION',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const currentStreak = lastActivity ? calculateStreak(lastActivity.createdAt) : 0;

    // Get active students
    const activeStudents = await prisma.activityLog.count({
      where: {
        userId: {
          not: userId, // Exclude current user
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    // Get recent courses that the student is enrolled in
    const recentCourses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            userId: userId
          }
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        userId
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get upcoming mentor sessions
    const upcomingSessions = await prisma.mentorSession.findMany({
      where: {
        menteeId: userId,
        scheduledAt: {
          gte: new Date()
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    const recentCoursesData = recentCourses.length > 0 ? recentCourses : null;

    return NextResponse.json({
      instructorName: session.user.name || 'Student',
      recentCourses: recentCoursesData,
      recentActivity,
      upcomingSessions,
      overallStats: {
        totalStudyHours: totalStudyHours,
        totalCertificates: certificates,
        currentStreak,
        activeStudents
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return a more specific error based on the type
    if (error instanceof Error && error.message.includes('permission denied')) {
      return NextResponse.json(
        { error: 'Database permission error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

function calculateStreak(lastActiveDate: Date): number {
  const today = new Date();
  const daysDiff = Math.floor(
    (today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysDiff <= 1 ? 1 : 0;
}
