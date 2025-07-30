import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// GET /api/profile/student - Fetch student profile data
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession();
    console.log('Session in student profile API:', session?.user?.email, session?.user?.role);
    
    if (!session || !session.user?.email) {
      console.log('Unauthorized access attempt to student profile API');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data including the student profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { studentProfile: true },
    });

    if (!user) {
      console.log('User not found in database:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found:', user.id, user.role, 'Has profile:', !!user.studentProfile);

    // Check if the user has a student profile, if not create one
    // We'll create one regardless of role to make testing easier
    if (!user.studentProfile) {
      console.log('Creating student profile for user:', user.id);
      // Create a default student profile
      try {
        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            bio: 'Complete my first certification',
          },
        });
        console.log('Successfully created student profile');
      } catch (err) {
        console.error('Error creating student profile:', err);
      }
      
      // Fetch the user again with the new profile
      const updatedUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { studentProfile: true },
      });
      
      return NextResponse.json(updatedUser);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/student - Update student profile data
export async function PUT(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const data = await request.json();
    const { name, bio, location, studentProfile } = data;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { studentProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user's general information
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: updateData,
      });
    }

    // Check if the user has a student profile
    if (user.studentProfile) {
      // Update existing student profile
      if (bio !== undefined) {
        await prisma.studentProfile.update({
          where: { userId: user.id },
          data: { bio },
        });
      }
    } else if (user.role === 'STUDENT') {
      // Create a new student profile if it doesn't exist
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          bio: bio || 'New student',
        },
      });
    }

    // Fetch the updated user with profile
    const finalUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { studentProfile: true },
    });

    return NextResponse.json(finalUser);
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile data' },
      { status: 500 }
    );
  }
}
