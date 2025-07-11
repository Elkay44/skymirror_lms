import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
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
      expertise, 
      yearsOfExperience, 
      education, 
      teachingPhilosophy,
      bio
    } = data;
    
    // Update instructor profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        expertise,
        yearsOfExperience,
        education,
        teachingPhilosophy,
        bio
      },
      select: {
        id: true,
        name: true,
        expertise: true,
        yearsOfExperience: true,
        education: true,
        teachingPhilosophy: true,
        bio: true
      }
    });
    
    return NextResponse.json({
      message: 'Instructor profile updated successfully',
      profile: updatedUser
    });
  } catch (error) {
    console.error('Error updating instructor profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update instructor profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
