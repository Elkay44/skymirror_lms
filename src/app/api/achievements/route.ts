/* eslint-disable */
import { NextResponse } from 'next/server';
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
  xpEarned?: number;
  skillLevel?: string;
  courseId?: string;
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

type Achievement = FinancialAchievement | LearningAchievement | CommunityAchievement | CareerAchievement;

// Helper function to map database achievements to the Achievement interface
function mapDatabaseAchievement(dbAchievement: any): Achievement {
  const baseAchievement = {
    id: dbAchievement.achievement.id,
    type: dbAchievement.achievement.type,
    title: dbAchievement.achievement.title,
    description: dbAchievement.achievement.description,
    icon: dbAchievement.achievement.icon || undefined,
    earnedAt: dbAchievement.earnedAt,
    category: dbAchievement.achievement.category as AchievementCategory,
  };

  // Add category-specific fields
  const metadata = dbAchievement.metadata || {};
  
  switch (dbAchievement.achievement.category) {
    case 'financial':
      return {
        ...baseAchievement,
        amount: dbAchievement.achievement.amount || undefined,
        currency: dbAchievement.achievement.currency || undefined,
        validUntil: dbAchievement.achievement.validUntil || undefined,
        discountPercent: dbAchievement.achievement.discountPercent || undefined,
        ...metadata
      };
    case 'learning':
      return {
        ...baseAchievement,
        xpEarned: metadata.xpEarned,
        skillLevel: metadata.skillLevel,
        courseId: metadata.courseId
      };
    case 'community':
      return {
        ...baseAchievement,
        studentsHelped: metadata.studentsHelped,
        averageRating: metadata.averageRating,
        helpfulAnswers: metadata.helpfulAnswers
      };
    case 'career':
      return {
        ...baseAchievement,
        issuer: dbAchievement.achievement.issuer || undefined,
        company: dbAchievement.achievement.company || undefined,
        position: dbAchievement.achievement.position || undefined,
        ...metadata
      };
    default:
      return baseAchievement;
  }
}

// GET endpoint to fetch achievements for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as AchievementCategory | null;
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build the where clause
    const where: any = {
      userId: session.user.id,
      achievement: {}
    };

    if (category) {
      where.achievement.category = category;
    }

    if (type) {
      where.achievement.type = type;
    }

    // Fetch user's achievements with pagination
    const userAchievements = await prisma.userAchievement.findMany({
      where,
      include: {
        achievement: true
      },
      orderBy: {
        earnedAt: 'desc'
      },
      take: limit,
      skip: skip
    });

    // Map to the Achievement interface
    const achievements: Achievement[] = userAchievements.map(mapDatabaseAchievement);

    // Get total count for pagination
    const total = await prisma.userAchievement.count({
      where
    });

    return NextResponse.json({
      data: achievements,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST endpoint to track a new achievement
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      type, 
      title, 
      description, 
      icon, 
      category, 
      metadata = {}
    } = body;

    // Validate required fields
    if (!type || !title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if achievement type exists, if not create it
    let achievement = await prisma.achievement.findFirst({
      where: { type }
    });

    if (!achievement) {
      // Create the achievement if it doesn't exist
      achievement = await prisma.achievement.create({
        data: {
          type,
          title,
          description,
          icon,
          category,
          // Include category-specific fields if provided
          ...(category === 'financial' && {
            amount: metadata.amount,
            currency: metadata.currency,
            validUntil: metadata.validUntil ? new Date(metadata.validUntil) : undefined,
            discountPercent: metadata.discountPercent
          }),
          ...(category === 'career' && {
            issuer: metadata.issuer,
            company: metadata.company,
            position: metadata.position
          })
        }
      });
    }

    // Check if user already has this achievement
    const existingUserAchievement = await prisma.userAchievement.findFirst({
      where: {
        userId: session.user.id,
        achievementId: achievement.id
      }
    });

    if (existingUserAchievement) {
      return NextResponse.json(
        { 
          error: 'User already has this achievement',
          achievement: mapDatabaseAchievement(existingUserAchievement)
        },
        { status: 400 }
      );
    }

    // Award the achievement to the user
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId: session.user.id,
        achievementId: achievement.id,
        metadata: metadata
      },
      include: {
        achievement: true
      }
    });

    // Update user points if applicable
    if (category === 'learning' && metadata.xpEarned) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: { increment: metadata.xpEarned }
        }
      });
    }

    return NextResponse.json({
      success: true,
      achievement: mapDatabaseAchievement(userAchievement)
    });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    );
  }
}
