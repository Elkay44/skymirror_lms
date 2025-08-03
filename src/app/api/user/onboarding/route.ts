import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { name, role } = body;
    
    // Validation
    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }
    
    // Validate role is one of the allowed values
    const validRoles = ['STUDENT', 'INSTRUCTOR', 'MENTOR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
    }
    
    console.log(`Processing onboarding for ${session.user.email} with role ${role}`);
    
    // First try to find user by email
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    // If user not found by email but we have an ID in the session, try that
    if (!user && session.user.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      console.log(`User not found by email, found by ID: ${!!user}`);
    }
    
    if (!user) {
      console.error(`User not found during onboarding for email: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log(`Updating user ${user.id} with role ${role} and name ${name}`);
    
    // Update user with role and name
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        role,
        // Only set these if they don't exist already
        points: user.points !== null ? user.points : 0,
        level: user.level !== null ? user.level : 1,
      },
    });
    
    console.log(`User updated successfully with role: ${updatedUser.role}`);
    
    // Create role-specific profile based on user's selected role
    if (role === 'STUDENT') {
      // Check if profile already exists
      const existingProfile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
      });
      
      if (!existingProfile) {
        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            bio: 'New student profile',
          }
        });
        console.log('Created student profile');
      }
    } else if (role === 'MENTOR') {
      // Check if profile already exists
      const existingProfile = await prisma.mentorProfile.findUnique({
        where: { userId: user.id },
      });
      
      if (!existingProfile) {
        await prisma.mentorProfile.create({
          data: {
            userId: user.id,
            bio: '',
            specialties: '[]',
            rating: 0,
            reviewCount: 0,
          }
        });
        console.log('Created mentor profile');
      }
    } else if (role === 'INSTRUCTOR') {
      // For instructors, update the instructor-specific fields in the User model
      // rather than creating a separate profile
      await prisma.user.update({
        where: { id: user.id },
        data: {
          expertise: '',
          yearsOfExperience: 0,
          education: '',
          teachingPhilosophy: ''
        }
      });
      console.log('Updated instructor-specific fields');
    }
    
    // Return sanitized user object
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      points: updatedUser.points,
      level: updatedUser.level,
      onboardingComplete: true,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error during onboarding' },
      { status: 500 }
    );
  }
}
