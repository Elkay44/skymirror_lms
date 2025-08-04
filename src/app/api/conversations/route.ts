import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

// GET /api/conversations
// Get all conversations for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get courseId from query params if provided
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');
    
    // Find all conversations where the user is a participant
    const userConversations = await prisma.conversationParticipant.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        conversation: true,
      },
    });
    
    const conversationIds = userConversations.map(uc => uc.conversationId);
    
    // Get conversations with participants and last message
    let conversations = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds },
        // Filter by courseId if provided
        ...(courseId ? { courseId } : {}),
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            sentAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    // Format conversations for the frontend
    const formattedConversations = conversations.map(conversation => {
      // Calculate unread count for current user
      const unreadCount = conversation.messages.filter(
        (message: { senderId: string, isRead: boolean }) => message.senderId !== session.user.id && !message.isRead
      ).length;
      
      // Format participants
      const participants = conversation.participants.map((participant: { user: { id: string, name: string | null, email: string | null, image: string | null, role: string } }) => ({
        id: participant.user.id,
        name: participant.user.name,
        email: participant.user.email,
        avatar: participant.user.image,
        role: participant.user.role,
        isOnline: false, // We could implement online status in the future
      }));
      
      // Get the last message
      const lastMessage = conversation.messages[0] ? {
        id: conversation.messages[0].id,
        senderId: conversation.messages[0].senderId,
        senderName: conversation.messages[0].sender?.name || 'Unknown',
        content: conversation.messages[0].content,
        timestamp: conversation.messages[0].sentAt.toISOString(), // Using sentAt instead of createdAt
        isRead: conversation.messages[0].isRead,
      } : null;
      
      return {
        id: conversation.id,
        participants,
        lastMessage,
        unreadCount,
        isGroupChat: participants.length > 2,
        courseId: conversation.courseId,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      };
    });
    
    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/conversations
// Create a new conversation
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body));
    
    const { participantId, message, courseId } = body;
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Validating message object:', message);
    if (!message?.content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Declare conversation variable in the outer scope so it's accessible outside the nested try block
    let conversation;
    
    // Verify the participant exists before attempting to create a conversation
    const participantExists = await prisma.user.findUnique({
      where: { id: participantId }
    });
    
    if (!participantExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Participant not found',
          details: `User with ID ${participantId} does not exist`
        },
        { status: 404 }
      );
    }
    
    // Check if a conversation between these users already exists
    // Use a more direct approach to find existing conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        courseId: courseId || null,
        AND: [
          {
            participants: {
              some: {
                userId: session.user.id
              }
            }
          },
          {
            participants: {
              some: {
                userId: participantId
              }
            }
          }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              }
            }
          }
        },
        messages: {
          orderBy: {
            sentAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        }
      }
    });
    
    if (existingConversation) {
      console.log('Using existing conversation:', existingConversation.id);
      // Use existing conversation
      conversation = existingConversation;
      
      // Add new message to existing conversation
      await prisma.message.create({
        data: {
          content: message.content,
          senderId: session.user.id,
          conversationId: conversation.id,
          isRead: false
        }
      });
      
      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() }
      });
    } else {
      console.log('Creating new conversation between users:', session.user.id, 'and', participantId);
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          courseId: courseId || null,
          participants: {
            create: [
              { userId: session.user.id, role: 'participant' },
              { userId: participantId, role: 'participant' }
            ]
          },
          messages: {
            create: {
              content: message.content,
              senderId: session.user.id,
              isRead: false
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  role: true,
                }
              }
            }
          },
          messages: {
            orderBy: {
              sentAt: 'desc'
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          }
        }
      });
    }
    
    // Format conversation for frontend
    const formattedConversation = {
      id: conversation.id,
      participants: conversation.participants.map((p: { userId: string; user: { name?: string | null; role?: string | null; image?: string | null } }) => ({
        id: p.userId,
        name: p.user.name || 'Unknown User',
        role: p.user.role || 'user',
        avatarUrl: p.user.image || null
      })),
      lastMessage: conversation.messages[0] ? {
        id: conversation.messages[0].id,
        content: conversation.messages[0].content,
        senderId: conversation.messages[0].senderId,
        sentAt: conversation.messages[0].sentAt,
        senderName: conversation.messages[0].sender?.name || 'Unknown User',
        senderAvatar: conversation.messages[0].sender?.image || null,
        isRead: conversation.messages[0].isRead
      } : null,
      updatedAt: conversation.updatedAt.toISOString()
    };
    
    return NextResponse.json(formattedConversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      // Check for Prisma-specific errors
      if (error.message.includes('Foreign key constraint failed')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid participant ID',
            details: 'The specified participant does not exist'
          },
          { status: 400 }
        );
      }
      
      // Check for other specific error patterns
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Resource not found',
            details: error.message
          },
          { status: 404 }
        );
      }
    }
    
    // Default error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
