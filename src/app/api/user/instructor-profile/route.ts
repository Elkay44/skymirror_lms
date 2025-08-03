import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user is an instructor
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Only instructors can update instructor profiles' }, { status: 403 });
    }
    
    // Get profile data from request body
    const data = await req.json();
    const { 
      expertise: _expertise, 
      yearsOfExperience: _yearsOfExperience, 
      education: _education, 
      teachingPhilosophy: _teachingPhilosophy,
      bio
    } = data;
    
    // Check if mentor profile exists
    const existingProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id }
    });

    // Update or create mentor profile
    const updatedProfile = await (existingProfile
      ? prisma.mentorProfile.update({
          where: { id: existingProfile.id },
          data: {
            bio,
            // Add any additional fields that exist in your MentorProfile model
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      : prisma.mentorProfile.create({
          data: {
            userId: user.id,
            bio,
            // Add any additional fields that exist in your MentorProfile model
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }));

    // Prepare response data
    const responseData = {
      id: updatedProfile.user.id,
      name: updatedProfile.user.name,
      email: updatedProfile.user.email,
      bio: updatedProfile.bio,
      // Include any additional fields from the mentor profile
    };
    
    return NextResponse.json({
      message: 'Instructor profile updated successfully',
      profile: responseData
    });
  } catch (error) {
    console.error('Error updating instructor profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update instructor profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
