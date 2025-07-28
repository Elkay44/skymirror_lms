import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET endpoint to fetch user notifications
export async function GET() {
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

    // Define the notification type based on our Prisma model
    type PrismaNotification = {
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      metadata: any;
      createdAt: Date;
      updatedAt: Date;
      linkUrl?: string | null;
    };
    
    // Define the formatted notification type for the API response
    interface FormattedNotification {
      id: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: string;
      linkUrl: string | null;
    }
    
    let formattedNotifications: FormattedNotification[] = [];
    try {
      // Get notifications for this user
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to most recent 50 notifications
      });

      // Format the response
      formattedNotifications = notifications.map((notification: PrismaNotification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
        linkUrl: notification.linkUrl || null,
      }));
    } catch (notificationError) {
      // If there's an error with the notifications table, just return an empty array
      // This prevents breaking the dashboard if the notifications feature isn't fully set up
      console.warn('Error fetching from notification table, returning empty array:', notificationError);
      // Continue execution with empty notifications array
    }

    // Return whatever notifications we found (or an empty array if there was an error)
    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error('Error in notifications API route:', error);
    // Return empty notifications array to avoid breaking the UI
    return NextResponse.json([], { status: 200 });
  }
}
