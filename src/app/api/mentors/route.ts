import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/mentors
 * Get a list of all available mentors
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const specialtyFilter = searchParams.get('specialty');
    const availableOnly = searchParams.get('available') === 'true';
    
    // Build the where clause for filtering
    const where: any = {};
    
    if (availableOnly) {
      where.isAvailable = true;
    }
    
    if (specialtyFilter) {
      // Use contains to search within the comma-separated specialties
      where.specialties = {
        contains: specialtyFilter,
      };
    }
    
    // Get mentors with their user information
    const mentors = await prisma.mentorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            role: true,
          }
        },
        _count: {
          select: {
            mentorships: true,
            careerPaths: true,
            reviews: true
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ]
    });
    
    // Transform the data to make it more frontend-friendly
    const formattedMentors = mentors.map(mentor => ({
      id: mentor.id,
      userId: mentor.userId,
      name: mentor.user.name,
      email: mentor.user.email,
      image: mentor.user.image,
      bio: mentor.user.bio || mentor.bio,
      role: mentor.user.role,
      specialties: mentor.specialties ? mentor.specialties.split(',').map(s => s.trim()) : [],
      yearsExperience: mentor.yearsExperience,
      availableHours: mentor.availableHours,
      rating: mentor.rating,
      reviewCount: mentor.reviewCount,
      isAvailable: mentor.isAvailable,
      stats: {
        menteeCount: mentor._count.mentorships,
        careerPathsCount: mentor._count.careerPaths,
        reviewCount: mentor._count.reviews
      },
      createdAt: mentor.createdAt,
    }));
    
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
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    
    const { 
      bio, 
      specialties, 
      yearsExperience, 
      availableHours,
      isAvailable 
    } = await req.json();
    
    // Format specialties as comma-separated string
    const formattedSpecialties = Array.isArray(specialties)
      ? specialties.join(', ')
      : specialties;
    
    // Check if mentor profile already exists
    const existingProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    });
    
    let mentorProfile;
    
    if (existingProfile) {
      // Update existing profile
      mentorProfile = await prisma.mentorProfile.update({
        where: { userId: session.user.id },
        data: {
          bio,
          specialties: formattedSpecialties,
          yearsExperience: yearsExperience || existingProfile.yearsExperience,
          availableHours: availableHours || existingProfile.availableHours,
          isAvailable: isAvailable !== undefined ? isAvailable : existingProfile.isAvailable,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new profile
      mentorProfile = await prisma.mentorProfile.create({
        data: {
          userId: session.user.id,
          bio,
          specialties: formattedSpecialties,
          yearsExperience: yearsExperience || 0,
          availableHours: availableHours || 5,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
        }
      });
    }
    
    return NextResponse.json(mentorProfile);
  } catch (error) {
    console.error('Error creating/updating mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to create/update mentor profile' },
      { status: 500 }
    );
  }
}
