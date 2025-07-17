import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MentorProfile, Prisma } from '@prisma/client';

// Types for the mentor data
interface MentorUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  role: string;
}

interface MentorCounts {
  mentorships: number;
  careerPaths: number;
  reviews: number;
}

interface MentorProfileWithCounts extends MentorProfile {
  user: MentorUser | null;
  _count: MentorCounts;
  // Add missing properties from MentorProfile
  id: string;
  userId: number;
  bio: string | null;
  specialties: string | null;
  experience: string | null;
  availability: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Response type for the frontend
interface MentorResponse {
  id: string;
  userId: number;
  name: string;
  email?: string;
  image: string | null;
  bio: string | null;
  role: string;
  specialties: string[];
  experience: string | null;
  availability: string | null;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  stats: {
    menteeCount: number;
    careerPathsCount: number;
    reviewCount: number;
  };
  createdAt: string;
}

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
      where: {
        isActive: true, // Only show active mentors
        ...(specialtyFilter && {
          specialties: {
            contains: specialtyFilter
          }
        }),
        ...(availableOnly && {
          availability: {
            not: null
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: session?.user?.role === 'ADMIN',
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
        { userId: 'desc' } // Default ordering by user ID
      ]
    }) as unknown as MentorProfileWithCounts[];
    
    // Transform the data to make it more frontend-friendly
    const formattedMentors: MentorResponse[] = mentors.map(mentor => {
      const mentorUser = mentor.user || {} as MentorUser;
      const counts = mentor._count || {} as MentorCounts;
      
      // Calculate review count safely
      const reviewCount = Number(counts.reviews || 0);
      
      return {
        id: mentor.id,
        userId: mentor.userId,
        name: mentorUser.name || 'Mentor',
        email: session?.user?.role === 'ADMIN' ? mentorUser.email || undefined : undefined,
        image: mentorUser.image,
        bio: mentor.bio || mentorUser.bio || '',
        role: mentorUser.role || 'MENTOR',
        specialties: mentor.specialties ? 
          mentor.specialties.split(',').map(s => s.trim()).filter(Boolean) : 
          [],
        experience: mentor.experience || null,
        availability: mentor.availability,
        rating: 0, // Default rating (can be calculated from reviews if needed)
        reviewCount,
        isActive: mentor.isActive,
        stats: {
          menteeCount: Number(counts.mentorships || 0),
          careerPathsCount: Number(counts.careerPaths || 0),
          reviewCount
        },
        createdAt: mentor.createdAt.toISOString()
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
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user role is appropriate for being a mentor
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
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
      experience,
      availability,
      isActive
    } = await req.json();
    
    // Format specialties as comma-separated string if it's an array
    const formattedSpecialties = Array.isArray(specialties)
      ? specialties.join(',')
      : specialties;
    
    // Check if mentor profile already exists
    const existingProfile = await prisma.mentorProfile.findUnique({
      where: { userId: Number(session.user.id) }
    });
    
    let mentorProfile;
    
    if (existingProfile) {
      // Update existing profile
      const updateData: Prisma.MentorProfileUpdateInput = {
        bio: bio ?? existingProfile.bio,
        specialties: formattedSpecialties ?? existingProfile.specialties,
        experience: experience ?? existingProfile.experience,
        availability: availability ?? existingProfile.availability,
        isActive: isActive ?? existingProfile.isActive,
        updatedAt: new Date(),
      };
      
      mentorProfile = await prisma.mentorProfile.update({
        where: { userId: Number(session.user.id) },
        data: updateData
      });
    } else {
      // Create new profile
      const createData: Prisma.MentorProfileCreateInput = {
        user: { connect: { id: Number(session.user.id) } },
        bio: bio ?? null,
        specialties: formattedSpecialties || null,
        experience: experience ?? null,
        availability: availability ?? null,
        isActive: isActive ?? true,
      };
      
      mentorProfile = await prisma.mentorProfile.create({
        data: createData
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
