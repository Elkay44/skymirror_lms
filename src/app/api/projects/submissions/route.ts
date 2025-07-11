import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to view submissions' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Basic filter for all queries
    const filter: any = {};
    
    // Check user role and apply appropriate filters
    if (session.user.role === 'INSTRUCTOR') {
      // Instructors can only see submissions for their courses
      const instructorCourses = await prisma.course.findMany({
        where: { instructorId: session.user.id },
        select: { id: true }
      });
      
      const courseIds = instructorCourses.map(course => course.id);
      
      // Apply course filter based on instructor's courses
      if (courseId) {
        // If a specific course is requested, check if instructor has access
        if (!courseIds.includes(courseId)) {
          return NextResponse.json(
            { error: 'You do not have access to submissions for this course' },
            { status: 403 }
          );
        }
        filter.project = { courseId };
      } else {
        // Otherwise, filter to only show submissions from instructor's courses
        filter.project = { courseId: { in: courseIds } };
      }
    } else if (session.user.role === 'STUDENT') {
      // Students can only see their own submissions
      filter.studentId = session.user.id;
      
      // Apply optional course filter
      if (courseId) {
        filter.project = { ...filter.project, courseId };
      }
    } else if (session.user.role === 'ADMIN') {
      // Admins can see all submissions, but may filter by course
      if (courseId) {
        filter.project = { ...filter.project, courseId };
      }
    } else {
      return NextResponse.json(
        { error: 'Unauthorized role' },
        { status: 403 }
      );
    }
    
    // Apply project filter if provided
    if (projectId) {
      filter.projectId = projectId;
    }
    
    // Apply status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Fetch submissions with pagination
    const submissions = await prisma.submission.findMany({
      where: filter,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        assessment: {
          select: {
            id: true,
            rubricId: true,
            criteriaScores: true,
            totalScore: true,
            feedback: true,
          }
        }
      },
      orderBy: {
        submittedAt: 'desc',
      },
      skip,
      take: limit,
    });
    
    // Count total submissions for pagination
    const totalCount = await prisma.submission.count({
      where: filter,
    });
    
    return NextResponse.json({
      submissions,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: error.message },
      { status: 500 }
    );
  }
}
