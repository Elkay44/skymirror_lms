import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

// GET /api/conversations/[conversationId]/messages
// Get all messages for a conversation
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { conversationId } = await params;
    
    // Check if user is a participant in this conversation
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    });
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }
    
    // Get all messages for this conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: {
        sentAt: 'asc',
      },
    });
    
    // Mark messages as read if they were sent by someone else
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: session.user.id,
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    
    // Format messages for the frontend
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender?.name || 'Unknown',
      senderAvatar: message.sender?.image || null,
      senderRole: message.sender?.role || 'STUDENT',
      sentAt: message.sentAt.toISOString(),
      isRead: message.isRead,
    }));
    
    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[conversationId]/messages
// Send a new message in a conversation
export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { conversationId } = await params;
    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Check if user is a participant in this conversation
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    });
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }
    
    // Create the new message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        conversationId,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });
    
    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });
    
    // Format the message for the frontend
    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender?.name || session.user.name || 'Unknown',
      senderAvatar: message.sender?.image || null,
      senderRole: message.sender?.role || 'STUDENT',
      sentAt: message.sentAt.toISOString(),
      isRead: message.isRead,
    };
    
    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
