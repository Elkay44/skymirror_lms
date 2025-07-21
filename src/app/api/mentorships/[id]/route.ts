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
    const mentorship = await prisma.mentorship.findUnique({
      where: { 
        id: mentorshipId,
        // Ensure the requesting user is either the mentor or mentee
        OR: [
          { mentor: { userId: session.user.id } },
          { menteeId: session.user.id },
        ],
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
              },
            },
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
 * Update a mentorship's status or details
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
    
    const { id: mentorshipId } = await params;
    const updateData = await req.json();
    
    // Validate the update data
    const allowedUpdates = [
      'status',
      'goals',
      'expectations',
      'communicationPreference',
      'meetingFrequency',
      'nextMeetingAt',
      'notes',
    ];
    
    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as Record<string, any>);
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' }, 
        { status: 400 }
      );
    }
    
    // Check if the user has permission to update this mentorship
    const existingMentorship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      select: {
        mentor: {
          select: { userId: true },
        },
        menteeId: true,
      },
    });
    
    if (!existingMentorship) {
      return NextResponse.json(
        { error: 'Mentorship not found' }, 
        { status: 404 }
      );
    }
    
    const isMentor = existingMentorship.mentor.userId === session.user.id;
    const isMentee = existingMentorship.menteeId === session.user.id;
    
    if (!isMentor && !isMentee) {
      return NextResponse.json(
        { error: 'You do not have permission to update this mentorship' }, 
        { status: 403 }
      );
    }
    
    // If updating status, add validation
    if (updates.status) {
      const validStatuses = [
        'PENDING',
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'CANCELLED',
      ];
      
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' }, 
          { status: 400 }
        );
      }
      
      // Add status-specific validations
      if (updates.status === 'COMPLETED' && !isMentor) {
        return NextResponse.json(
          { error: 'Only mentors can complete a mentorship' }, 
          { status: 403 }
        );
      }
    }
    
    // Update the mentorship
    const updatedMentorship = await prisma.mentorship.update({
      where: { id: mentorshipId },
      data: updates,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    // Log the update
    await prisma.mentorshipHistory.create({
      data: {
        mentorshipId,
        changedBy: session.user.id,
        changes: updates,
      },
    });
    
    return NextResponse.json(updatedMentorship);
  } catch (error) {
    console.error('Error updating mentorship:', error);
    return NextResponse.json(
      { error: 'Failed to update mentorship' },
      { status: 500 }
    );
  }
}
