import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Helper function to convert string IDs to numbers
function toNumber(id: string | number | undefined): number | undefined {
  if (id === undefined) return undefined;
  return typeof id === 'string' ? parseInt(id) : id;
}

/**
 * GET /api/conversations
 * Get all conversations for the current user
 */
export async function GET(req: Request) {
  try {
    console.log('GET /api/conversations - Starting request');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('GET /api/conversations - Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('GET /api/conversations - User ID:', session.user.id);
    
    // Find all mentorships where the user is either mentor or student
    console.log('Finding mentor profile...');
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: toNumber(session.user.id) },
      select: { id: true }
    });
    console.log('Mentor profile:', mentorProfile);
    
    console.log('Finding student profile...');
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: toNumber(session.user.id) },
      select: { id: true }
    });
    console.log('Student profile:', studentProfile);
    
    // Build query to find all conversations
    console.log('Finding mentor mentorships...');
    const mentorMentorships = mentorProfile
      ? await prisma.mentorship.findMany({
          where: { mentorId: mentorProfile.id },
          select: { id: true }
        })
      : [];
    console.log('Mentor mentorships:', mentorMentorships);
      
    console.log('Finding student mentorships...');
    const studentMentorships = studentProfile
      ? await prisma.mentorship.findMany({
          where: { studentId: studentProfile.id },
          select: { id: true }
        })
      : [];
    console.log('Student mentorships:', studentMentorships);
    
    // Get all mentorship IDs
    const mentorshipIds = [
      ...mentorMentorships.map(m => m.id),
      ...studentMentorships.map(m => m.id)
    ];
    console.log('All mentorship IDs:', mentorshipIds);
    
    if (mentorshipIds.length === 0) {
      console.log('No mentorships found for user');
      return NextResponse.json([]);
    }
    
    console.log('Fetching conversations for mentorships...');
    // Get conversations with proper relationship handling
    const conversations = await prisma.conversation.findMany({
      where: {
        mentorshipId: { in: mentorshipIds }
      },
      include: {
        mentorship: {
          include: {
            mentor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true
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
                    image: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            sentAt: true,
            isRead: true,
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: { 
            messages: true 
          }
        },
        participants: {
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
        lastActivity: 'desc'
      }
    });
    
    // Format the response with proper type safety and filter out any null conversations
    const formattedConversations = conversations
      .map(conv => {
        const mentorship = conv.mentorship!; // We've filtered out nulls
        const mentorUser = mentorship.mentor?.user;
        const studentUser = mentorship.student?.user;
        
        if (!mentorUser || !studentUser) {
          // Skip conversations with missing user data
          return null;
        }
        
        const isMentor = mentorUser.id === toNumber(session.user.id);
        const otherParty = isMentor
          ? {
              id: studentUser.id,
              name: studentUser.name || 'Student',
              image: studentUser.image || null,
              email: studentUser.email || null
            }
          : {
              id: mentorUser.id,
              name: mentorUser.name || 'Mentor',
              image: mentorUser.image || null,
              email: mentorUser.email || null
            };
      
      // Ensure we have valid mentorship data
      if (!conv.mentorship) {
        console.warn(`Conversation ${conv.id} has no associated mentorship`);
        return null; // Skip this conversation
      }
      
      return {
        id: conv.id,
        topic: conv.topic,
        lastActivity: conv.lastActivity,
        mentorship: {
          id: conv.mentorship.id,
          status: conv.mentorship.status
        },
        otherParty,
        lastMessage: conv.messages[0] ? {
          id: conv.messages[0].id,
          content: conv.messages[0].content,
          sentAt: conv.messages[0].sentAt,
          isRead: conv.messages[0].isRead,
          senderName: conv.messages[0].sender.name,
          isFromCurrentUser: conv.messages[0].sender.id === toNumber(session.user.id)
        } : null,
        messageCount: conv._count.messages,
        unreadCount: 0, // This would need a separate query to count unread messages
        createdAt: conv.createdAt
      };
    });
    
    // Filter out any null conversations that were skipped due to missing data
    const validConversations = formattedConversations.filter((conv): conv is NonNullable<typeof conv> => conv !== null);
    
    console.log(`Returning ${validConversations.length} valid conversations`);
    return NextResponse.json(validConversations);
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Create a new conversation in a mentorship
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { mentorshipId, topic } = await req.json();
    
    if (!mentorshipId) {
      return NextResponse.json(
        { error: 'Mentorship ID is required' },
        { status: 400 }
      );
    }
    
    // Verify the mentorship exists and user is part of it
    const mentorship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      include: {
        mentor: {
          select: { userId: true }
        },
        student: {
          select: { userId: true }
        }
      }
    });
    
    if (!mentorship) {
      return NextResponse.json(
        { error: 'Mentorship not found' },
        { status: 404 }
      );
    }
    
    // Check user is part of this mentorship
    if (mentorship.mentor.userId !== toNumber(session.user.id) && mentorship.student.userId !== toNumber(session.user.id)) {
      return NextResponse.json(
        { error: 'You are not part of this mentorship' },
        { status: 403 }
      );
    }
    
    console.log('POST /api/conversations - Creating conversation');
    
    // Create the conversation
    const conversation = await prisma.conversation.create({
      data: {
        mentorshipId,
        topic: topic || 'New Conversation',
        lastActivity: new Date()
      }
    });
    
    // Add system message
    const isMentor = mentorship.mentor.userId === session.user.id;
    const otherParty = isMentor ? mentorship.student : mentorship.mentor;
    
    // Create a system message for the new conversation
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: toNumber(session.user.id) || 0, // Fallback to 0 if undefined, though this should never happen
        content: `${session.user.name || 'User'} started a new conversation: ${topic || 'New Conversation'}`,
        isSystem: true,
        systemType: 'CONVERSATION_STARTED'
      },
      select: {
        id: true,
        content: true,
        sentAt: true,
        isSystem: true,
        systemType: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
