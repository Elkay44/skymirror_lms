/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/mentors/[id]
 * Get details of a specific mentor
 */
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { id: mentorId } = await params;
    
    // Get mentor with user information, active mentorships, and reviews
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            location: true,
            timezone: true,
            website: true,
            socialLinks: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        skills: {
          select: {
            id: true,
            name: true,
            level: true,
            yearsOfExperience: true,
          },
        },
        experiences: {
          where: {
            current: false,
          },
          orderBy: {
            endDate: 'desc',
          },
          take: 3,
        },
        education: {
          orderBy: {
            endYear: 'desc',
          },
          take: 2,
        },
        reviews: {
          where: {
            status: 'PUBLISHED',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            mentorships: {
              where: {
                status: 'ACTIVE',
              },
            },
            reviews: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found' }, 
        { status: 404 }
      );
    }

    // Calculate average rating
    const avgRating = await prisma.mentorReview.aggregate({
      where: {
        mentorId,
        status: 'PUBLISHED',
      },
      _avg: {
        rating: true,
      },
    });

    // Get mentor's availability
    const availability = await prisma.mentorAvailability.findMany({
      where: {
        mentorId,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Format the response
    const response = {
      ...mentor,
      rating: avgRating._avg.rating || 0,
      availability,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor details' },
      { status: 500 }
    );
  }
}
