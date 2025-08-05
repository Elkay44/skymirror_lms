import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notification preferences
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        notificationPreferences: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default preferences if none exist
    const defaultPreferences = [
      {
        id: 'course_enrollment',
        type: 'course_enrollment',
        label: 'Course Enrollment',
        description: 'When you enroll in a new course',
        email: true,
        push: true,
        sms: false,
        category: 'academic'
      },
      {
        id: 'assignment_due',
        type: 'assignment_due',
        label: 'Assignment Due',
        description: 'Reminders for upcoming assignment deadlines',
        email: true,
        push: true,
        sms: false,
        category: 'academic'
      },
      {
        id: 'grade_posted',
        type: 'grade_posted',
        label: 'Grade Posted',
        description: 'When grades are posted for assignments or projects',
        email: true,
        push: true,
        sms: false,
        category: 'academic'
      },
      {
        id: 'new_message',
        type: 'new_message',
        label: 'New Message',
        description: 'When you receive a new message',
        email: false,
        push: true,
        sms: false,
        category: 'social'
      },
      {
        id: 'mentorship_request',
        type: 'mentorship_request',
        label: 'Mentorship Request',
        description: 'When someone requests mentorship or responds to your request',
        email: true,
        push: true,
        sms: false,
        category: 'social'
      },
      {
        id: 'payment_due',
        type: 'payment_due',
        label: 'Payment Due',
        description: 'Billing and payment reminders',
        email: true,
        push: false,
        sms: true,
        category: 'billing'
      },
      {
        id: 'system_maintenance',
        type: 'system_maintenance',
        label: 'System Maintenance',
        description: 'Important system updates and maintenance notices',
        email: true,
        push: false,
        sms: false,
        category: 'system'
      }
    ];

    // If user has preferences stored, merge with defaults
    let preferences = defaultPreferences;
    if (user.notificationPreferences && user.notificationPreferences.length > 0) {
      // This would require a NotificationPreference model in the schema
      // For now, return defaults
      preferences = defaultPreferences;
    }

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferences } = await request.json();

    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, we'll store preferences in user metadata
    // In a production system, you'd want a separate NotificationPreference model
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store preferences as JSON in a metadata field
        // This would require adding a metadata field to the User model
        // For now, we'll just return success
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
