import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Course, User } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Define types for instructors
type InstructorResponse = {
  id: string;
  name: string;
  email: string;
  image: string;
  isOwner: boolean;
};

interface AuthInfo {
  userId: string;
  isOwner: boolean;
  isAdmin: boolean;
  course: Course & {
    instructor: User;
  };
}

// Helper function to check auth and get course with instructor
async function checkCourseAccess(courseId: string): Promise<AuthInfo | Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN';
  
  // Get course with instructor details
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: true
    },
  });
  
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }
  
  // Check if user is the instructor/owner of the course
  const isOwner = course.instructorId === Number(userId);
  
  // Return auth info
  return {
    userId,
    isOwner,
    isAdmin,
    course: course as AuthInfo['course'],
  };
}

// Function to get all instructors for a course
async function getCourseInstructors(courseId: string): Promise<InstructorResponse[]> {
  // In our schema, there's only one instructor per course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: true
    }
  });
  
  if (!course) {
    return [];
  }
  
  // Return the instructor as an array for API consistency
  return [
    {
      id: course.instructor.id.toString(),
      name: course.instructor.name || '',
      email: course.instructor.email,
      image: course.instructor.image || '',
      isOwner: true // The instructor is always the owner in this schema
    }
  ];
}

/**
 * GET /api/courses/[courseId]/instructors - Get all instructors for a course
 */
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const authResult = await checkCourseAccess(params.courseId);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  // Get instructors for the course
  const instructors = await getCourseInstructors(params.courseId);
  
  // Return formatted instructor list
  return NextResponse.json({
    instructors
  });
}

/**
 * POST /api/courses/[courseId]/instructors - No longer relevant as one course has one instructor
 * Keeping API for backward compatibility but returning error
 */
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const authResult = await checkCourseAccess(params.courseId);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  // Return error as this schema doesn't support multiple instructors
  return NextResponse.json({ 
    error: 'Operation not supported', 
    message: 'This API endpoint is deprecated. In the current schema, a course can only have one instructor who is set during course creation.' 
  }, { status: 400 });
}

/**
 * PATCH /api/courses/[courseId]/instructors/[instructorId] - No longer relevant as one course has one instructor
 * Keeping API for backward compatibility but returning error
 */
export async function PATCH(
  req: NextRequest, 
  { params }: { params: { courseId: string; instructorId: string } }
) {
  const authResult = await checkCourseAccess(params.courseId);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  // Return error as this schema doesn't support multiple instructors
  return NextResponse.json({ 
    error: 'Operation not supported', 
    message: 'This API endpoint is deprecated. In the current schema, a course can only have one instructor who is set during course creation.' 
  }, { status: 400 });
}

/**
 * DELETE /api/courses/[courseId]/instructors/[instructorId] - No longer relevant as one course has one instructor
 * Keeping API for backward compatibility but returning error
 */
export async function DELETE(
  req: NextRequest, 
  { params }: { params: { courseId: string; instructorId: string } }
) {
  const authResult = await checkCourseAccess(params.courseId);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  // Return error as this schema doesn't support multiple instructors
  return NextResponse.json({ 
    error: 'Operation not supported', 
    message: 'This API endpoint is deprecated. In the current schema, a course can only have one instructor who is set during course creation. To change the instructor, update the course directly.' 
  }, { status: 400 });
}
