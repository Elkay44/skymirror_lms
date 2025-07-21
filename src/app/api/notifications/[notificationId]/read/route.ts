/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST endpoint to mark a notification as read
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { notificationId } = await params;

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Find the notification and check ownership
    const notification = await prisma.notification.findUnique({
      where: { 
        id: notificationId,
        userId: user.id, // Ensure the notification belongs to the user
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' }, 
        { status: 404 }
      );
    }

    // Mark the notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      notification: updatedNotification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
