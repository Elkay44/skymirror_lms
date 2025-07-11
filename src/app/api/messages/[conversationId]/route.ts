import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET endpoint to fetch messages for a specific conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a participant in this conversation
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
      },
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get messages for this conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        attachments: true,
        readBy: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    // Format the response
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name || 'Unknown User',
      senderRole: message.sender.role,
      senderAvatar: message.sender.image || undefined,
      timestamp: message.sentAt,
      isRead: message.readBy.some((user) => user.id === message.senderId),
      attachments: message.attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.fileName,
        type: attachment.fileType || 'document',
        url: attachment.fileUrl,
        size: attachment.fileSize || 'Unknown size',
      })),
    }));

    // Mark all messages as read by current user
    const unreadMessages = messages
      .filter(
        (message) =>
          message.senderId !== user.id &&
          !message.readBy.some((reader) => reader.id === user.id)
      )
      .map((message) => message.id);

    if (unreadMessages.length > 0) {
      // Add current user to readBy for all unread messages
      await Promise.all(
        unreadMessages.map((messageId) =>
          prisma.message.update({
            where: { id: messageId },
            data: {
              readBy: {
                connect: { id: user.id },
              },
            },
          })
        )
      );

      // Reset unread count for user in this conversation
      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: user.id,
          },
        },
        data: {
          unreadCount: 0,
        },
      });
    }

    return NextResponse.json({
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST endpoint to send a message to a conversation
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, image: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a participant in this conversation
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
      },
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Parse request body
    const data = await req.json();
    const { content, attachments } = data;

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message content or attachments are required' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content || '',
        readBy: {
          connect: { id: user.id }, // Mark as read by sender
        },
        ...(attachments && attachments.length > 0
          ? {
              attachments: {
                create: attachments.map((attachment: any) => ({
                  fileName: attachment.name,
                  fileUrl: attachment.url,
                  fileType: attachment.type,
                  fileSize: attachment.size,
                })),
              },
            }
          : {}),
      },
      include: {
        attachments: true,
      },
    });

    // Update conversation with last message info
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content || 'Sent an attachment',
        lastMessageAt: new Date(),
        lastMessageSenderId: user.id,
      },
    });

    // Update unread count for other participants
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

    // Format the response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: user.name || 'Unknown User',
      senderRole: user.role,
      senderAvatar: user.image || undefined,
      timestamp: message.sentAt,
      isRead: true, // Read by sender
      attachments: message.attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.fileName,
        type: attachment.fileType || 'document',
        url: attachment.fileUrl,
        size: attachment.fileSize || 'Unknown size',
      })),
    };

    return NextResponse.json({
      message: formattedMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
