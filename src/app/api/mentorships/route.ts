import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/mentorships
 * Get all mentorships for the current user (either as mentor or student)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role'); // 'mentor' or 'student'
    
    // Check if user has a mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });
    
    // Check if user has a student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });
    
    // Build query conditions based on role
    let mentorships = [];
    
    // Handle filtering based on role
    if (role === 'mentor' && mentorProfile) {
      // Get mentorships where user is the mentor
      mentorships = await prisma.mentorship.findMany({
        where: {
          mentorId: mentorProfile.id,
          ...(status ? { status } : {})
        },
        include: {
          student: {
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
          conversations: {
            select: {
              id: true,
              lastActivity: true,
              _count: { select: { messages: true } }
            },
            orderBy: { lastActivity: 'desc' },
            take: 1
          },
          checkIns: {
            orderBy: { scheduledFor: 'desc' },
            take: 1
          },
          _count: {
            select: {
              conversations: true,
              checkIns: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { updatedAt: 'desc' }
        ]
      });
    } else if (role === 'student' && studentProfile) {
      // Get mentorships where user is the student
      mentorships = await prisma.mentorship.findMany({
        where: {
          studentId: studentProfile.id,
          ...(status ? { status } : {})
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
                }
              }
            }
          },
          conversations: {
            select: {
              id: true,
              lastActivity: true,
              _count: { select: { messages: true } }
            },
            orderBy: { lastActivity: 'desc' },
            take: 1
          },
          checkIns: {
            orderBy: { scheduledFor: 'desc' },
            take: 1
          },
          _count: {
            select: {
              conversations: true,
              checkIns: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { updatedAt: 'desc' }
        ]
      });
    } else {
      // If no specific role requested, get all mentorships for the user
      const mentorMentorships = mentorProfile ? await prisma.mentorship.findMany({
        where: {
          mentorId: mentorProfile.id,
          ...(status ? { status } : {})
        },
        include: {
          student: {
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
          conversations: {
            select: {
              id: true,
              lastActivity: true,
              _count: { select: { messages: true } }
            },
            orderBy: { lastActivity: 'desc' },
            take: 1
          },
          _count: {
            select: {
              conversations: true,
              checkIns: true
            }
          }
        }
      }) : [];
      
      const studentMentorships = studentProfile ? await prisma.mentorship.findMany({
        where: {
          studentId: studentProfile.id,
          ...(status ? { status } : {})
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
                }
              }
            }
          },
          conversations: {
            select: {
              id: true,
              lastActivity: true,
              _count: { select: { messages: true } }
            },
            orderBy: { lastActivity: 'desc' },
            take: 1
          },
          _count: {
            select: {
              conversations: true,
              checkIns: true
            }
          }
        }
      }) : [];
      
      // Combine both types of mentorships
      mentorships = [
        ...mentorMentorships.map(m => ({ ...m, userRole: 'mentor' })),
        ...studentMentorships.map(m => ({ ...m, userRole: 'student' }))
      ];
      
      // Sort by updated date
      mentorships.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    
    // Format the response for easier consumption
    const formattedMentorships = mentorships.map(mentorship => {
      const isMentor = mentorship.userRole === 'mentor' || (role === 'mentor');
      
      const otherParty = isMentor
        ? {
            id: mentorship.student.id,
            userId: mentorship.student.user.id,
            name: mentorship.student.user.name,
            email: mentorship.student.user.email,
            image: mentorship.student.user.image,
          }
        : {
            id: mentorship.mentor.id,
            userId: mentorship.mentor.user.id,
            name: mentorship.mentor.user.name,
            email: mentorship.mentor.user.email,
            image: mentorship.mentor.user.image,
          };
      
      return {
        id: mentorship.id,
        status: mentorship.status,
        startDate: mentorship.startDate,
        endDate: mentorship.endDate,
        notes: mentorship.notes,
        userRole: mentorship.userRole || role,
        otherParty,
        lastConversation: mentorship.conversations && mentorship.conversations[0] ? {
          id: mentorship.conversations[0].id,
          lastActivity: mentorship.conversations[0].lastActivity,
          messageCount: mentorship.conversations[0]._count.messages
        } : null,
        lastCheckIn: mentorship.checkIns && mentorship.checkIns[0] ? {
          scheduledFor: mentorship.checkIns[0].scheduledFor,
          completed: !!mentorship.checkIns[0].completedAt
        } : null,
        conversationCount: mentorship._count?.conversations || 0,
        checkInCount: mentorship._count?.checkIns || 0,
        createdAt: mentorship.createdAt,
        updatedAt: mentorship.updatedAt
      };
    });
    
    return NextResponse.json(formattedMentorships);
  } catch (error) {
    console.error('Error fetching mentorships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentorships' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentorships
 * Request a new mentorship with a mentor
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { mentorId, notes } = await req.json();
    
    if (!mentorId) {
      return NextResponse.json(
        { error: 'Mentor ID is required' },
        { status: 400 }
      );
    }
    
    // Get or create student profile
    let studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({
        data: { userId: session.user.id }
      });
    }
    
    // Check if mentor exists
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorId }
    });
    
    if (!mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }
    
    // Check if mentorship already exists
    const existingMentorship = await prisma.mentorship.findUnique({
      where: {
        mentorId_studentId: {
          mentorId,
          studentId: studentProfile.id
        }
      }
    });
    
    if (existingMentorship) {
      return NextResponse.json(
        { error: 'Mentorship already exists', mentorship: existingMentorship },
        { status: 400 }
      );
    }
    
    // Create new mentorship
    const mentorship = await prisma.mentorship.create({
      data: {
        mentorId,
        studentId: studentProfile.id,
        status: 'PENDING',
        notes
      }
    });
    
    // Create initial conversation
    const conversation = await prisma.conversation.create({
      data: {
        mentorshipId: mentorship.id,
        topic: 'Introduction'
      }
    });
    
    // Add system message to the conversation
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        receiverId: mentorProfile.userId,
        content: `${session.user.name || 'A student'} has requested mentorship. Please review and respond.`,
        isRead: false
      }
    });
    
    // Send welcome message from student if notes provided
    if (notes) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.user.id,
          receiverId: mentorProfile.userId,
          content: notes,
          isRead: false
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      mentorship,
      conversation
    });
  } catch (error) {
    console.error('Error creating mentorship:', error);
    return NextResponse.json(
      { error: 'Failed to create mentorship' },
      { status: 500 }
    );
  }
}
