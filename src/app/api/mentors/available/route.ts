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
            image: true,
            bio: true,
            role: true,
            level: true, // For experience level
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Sort by newest first
      },
    });
    
    // Format the response
    const formattedMentors = mentors.map((mentor) => {
      // Generate a random rating for demo purposes (in production, this would come from actual reviews)
      const rating = 4 + Math.random();
      const reviewCount = Math.floor(Math.random() * 100) + 10;
      
      // Parse specialties from string to array
      const specialtiesArray = mentor.specialties ? 
        mentor.specialties.split(',').map(s => s.trim()) : 
        ['Mentoring', 'Career Guidance'];
      
      // Calculate years of experience based on account creation date
      const accountCreationDate = mentor.user.createdAt;
      const currentDate = new Date();
      const yearsOfExperience = Math.max(1, Math.floor((currentDate.getTime() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));
      
      return {
        id: mentor.id,
        userId: mentor.user.id,
        name: mentor.user.name || 'Mentor',
        title: `${specialtiesArray[0]} Specialist`,
        avatarUrl: mentor.user.image,
        rating: parseFloat(rating.toFixed(1)),
        reviewCount: reviewCount,
        specialties: specialtiesArray,
        hourlyRate: mentor.hourlyRate || 50,
        availability: mentor.availability || 'Flexible schedule',
        description: mentor.user.bio || 'Experienced mentor ready to help you succeed.',
        isAvailableNow: Math.random() > 0.5, // Randomly set availability for demo
        yearsOfExperience: yearsOfExperience,
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
