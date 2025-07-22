import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Response type for the frontend
type MentorResponse = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  role: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  stats: {
    mentorships: number;
    reviews: number;
  };
  createdAt: string;
};

/**
 * GET /api/mentors
 * Get a list of all available mentors with optional filtering
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const specialtyFilter = searchParams.get('specialty');
    const availableOnly = searchParams.get('available') === 'true';

    // Build the where clause for filtering
    const where: any = {};
    
    if (availableOnly) {
      where.availability = { not: null };
    }
    
    if (specialtyFilter) {
      where.bio = {
        contains: specialtyFilter,
        mode: 'insensitive'
      };
    }

    // Get all mentor profiles with their user data and session count
    const mentors = await prisma.mentorProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        bio: true,
        user: {
          select: {
            id: true,
            name: true,
            email: session.user.role === 'ADMIN',
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    // Get session counts for each mentor
    const mentorIds = mentors.map(mentor => mentor.id);
    const sessionCounts = await prisma.mentorSession.groupBy({
      by: ['mentorId'],
      where: {
        mentorId: { in: mentorIds }
      },
      _count: {
        id: true
      }
    });

    // Create a map of mentorId to session count
    const sessionCountMap = new Map(
      sessionCounts.map(item => [item.mentorId, item._count.id])
    );

    // Transform the data to match the MentorResponse type
    const formattedMentors: MentorResponse[] = mentors.map(mentor => {
      const sessionCount = sessionCountMap.get(mentor.id) || 0;
      
      return {
        id: mentor.id,
        userId: mentor.userId,
        name: mentor.user?.name || 'Mentor',
        email: session.user.role === 'ADMIN' ? mentor.user?.email || null : null,
        bio: mentor.bio,
        role: mentor.user?.role || 'MENTOR',
        rating: 0, // Default rating (can be calculated from reviews if needed)
        reviewCount: 0, // Default review count
        isAvailable: true, // Default availability
        stats: {
          mentorships: sessionCount,
          reviews: 0, // Default reviews count
        },
        createdAt: mentor.user?.createdAt.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json(formattedMentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentors' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentors
 * Create or update a mentor profile for the current user
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user role is appropriate for being a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only instructors and admins can be mentors' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Create or update the mentor profile
    const mentor = await prisma.mentorProfile.upsert({
      where: { userId: session.user.id },
      update: {
        bio: data.bio,
        // Add other fields as needed
      },
      create: {
        userId: session.user.id,
        bio: data.bio,
        // Add other fields as needed
      },
    });

    return NextResponse.json(mentor);
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    return handleError(error);
  }
}

function handleError(error: any) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Failed to update mentor profile' },
    { status: 500 }
  );
}
