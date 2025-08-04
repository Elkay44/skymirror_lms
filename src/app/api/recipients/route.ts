import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Parse query parameters
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const roleFilter = url.searchParams.get('role');
    
    // Base query to find users
    let usersQuery: any = {
      where: {
        id: { not: userId }, // Exclude current user
      },
      select: {
        id: true,
        name: true,
        role: true,
        image: true,
      },
    };
    
    // Apply role-based filtering
    if (userRole === 'STUDENT') {
      // Students can only message instructors and mentors
      usersQuery.where.role = { in: ['INSTRUCTOR', 'MENTOR'] };
      
      // If courseId is provided, limit to instructors of that course
      if (courseId) {
        usersQuery = {
          where: {
            id: { not: userId },
            role: { in: ['INSTRUCTOR', 'MENTOR'] },
            OR: [
              {
                instructorCourses: {
                  some: { id: courseId },
                },
              },
              {
                // For mentors, we'll include all mentors for now
                // since there's no direct mentor-course relation
                role: 'MENTOR'
              },
            ],
          },
          select: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        };
      }
    } else if (userRole === 'INSTRUCTOR' || userRole === 'MENTOR' || userRole === 'ADMIN') {
      // Instructors, mentors, and admins can message anyone
      if (roleFilter) {
        usersQuery.where.role = roleFilter;
      }
      
      // If courseId is provided, limit to users enrolled in that course
      if (courseId) {
        usersQuery = {
          where: {
            id: { not: userId },
            ...(roleFilter ? { role: roleFilter } : {}),
            OR: [
              {
                enrollments: {
                  some: { courseId },
                },
              },
              {
                instructorCourses: {
                  some: { id: courseId },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        };
      }
    }
    
    // Execute the query
    const users = await prisma.user.findMany(usersQuery);
    
    // Format the response
    const recipients = users.map(user => ({
      id: user.id,
      name: user.name,
      role: user.role,
      avatarUrl: user.image,
    }));
    
    return new NextResponse(JSON.stringify(recipients), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch recipients' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
