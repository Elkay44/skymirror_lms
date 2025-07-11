import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET endpoint to fetch user's conversations
export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get conversations for this user
    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true, // Use as avatarUrl
                    role: true,
                  },
                },
              },
            },
            mentorship: true,
            course: {
              select: {
                id: true,
                title: true,
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    console.log(`[Conversations API] User: ${user.id}, Conversations found: ${conversations.length}`);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Format the response with robust error handling
    const formattedConversations = conversations.map((cp: any, idx: number) => {
      try {
        const conversation = cp.conversation;
        if (!conversation) return null;
        // Defensive check for messages
        const lastMessage = Array.isArray(conversation.messages) && conversation.messages.length > 0
          ? conversation.messages[0]
          : null;
        // Defensive: participants array
        const participants = Array.isArray(conversation.participants)
          ? conversation.participants.filter((p: any) => p && p.userId !== user.id).map((p: any) => ({
              id: p.userId,
              name: p.user?.name || 'Unknown User',
              avatarUrl: p.user?.image || undefined,
              role: p.user?.role || 'UNKNOWN',
              isOnline: false,
            }))
          : [];
        // Add current user to participants
        participants.push({
          id: user.id,
          name: session.user.name || 'You',
          avatarUrl: session.user.image || undefined,
          role: typeof session.user.role === 'string' ? session.user.role : 'UNKNOWN',
          isOnline: true,
        });
        return {
          id: conversation.id,
          participants,
          lastMessage: lastMessage && typeof lastMessage === 'object' ? {
            content: lastMessage.content,
            timestamp: lastMessage.sentAt,
            senderId: lastMessage.senderId,
            isRead: lastMessage.isRead === false ? false : true,
          } : null,
          isGroupChat: Array.isArray(conversation.participants) ? conversation.participants.length > 2 : false,
          courseId: conversation.course?.id,
          courseName: conversation.course?.title,
          mentorshipId: conversation.mentorship?.id,
        };
      } catch (err) {
        console.error(`[Conversations API][FormatError][Index ${idx}]`, err, cp);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error?.message || String(error) || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new conversation
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const data = await req.json();
    const { recipientId, initialMessage, courseId, mentorshipId } = data;

    if (!recipientId || !initialMessage) {
      return NextResponse.json(
        { error: 'Recipient ID and initial message are required' },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Check if conversation already exists between these users
    // Find an existing conversation between the two users (not a group chat)
    // Find all conversations for the current user
    const userConversations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: { conversation: { include: { participants: true } } },
    });
    // Find if any conversation exists with exactly these two users (not a group chat)
    const existingConversation = userConversations.find((cp: any) => {
      const conv = cp.conversation;
      if (!conv || conv.isGroupChat) return false;
      const participantIds = conv.participants.map((p: any) => p.userId).sort();
      return participantIds.length === 2 && participantIds.includes(user.id) && participantIds.includes(recipientId);
    });

    let conversationId;

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const newConversation = await prisma.conversation.create({
        data: {
          mentorshipId,
        },
      });

      // Add participants separately (ConversationParticipant.createMany)
      await prisma.conversationParticipant.createMany({
        data: [
          {
            conversationId: newConversation.id,
            userId: user.id,
            role: 'MEMBER',
          },
          {
            conversationId: newConversation.id,
            userId: recipientId,
            role: 'MEMBER',
          },
        ],
      });

      conversationId = newConversation.id;
    }

    // Add message to conversation
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId: recipientId,
        content: initialMessage,
      },
    });

    // Update conversation with last message info
    // Optionally update the conversation's updatedAt field if you want to track activity
    // No need to update updatedAt; Prisma does this automatically on message creation
    // If you want to update lastActivity or lastMessageAt, use those fields instead if needed
    // await prisma.conversation.update({
    //   where: { id: conversationId },
    //   data: {
    //     lastActivity: new Date(),
    //   },
    // });

    // Update unread count for recipient
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: {
          not: user.id,
        },
      },
      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversationId,
      messageId: message.id,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
