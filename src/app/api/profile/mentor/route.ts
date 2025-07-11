import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// GET /api/profile/mentor - Fetch mentor profile data
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data including the mentor profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { mentorProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user has a mentor profile, if not create one
    if (!user.mentorProfile && user.role === 'MENTOR') {
      // Create a default mentor profile
      await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          bio: '',
          specialties: '',
          experience: '',
          availability: JSON.stringify([]),
          hourlyRate: null,
          isActive: true,
        },
      });
      
      // Fetch the user again with the new profile
      const updatedUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { mentorProfile: true },
      });
      
      return NextResponse.json({
        ...updatedUser,
        activeStudents: 0,
        totalSessions: 0,
        averageRating: 0,
      });
    }

    // Get mentor statistics
    // For now, we'll use placeholder data - in a real app, you'd fetch from the database
    const mentorshipStats = {
      activeStudents: 0,
      totalSessions: 0,
      averageRating: 0,
    };

    // Count active mentorships (active students)
    const activeMentorships = user.mentorProfile 
      ? await prisma.mentorship.count({
          where: {
            mentorId: user.mentorProfile.id,
            status: 'ACTIVE',
          },
        })
      : 0;

    // Count total sessions
    const totalSessions = user.mentorProfile
      ? await prisma.checkIn.count({
          where: {
            mentorship: {
              mentorId: user.mentorProfile.id,
            },
            completedAt: { not: null }, // Only count completed sessions
          },
        })
      : 0;

    // Get average rating
    const ratings = user.mentorProfile
      ? await prisma.mentorReview.findMany({
          where: {
            mentorId: user.mentorProfile.id,
          },
          select: {
            rating: true,
          },
        })
      : [];
    
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length
      : 0;

    return NextResponse.json({
      ...user,
      activeStudents: activeMentorships,
      totalSessions,
      averageRating,
    });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/mentor - Update mentor profile data
export async function PUT(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const data = await request.json();
    const { name, bio, location, mentorProfile } = data;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { mentorProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user's general information
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name || user.name,
        bio: bio !== undefined ? bio : user.bio,
        location: location !== undefined ? location : user.location,
      },
    });

    // Process mentor profile data
    if (mentorProfile) {
      const {
        specialties,
        experience,
        hourlyRate,
        isActive,
        availability,
      } = mentorProfile;

      // Check if the user has a mentor profile
      if (user.mentorProfile) {
        // Update existing mentor profile
        await prisma.mentorProfile.update({
          where: { userId: user.id },
          data: {
            bio: bio !== undefined ? bio : user.mentorProfile.bio,
            specialties: specialties !== undefined ? specialties : user.mentorProfile.specialties,
            experience: experience !== undefined ? experience : user.mentorProfile.experience,
            availability: availability !== undefined ? availability : user.mentorProfile.availability,
            hourlyRate: hourlyRate !== undefined ? (hourlyRate === null ? null : parseInt(hourlyRate.toString())) : user.mentorProfile.hourlyRate,
            isActive: isActive !== undefined ? isActive : user.mentorProfile.isActive,
          },
        });
      } else if (user.role === 'MENTOR') {
        // Create a new mentor profile if it doesn't exist
        await prisma.mentorProfile.create({
          data: {
            userId: user.id,
            bio: bio || '',
            specialties: specialties || '',
            experience: experience || '',
            availability: availability || JSON.stringify([]),
            hourlyRate: hourlyRate ? parseInt(hourlyRate.toString()) : null,
            isActive: isActive !== undefined ? isActive : true,
          },
        });
      }
    }

    // Fetch the updated user with profile
    const finalUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { mentorProfile: true },
    });

    // Get mentor statistics
    const activeMentorships = finalUser?.mentorProfile 
      ? await prisma.mentorship.count({
          where: {
            mentorId: finalUser.mentorProfile.id,
            status: 'ACTIVE',
          },
        })
      : 0;

    const totalSessions = finalUser?.mentorProfile
      ? await prisma.checkIn.count({
          where: {
            mentorship: {
              mentorId: finalUser.mentorProfile.id,
            },
            completedAt: { not: null },
          },
        })
      : 0;

    const ratings = finalUser?.mentorProfile
      ? await prisma.mentorReview.findMany({
          where: {
            mentorId: finalUser.mentorProfile.id,
          },
          select: {
            rating: true,
          },
        })
      : [];
    
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length
      : 0;

    return NextResponse.json({
      ...finalUser,
      activeStudents: activeMentorships,
      totalSessions,
      averageRating,
    });
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile data' },
      { status: 500 }
    );
  }
}
