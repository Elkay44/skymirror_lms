import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

type UserWithMentorProfile = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  mentorProfile: {
    id: string;
    bio: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

// GET /api/profile/mentor - Fetch mentor profile data
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user with their mentor profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { mentorProfile: true },
    }) as unknown as UserWithMentorProfile | null;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user is not a mentor, return an empty profile
    if (user.role !== 'MENTOR') {
      return NextResponse.json({
        ...user,
        mentorProfile: null,
      });
    }

    // Check if the user has a mentor profile, if not create one
    if (!user.mentorProfile) {
      // Create a default mentor profile with only the fields defined in the schema
      await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          bio: '',
        },
      });
      
      // Fetch the user again with the new profile
      const updatedUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { mentorProfile: true },
      }) as unknown as UserWithMentorProfile | null;
      
      if (!updatedUser) {
        return NextResponse.json({ error: 'Failed to create mentor profile' }, { status: 500 });
      }
      
      return NextResponse.json({
        ...updatedUser,
        mentorProfile: updatedUser.mentorProfile,
      });
    }

    // Get mentor statistics (simplified version without the extended models)
    const [menteesCount, sessionsCount, averageRating] = await Promise.all([
      // Count unique mentees
      prisma.user.count({
        where: {
          role: 'STUDENT',
        },
      }),
      // Count sessions (using a placeholder since we don't have the session model)
      Promise.resolve(0),
      // Calculate average rating (using a placeholder)
      Promise.resolve(0),
    ]);

    // Return the user data with mentor profile and statistics
    return NextResponse.json({
      ...user,
      mentorProfile: user.mentorProfile,
      statistics: {
        menteesCount,
        sessionsCount,
        averageRating,
      },
    });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor profile' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/mentor - Update mentor profile data
export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const data = await request.json();
    const { 
      name, 
      bio, 
      location,
      mentorProfile,
    } = data;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { mentorProfile: true },
    }) as unknown as UserWithMentorProfile | null;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user profile
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;

    // Update user data if there are fields to update
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: updateData,
      });
    }

    // Update or create mentor profile
    if (bio !== undefined || mentorProfile) {
      const mentorProfileData: any = {};
      
      if (bio !== undefined) mentorProfileData.bio = bio;
      if (mentorProfile) {
        if (mentorProfile.specialties !== undefined) mentorProfileData.specialties = mentorProfile.specialties;
        if (mentorProfile.yearsOfExperience !== undefined) mentorProfileData.yearsOfExperience = mentorProfile.yearsOfExperience;
        if (mentorProfile.mentorshipPhilosophy !== undefined) mentorProfileData.mentorshipPhilosophy = mentorProfile.mentorshipPhilosophy;
        if (mentorProfile.credentials !== undefined) mentorProfileData.credentials = mentorProfile.credentials;
        if (mentorProfile.hourlyRate !== undefined) mentorProfileData.hourlyRate = mentorProfile.hourlyRate;
        if (mentorProfile.availabilityPreference !== undefined) mentorProfileData.availabilityPreference = mentorProfile.availabilityPreference;
        if (mentorProfile.sessionDuration !== undefined) mentorProfileData.sessionDuration = mentorProfile.sessionDuration;
      }
      
      if (Object.keys(mentorProfileData).length > 0) {
        if (user.mentorProfile) {
          await prisma.mentorProfile.update({
            where: { userId: user.id },
            data: mentorProfileData,
          });
        } else if (user.role === 'MENTOR') {
          await prisma.mentorProfile.create({
            data: {
              userId: user.id,
              ...mentorProfileData,
            },
          });
        }
      }
    }

    // Fetch the updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { mentorProfile: true },
    }) as unknown as UserWithMentorProfile | null;

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to fetch updated profile' },
        { status: 500 }
      );
    }

    // Simplified statistics since we don't have all the models
    const statistics = {
      menteesCount: 0,
      sessionsCount: 0,
      averageRating: 0,
    };

    return NextResponse.json({
      ...updatedUser,
      statistics,
    });
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile data' },
      { status: 500 }
    );
  }
}
