import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Achievement data types
type AchievementCategory = 'learning' | 'financial' | 'community' | 'career';

interface BaseAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon?: string;
  earnedAt?: Date;
  category: AchievementCategory;
}

interface FinancialAchievement extends BaseAchievement {
  category: 'financial';
  amount?: number;
  currency?: string;
  validUntil?: Date;
  discountPercent?: number;
  applicableCourses?: string[];
  referralCount?: number;
}

interface LearningAchievement extends BaseAchievement {
  category: 'learning';
}

interface CommunityAchievement extends BaseAchievement {
  category: 'community';
  studentsHelped?: number;
  averageRating?: number;
  helpfulAnswers?: number;
}

interface CareerAchievement extends BaseAchievement {
  category: 'career';
  issuer?: string;
  company?: string;
  position?: string;
}

type Achievement = LearningAchievement | FinancialAchievement | CommunityAchievement | CareerAchievement;

// Helper function to map database achievements to the Achievement interface
const mapDatabaseAchievement = (dbAchievement: any): Achievement => {
  const baseAchievement = {
    id: dbAchievement.id,
    type: dbAchievement.type,
    title: dbAchievement.title,
    description: dbAchievement.description,
    icon: dbAchievement.icon || undefined,
    earnedAt: dbAchievement.earnedAt,
    category: dbAchievement.category as AchievementCategory
  };

  // Add category-specific properties
  switch (dbAchievement.category) {
    case 'financial':
      return {
        ...baseAchievement,
        category: 'financial',
        amount: dbAchievement.amount,
        currency: dbAchievement.currency,
        validUntil: dbAchievement.validUntil,
        discountPercent: dbAchievement.discountPercent,
        applicableCourses: dbAchievement.applicableCourses,
        referralCount: dbAchievement.referralCount
      };
    case 'community':
      return {
        ...baseAchievement,
        category: 'community',
        studentsHelped: dbAchievement.studentsHelped,
        averageRating: dbAchievement.averageRating,
        helpfulAnswers: dbAchievement.helpfulAnswers
      };
    case 'career':
      return {
        ...baseAchievement,
        category: 'career',
        issuer: dbAchievement.issuer,
        company: dbAchievement.company,
        position: dbAchievement.position
      };
    default:
      return {
        ...baseAchievement,
        category: 'learning'
      };
  }
};

// GET endpoint to fetch achievements for the current user
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Fetch achievements from the database
    const dbAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true }
    });
    
    // Map database achievements to the Achievement interface
    const achievements = dbAchievements.map((ua: { achievement: any, earnedAt: Date }) => 
      mapDatabaseAchievement({
        ...ua.achievement,
        earnedAt: ua.earnedAt
      })
    );
    
    // Fetch user progress
    const userStats = await prisma.userStats.findUnique({
      where: { userId: user.id }
    });
    
    const progress = userStats ? {
      level: userStats.level,
      currentXP: userStats.currentXP,
      nextLevelXP: userStats.nextLevelXP,
      totalScholarshipAmount: userStats.totalScholarshipAmount,
      activeDiscounts: userStats.activeDiscounts,
      completedCourses: userStats.completedCourses,
      forumContributions: userStats.forumContributions,
      mentorshipHours: userStats.mentorshipHours
    } : {
      level: 1,
      currentXP: 0,
      nextLevelXP: 100,
      totalScholarshipAmount: 0,
      activeDiscounts: 0,
      completedCourses: 0,
      forumContributions: 0,
      mentorshipHours: 0
    };
    
    return NextResponse.json({
      achievements,
      progress
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to track a new achievement
export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Parse request body
    const { achievementId } = await request.json();
    
    if (!achievementId) {
      return NextResponse.json({ message: 'Achievement ID is required' }, { status: 400 });
    }
    
    // Check if achievement exists
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    });
    
    if (!achievement) {
      return NextResponse.json({ message: 'Achievement not found' }, { status: 404 });
    }
    
    // Check if user already has this achievement
    const existingUserAchievement = await prisma.userAchievement.findFirst({
      where: {
        userId: user.id,
        achievementId
      }
    });
    
    if (existingUserAchievement) {
      return NextResponse.json({ 
        message: 'User already has this achievement',
        success: false
      });
    }
    
    // Create user achievement record
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId: user.id,
        achievementId,
        earnedAt: new Date()
      },
      include: {
        achievement: true
      }
    });
    
    // Create a notification for the achievement
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'New Achievement Earned!',
        message: `Congratulations! You've earned the ${achievement.title} achievement.`,
        type: 'ACHIEVEMENT',
        isRead: false,
        linkUrl: '/dashboard/achievements'
      }
    });
    
    return NextResponse.json({
      message: 'Achievement tracked successfully',
      achievement: mapDatabaseAchievement({
        ...userAchievement.achievement,
        earnedAt: userAchievement.earnedAt
      }),
      success: true
    });
  } catch (error) {
    console.error('Error tracking achievement:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
