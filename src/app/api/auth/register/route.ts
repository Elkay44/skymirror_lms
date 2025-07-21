/* eslint-disable */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Define the schema for registration data
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'MENTOR']),
});

export async function POST(request: Request) {
  try {
    console.log('Registration request received');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Validate the request body
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }
    
    const { name, email, password, role } = validation.data;
    console.log('Validated data:', { name, email, role });
    
    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists with email:', email);
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('Starting transaction to create user and profile...');
    // Start a transaction to create user and profile
    const result = await prisma.$transaction(async (tx) => {
      // Log the transaction start
      console.log('Transaction started, creating user...');
      console.log('Creating user...');
      // Create the user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          points: 0, // Default value
          level: 1,  // Default value
          needsOnboarding: true, // Default value
        },
      });

      console.log('User created successfully with ID:', user.id);
      console.log('Creating profile for role:', role);
      // Create profile based on role
      if (role === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            bio: '',
            learningGoals: 'Initial learning goals',
            // Set default values for required fields
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      } else if (role === 'MENTOR') {
        await tx.mentorProfile.create({
          data: {
            userId: user.id,
            bio: 'New mentor profile',
            // Set default values for required fields
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      } else if (role === 'INSTRUCTOR') {
        // Add instructor profile creation if needed
        console.log('Instructor profile creation not yet implemented');
      }

      console.log('Profile created successfully');
      return user;
    });

    // Omit password from response
    const { password: _, ...user } = result;
    
    console.log('Registration successful for user:', user.id);
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
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error instance of Error:', error instanceof Error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for Prisma error
      if ('code' in error) {
        console.error('Prisma error code:', (error as any).code);
        console.error('Prisma meta:', (error as any).meta);
      }
    } else {
      console.error('Non-Error object:', error);
    }
    
    // Stringify the error for the response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    // Check for Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      console.error('Prisma error code:', prismaError.code);
      
      // Handle specific Prisma errors
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }
      
      // Handle constraint violation
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { error: 'A related record could not be found' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Registration failed',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          details: errorDetails,
          rawError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      },
      { status: 500 }
    );
  }
}
