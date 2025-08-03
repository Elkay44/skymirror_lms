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
  _request: Request,
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
    
    // Get mentor with basic user information
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
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

    // Get additional mentor data using raw SQL to avoid type issues
    const [avgRating, availability] = await Promise.all([
      // Get average rating
      prisma.$queryRaw`
        SELECT AVG(rating) as average_rating
        FROM "MentorReview"
        WHERE "mentorId" = ${mentorId} AND status = 'PUBLISHED'
      ` as Promise<{ average_rating: number | null }[]>,
      
      // Get availability
      prisma.$queryRaw`
        SELECT *
        FROM "MentorAvailability"
        WHERE "mentorId" = ${mentorId}
        ORDER BY "dayOfWeek" ASC, "startTime" ASC
      ` as Promise<Array<{
        id: string;
        mentorId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        createdAt: Date;
        updatedAt: Date;
      }>>
    ]);

    // Format the response
    const response = {
      ...mentor,
      rating: avgRating[0]?.average_rating ? Number(avgRating[0].average_rating) : 0,
      availability: availability || [],
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
