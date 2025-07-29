import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } },
  context: { params: { conversationId: string } }
) {
  try {
    const conversationId = params.conversationId;

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

    // Check if user is part of this conversation
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        userId: user.id,
        conversationId,
      },
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'User not authorized to view this conversation' },
        { status: 403 }
      );
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        readAt: null,
        senderId: { not: user.id },
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
