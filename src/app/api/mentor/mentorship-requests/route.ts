import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

// GET - Fetch all mentorship requests for the authenticated mentor
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    // Build where clause based on status filter
    const whereClause: any = {
      mentorId: mentorProfile.id
    };

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Get mentorship requests
    const mentorshipRequests = await prisma.mentorshipRequest.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.mentorshipRequest.count({
      where: whereClause
    });

    // Transform the data for frontend
    const transformedRequests = mentorshipRequests.map(request => ({
      id: request.id,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      student: {
        id: request.student.user.id,
        name: request.student.user.name,
        email: request.student.user.email,
        image: request.student.user.image
      }
    }));

    // Get counts by status for summary
    const statusCounts = await prisma.mentorshipRequest.groupBy({
      by: ['status'],
      where: {
        mentorId: mentorProfile.id
      },
      _count: {
        status: true
      }
    });

    const summary = {
      total: totalCount,
      pending: statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
      accepted: statusCounts.find(s => s.status === 'ACCEPTED')?._count.status || 0,
      rejected: statusCounts.find(s => s.status === 'REJECTED')?._count.status || 0
    };

    return NextResponse.json({
      requests: transformedRequests,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching mentorship requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentorship requests' },
      { status: 500 }
    );
  }
}
