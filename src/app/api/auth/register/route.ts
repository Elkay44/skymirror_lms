import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate role is one of the allowed values
    const validRoles = ['STUDENT', 'INSTRUCTOR', 'MENTOR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with selected role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role,
        points: 0,
        level: 1,
        emailVerified: new Date(),
        // Set required fields with default values
        bio: '',
        location: '',
        expertise: '',
        yearsOfExperience: 0,
        education: '',
        teachingPhilosophy: '',
        walletAddress: '',
      },
    });
    
    console.log('User created with ID:', user.id);

    // Create role-specific profile based on user's selected role
    if (role === 'STUDENT') {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          interests: '',
          goals: '',
          preferredLearningStyle: '',
        }
      });
    } else if (role === 'MENTOR') {
      await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          bio: '',
          specialties: '',
          experience: '',
          availability: '',
          isActive: true,
        }
      });
    } // We don't have an instructorProfile model in the schema, so we'll just use the User model for instructors

    // Return sanitized user object
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Registration failed',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
