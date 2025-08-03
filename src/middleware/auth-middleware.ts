import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CommonErrors } from '@/lib/api-response';

/**
 * Middleware to check if the user is authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return CommonErrors.unauthorized();
  }
  
  return null;
}

/**
 * Middleware to check if the user is an admin
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return CommonErrors.unauthorized();
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });
  
  if (user?.role !== 'ADMIN') {
    return CommonErrors.forbidden('Admin access required');
  }
  
  return null;
}

/**
 * Middleware to check if the user is an instructor or admin
 */
export async function requireInstructorOrAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return CommonErrors.unauthorized();
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });
  
  if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
    return CommonErrors.forbidden('Instructor or admin access required');
  }
  
  return null;
}

/**
 * Middleware to check if the user owns a course or is an admin
 */
export async function requireCourseOwnerOrAdmin(courseId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return CommonErrors.unauthorized();
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });
  
  // Admins have access to all courses
  if (user?.role === 'ADMIN') {
    return null;
  }
  
  // Check course ownership
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true }
  });
  
  if (!course) {
    return CommonErrors.notFound('Course not found');
  }
  
  if (course.instructorId !== session.user.id) {
    return CommonErrors.forbidden('You do not have permission to modify this course');
  }
  
  return null;
}

/**
 * Middleware to check if the user has enrolled in a course or is the owner/admin
 */
export async function requireCourseAccessOrOwner(courseId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return CommonErrors.unauthorized();
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });
  
  // Admins have access to all courses
  if (user?.role === 'ADMIN') {
    return null;
  }
  
  const userId = Number(session.user.id);
  
  // Check if user is the instructor
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { 
      instructorId: true,
      isPrivate: true,
      isPublished: true
    }
  });
  
  if (!course) {
    return CommonErrors.notFound('Course not found');
  }
  
  // Course owner has access
  if (course.instructorId === userId) {
    return null;
  }
  
  // If course is public and published, allow access
  if (!course.isPrivate && course.isPublished) {
    return null;
  }
  
  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: { in: ['ACTIVE', 'COMPLETED'] }
    }
  });
  
  if (!enrollment) {
    return CommonErrors.forbidden('You must be enrolled in this course to access it');
  }
  
  return null;
}

/**
 * Middleware wrapper for route handlers
 */
export function withAuth<T>(
  handler: (req: NextRequest, session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>) => Promise<T>,
  options?: { admin?: boolean; instructor?: boolean }
) {
  return async (req: NextRequest): Promise<T | NextResponse> => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }
    
    if (options?.admin || options?.instructor) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      });
      
      if (options.admin && user?.role !== 'ADMIN') {
        return CommonErrors.forbidden('Admin access required');
      }
      
      if (options.instructor && user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
        return CommonErrors.forbidden('Instructor or admin access required');
      }
    }
    
    return handler(req, session);
  };
}
