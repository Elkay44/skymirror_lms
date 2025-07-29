/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/mentorships/[id]
 * Get details of a specific mentorship
 */
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { id: mentorshipId } = await params;
    
    // Get the mentorship with detailed information
    const mentorship = await prisma.mentorSession.findUnique({
      where: { 
        id: mentorshipId,
        // Ensure the requesting user is either the mentor or mentee
        OR: [
          { mentorId: session.user.id },
          { menteeId: session.user.id },
        ],
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: session.user.role === 'ADMIN',
            skills: {
              select: {
                id: true,
                name: true,
                level: true,
              },
              take: 5,
            },
          },
        },
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
          },
        },
        sessions: {
          orderBy: {
            scheduledAt: 'desc',
          },
          take: 5,
          include: {
            meeting: {
              select: {
                id: true,
                joinUrl: true,
                startUrl: true,
              },
            },
          },
        },
        goals: {
          where: {
            status: 'IN_PROGRESS',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        },
        _count: {
          select: {
            sessions: {
              where: {
                status: 'COMPLETED',
              },
            },
            goals: true,
          },
        },
      },
    });

    if (!mentorship) {
      return NextResponse.json(
        { error: 'Mentorship not found or access denied' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(mentorship);
  } catch (error) {
    console.error('Error fetching mentorship details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentorship details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mentorships/[id]
 * Update a mentor session's status or details
 */
export async function PATCH(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { id: sessionId } = await params;
    const updateData = await req.json();
    
    // Check if the mentor session exists and the user has permission
    const existingSession = await prisma.mentorSession.findUnique({
      where: { 
        id: sessionId,
        OR: [
          { mentorId: session.user.id },
          { menteeId: session.user.id },
        ],
      },
    });
    
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Mentor session not found or access denied' },
        { status: 404 }
      );
    }
    
    // Define allowed updates and prepare the update data
    const allowedUpdates = [
      'status',
      'notes',
      'meetingUrl',
      'scheduledAt',
      'duration'
    ];
    
    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        // Handle special cases for date and number fields
        if (key === 'scheduledAt' && updateData[key]) {
          obj[key] = new Date(updateData[key]);
        } else if (key === 'duration' && updateData[key]) {
          obj[key] = parseInt(updateData[key]);
        } else if (updateData[key] !== undefined) {
          obj[key] = updateData[key];
        }
        return obj;
      }, {} as Record<string, any>);
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    // Update the mentor session
    const updatedSession = await prisma.mentorSession.update({
      where: { id: sessionId },
      data: updates,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: session.user.role === 'ADMIN',
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            name: true,
            email: session.user.role === 'ADMIN',
          },
        },
      },
    });
    
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating mentor session:', error);
    return NextResponse.json(
      { error: 'Failed to update mentor session' },
      { status: 500 }
    );
  }
}
