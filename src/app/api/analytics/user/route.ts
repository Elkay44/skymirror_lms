/* eslint-disable */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/analytics/user - Get user analytics
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

    // Get user with profile and achievements
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: true,
        mentorProfile: true,
        userAchievements: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate basic analytics
    const achievements = user.userAchievements.map(ua => ({
      id: ua.id,
      title: ua.achievement.title,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      category: ua.achievement.category,
      earnedAt: ua.earnedAt.toISOString(),
      metadata: ua.metadata || {}
    }));

    const categories = [...new Set(achievements.map(a => a.category))];
    const achievementCount = achievements.length;
    const points = user.points || 0;
    const level = user.level || 1;

    // In a real implementation, you would calculate these based on actual data
    const learningProgress = 0;
    const completedCourses = 0;
    const enrolledCourses = 0;
    const timeSpent = 0; // in minutes
    const lastActive = user.updatedAt.toISOString();

    // Prepare response data
    const analytics = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinDate: user.createdAt.toISOString(),
        lastActive,
        profile: user.studentProfile || user.mentorProfile || {}
      },
      overview: {
        points,
        level,
        achievementCount,
        achievements,
        categories,
        learningProgress,
        completedCourses,
        enrolledCourses,
        timeSpent,
      },
      // In a real implementation, these would be populated with actual data
      activity: [],
      progress: [],
      recommendations: []
    };
    
    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/analytics/user - Get filtered user analytics
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body for filters
    const { startDate, endDate, category } = await req.json();

    // Get user with achievements
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        level: true,
        userAchievements: {
          include: {
            achievement: true
          },
          where: category ? {
            achievement: {
              category: category
            }
          } : {}
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Filter achievements by date range if provided
    let filteredAchievements = user.userAchievements;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      
      filteredAchievements = filteredAchievements.filter(ua => {
        const earnedAt = new Date(ua.earnedAt);
        return earnedAt >= start && earnedAt <= end;
      });
    }

    // Prepare response data
    const analytics = {
      filters: {
        startDate,
        endDate,
        category
      },
      achievements: filteredAchievements.map(ua => ({
        id: ua.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        category: ua.achievement.category,
        earnedAt: ua.earnedAt.toISOString(),
        metadata: ua.metadata || {}
      })),
      stats: {
        totalAchievements: filteredAchievements.length,
        points: user.points || 0,
        level: user.level || 1,
        // In a real implementation, you would calculate these based on actual data
        categories: [...new Set(filteredAchievements.map(a => a.achievement.category))],
        // Add more stats as needed
      }
    };
    
    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching filtered user analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch filtered user analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
