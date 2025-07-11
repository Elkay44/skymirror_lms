import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/mentorships/[id]
 * Get details of a specific mentorship
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const mentorshipId = params.id;
    
    // Get the mentorship with detailed information
    const mentorship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        },
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            },
            activeCareerPath: true
          }
        },
        conversations: {
          orderBy: { lastActivity: 'desc' },
          include: {
            _count: {
              select: { messages: true }
            }
          }
        },
        checkIns: {
          orderBy: { scheduledFor: 'desc' },
          take: 5
        }
      }
    });
    
    if (!mentorship) {
      return NextResponse.json({ error: 'Mentorship not found' }, { status: 404 });
    }
    
    // Verify the user is part of this mentorship
    const isMentor = mentorship.mentor.user.id === session.user.id;
    const isStudent = mentorship.student.user.id === session.user.id;
    
    if (!isMentor && !isStudent) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Format the response
    const formattedMentorship = {
      id: mentorship.id,
      status: mentorship.status,
      startDate: mentorship.startDate,
      endDate: mentorship.endDate,
      notes: mentorship.notes,
      userRole: isMentor ? 'mentor' : 'student',
      mentor: {
        id: mentorship.mentor.id,
        userId: mentorship.mentor.user.id,
        name: mentorship.mentor.user.name,
        email: mentorship.mentor.user.email,
        image: mentorship.mentor.user.image,
      },
      student: {
        id: mentorship.student.id,
        userId: mentorship.student.user.id,
        name: mentorship.student.user.name,
        email: mentorship.student.user.email,
        image: mentorship.student.user.image,
        activeCareerPath: mentorship.student.activeCareerPath ? {
          id: mentorship.student.activeCareerPath.id,
          name: mentorship.student.activeCareerPath.name,
          description: mentorship.student.activeCareerPath.description,
        } : null
      },
      conversations: mentorship.conversations.map(conv => ({
        id: conv.id,
        topic: conv.topic,
        lastActivity: conv.lastActivity,
        messageCount: conv._count.messages
      })),
      checkIns: mentorship.checkIns.map(checkIn => ({
        id: checkIn.id,
        scheduledFor: checkIn.scheduledFor,
        completedAt: checkIn.completedAt,
        summary: checkIn.summary,
        nextSteps: checkIn.nextSteps,
        progress: checkIn.progress,
        mood: checkIn.mood
      })),
      createdAt: mentorship.createdAt,
      updatedAt: mentorship.updatedAt
    };
    
    return NextResponse.json(formattedMentorship);
  } catch (error) {
    console.error(`Error fetching mentorship:`, error);
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
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const mentorshipId = params.id;
    const { status, notes, startDate, endDate } = await req.json();
    
    // Get the mentorship
    const mentorship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      include: {
        mentor: {
          select: {
            userId: true
          }
        },
        student: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!mentorship) {
      return NextResponse.json({ error: 'Mentorship not found' }, { status: 404 });
    }
    
    // Verify the user is part of this mentorship
    const isMentor = mentorship.mentor.userId === session.user.id;
    const isStudent = mentorship.student.userId === session.user.id;
    
    if (!isMentor && !isStudent) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Validate the status change
    if (status) {
      // Some status changes can only be made by the mentor
      if (['ACTIVE', 'PAUSED', 'COMPLETED', 'DECLINED'].includes(status) && !isMentor) {
        return NextResponse.json(
          { error: 'Only mentors can approve, pause, complete, or decline mentorships' },
          { status: 403 }
        );
      }
      
      // Students can only cancel their requests if pending
      if (status === 'CANCELLED' && isStudent && mentorship.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Mentorship can only be cancelled if it is pending' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    
    // Set start date if activating the mentorship
    if (status === 'ACTIVE' && !mentorship.startDate) {
      updateData.startDate = startDate || new Date();
    }
    
    // Set end date if completing or declining the mentorship
    if (['COMPLETED', 'DECLINED'].includes(status) && !mentorship.endDate) {
      updateData.endDate = endDate || new Date();
    }
    
    // Update the mentorship
    const updatedMentorship = await prisma.mentorship.update({
      where: { id: mentorshipId },
      data: updateData
    });
    
    // If status changed to ACTIVE, create an initial check-in
    if (status === 'ACTIVE' && mentorship.status !== 'ACTIVE') {
      // Schedule first check-in for one week from now
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      
      await prisma.checkIn.create({
        data: {
          mentorshipId,
          scheduledFor: oneWeekFromNow,
          summary: 'Initial check-in to discuss goals and expectations.'
        }
      });
      
      // If no conversation exists, create one
      const conversationCount = await prisma.conversation.count({
        where: { mentorshipId }
      });
      
      if (conversationCount === 0) {
        const conversation = await prisma.conversation.create({
          data: {
            mentorshipId,
            topic: 'Getting Started'
          }
        });
        
        // Add welcome message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: session.user.id,
            receiverId: isMentor ? mentorship.student.userId : mentorship.mentor.userId,
            content: `I've ${isMentor ? 'accepted' : 'requested'} this mentorship. Let's get started!`,
            isRead: false
          }
        });
      }
    }
    
    return NextResponse.json(updatedMentorship);
  } catch (error) {
    console.error(`Error updating mentorship:`, error);
    return NextResponse.json(
      { error: 'Failed to update mentorship' },
      { status: 500 }
    );
  }
}
