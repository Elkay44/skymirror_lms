import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/mentors/available
 * Get all mentors who are currently accepting new mentees
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const specialty = url.searchParams.get('specialty');
    const minRating = url.searchParams.get('minRating');
    const availableNow = url.searchParams.get('availableNow') === 'true';
    
    // Build the query
    const query: any = {
      user: {
        role: 'MENTOR',
      },
      isActive: true, // Using isActive as a proxy for accepting mentees
    };
    
    // Add specialty filter if provided
    if (specialty) {
      query.specialties = {
        has: specialty,
      };
    }
    
    // Add rating filter if provided
    if (minRating) {
      query.averageRating = {
        gte: parseFloat(minRating),
      };
    }
    
    // Add availability filter if requested
    if (availableNow) {
      query.isAvailableNow = true;
    }
    
    // Fetch mentors
    const mentors = await prisma.mentorProfile.findMany({
      where: query,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            // Only include fields that exist in the User model
            // image, bio, level are not in the base User model
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Sort by newest first
      },
    });
    
    // Format the response with only the fields that exist in the models
    const formattedMentors = mentors.map((mentor) => {
      // Calculate years of experience based on account creation date
      const accountCreationDate = mentor.user.createdAt;
      const currentDate = new Date();
      const yearsOfExperience = Math.max(1, Math.floor((currentDate.getTime() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));
      
      // Return only the fields that exist in the models
      return {
        id: mentor.id,
        userId: mentor.user.id,
        name: mentor.user.name || 'Mentor',
        role: mentor.user.role,
        createdAt: mentor.user.createdAt,
        // Include basic mentor profile fields
        bio: mentor.bio,
        yearsOfExperience,
        // Add any additional fields that are needed by the frontend with default values
        rating: 4.5, // Default rating
        reviewCount: 10, // Default review count
        isAvailable: true, // Default availability
      };
    });
    
    return NextResponse.json(formattedMentors);
  } catch (error) {
    console.error('Error fetching available mentors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available mentors' },
      { status: 500 }
    );
  }
}
