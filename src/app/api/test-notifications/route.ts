import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import prisma from '@/lib/prisma-extensions';

// POST endpoint to create test notifications for the current user
export async function POST() {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create sample notifications
    const sampleNotifications = [
      {
        type: 'course_approval',
        message: 'Your course "Introduction to React" has been approved and is now published!',
        metadata: { courseId: 'sample-course-1', resourceUrl: '/instructor/courses/sample-course-1' }
      },
      {
        type: 'enrollment',
        message: 'New student enrolled in your course "Advanced JavaScript"',
        metadata: { courseId: 'sample-course-2', resourceUrl: '/instructor/courses/sample-course-2' }
      },
      {
        type: 'comment',
        message: 'You have a new comment on your course discussion',
        metadata: { discussionId: 'sample-discussion-1', resourceUrl: '/courses/sample-course-1/discussions' }
      },
      {
        type: 'assignment_graded',
        message: 'Your assignment "React Components" has been graded',
        metadata: { courseId: 'sample-course-1', resourceUrl: '/student/courses/sample-course-1/assignments' }
      },
      {
        type: 'course_review',
        message: 'Someone left a 5-star review on your course!',
        metadata: { courseId: 'sample-course-1', resourceUrl: '/instructor/courses/sample-course-1/reviews' }
      }
    ];

    // Create all notifications
    const createdNotifications = [];
    for (const notif of sampleNotifications) {
      const created = await createNotification(
        user.id,
        notif.type,
        notif.message,
        notif.metadata
      );
      if (created) {
        createdNotifications.push(created);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${createdNotifications.length} test notifications for ${user.name}`,
      notifications: createdNotifications
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      { error: 'Failed to create test notifications' },
      { status: 500 }
    );
  }
}
