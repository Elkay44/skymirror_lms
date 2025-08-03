import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// Define a custom type that includes all the fields we need
type UserWithProfile = {
  id: string;
  name: string | null;
  email: string;
  password: string;
  role: string;
  points: number;
  level: number;
  needsOnboarding: boolean;
  bio?: string | null;
  location?: string | null;
  expertise?: string | null;
  yearsOfExperience?: number | null;
  education?: string | null;
  teachingPhilosophy?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// GET /api/profile/instructor - Fetch instructor profile data
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch instructor's courses count and total students
    const coursesCount = await prisma.course.count({
      where: { instructorId: user.id },
    });
    
    // Calculate total students enrolled in instructor's courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          instructorId: user.id,
        },
      },
      distinct: ['userId'],
    });
    
    
    // Default response with counts
    const responseData = {
      ...user,
      courseCount: coursesCount,
      totalStudents: enrollments.length,
      averageRating: 0,
    };
    
    // Return the data
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching instructor profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/instructor - Update instructor profile data
export async function PUT(request: Request) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const data = await request.json();
    const { 
      name, 
      bio, 
      location 
    } = data;
    
    // Extract instructor-specific fields but only use ones that exist in our schema
    const { 
      expertise, 
      yearsOfExperience, 
      education, 
      teachingPhilosophy 
    } = data;

    // Find the user with type assertion to our custom type
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    }) as unknown as UserWithProfile | null;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare the update data with only defined fields
    const updateData: Partial<UserWithProfile> = {
      name: name ?? user.name,
    };

    // Only include fields in the update if they are provided
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (education !== undefined) updateData.education = education;
    if (teachingPhilosophy !== undefined) updateData.teachingPhilosophy = teachingPhilosophy;
    if (yearsOfExperience !== undefined) {
      updateData.yearsOfExperience = typeof yearsOfExperience === 'string' 
        ? parseInt(yearsOfExperience) 
        : yearsOfExperience;
    }

    // Perform the update with type assertion
    const updatedUser = await (prisma.user as any).update({
      where: { email: session.user.email },
      data: updateData,
    }) as unknown as UserWithProfile;
    
    // Log all instructor-specific fields for debugging
    console.log(`Updating instructor profile for user ${updatedUser.id}:`, {
      expertise,
      education,
      teachingPhilosophy,
      yearsOfExperience: typeof yearsOfExperience === 'string' ? parseInt(yearsOfExperience) : yearsOfExperience
    });
    
    // Note: The remaining instructor-specific fields would normally be stored in a separate
    // InstructorProfile model. Since we're having schema issues, we're only updating
    // the standard user fields for now.
    
    console.log('Updated instructor profile for:', updatedUser.email);

    // Fetch the instructor's data for the response
    const coursesCount = await prisma.course.count({
      where: { instructorId: user.id },
    });
    
    const enrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          instructorId: user.id,
        },
      },
      distinct: ['userId'],
    });
    
    // Return the updated data
    return NextResponse.json({
      ...updatedUser,
      courseCount: coursesCount,
      totalStudents: enrollments.length,
      averageRating: 0,
    });
  } catch (error) {
    console.error('Error updating instructor profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile data' },
      { status: 500 }
    );
  }
}
