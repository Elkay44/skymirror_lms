import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default email templates
    const templates = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to SkyMirror LMS, {{firstName}}!',
        type: 'user_registration',
        variables: ['firstName', 'lastName', 'email', 'courseName'],
        isActive: true
      },
      {
        id: 'course_enrollment',
        name: 'Course Enrollment Confirmation',
        subject: 'You\'re enrolled in {{courseName}}',
        type: 'course_enrollment',
        variables: ['firstName', 'courseName', 'instructorName', 'startDate'],
        isActive: true
      },
      {
        id: 'assignment_reminder',
        name: 'Assignment Due Reminder',
        subject: 'Assignment "{{assignmentName}}" is due soon',
        type: 'assignment_due',
        variables: ['firstName', 'assignmentName', 'courseName', 'dueDate'],
        isActive: true
      },
      {
        id: 'grade_notification',
        name: 'Grade Posted Notification',
        subject: 'Your grade for {{assignmentName}} is available',
        type: 'grade_posted',
        variables: ['firstName', 'assignmentName', 'courseName', 'grade', 'feedback'],
        isActive: true
      },
      {
        id: 'mentorship_request',
        name: 'Mentorship Request',
        subject: 'New mentorship request from {{studentName}}',
        type: 'mentorship_request',
        variables: ['mentorName', 'studentName', 'message', 'profileUrl'],
        isActive: true
      },
      {
        id: 'payment_reminder',
        name: 'Payment Due Reminder',
        subject: 'Payment due for your SkyMirror LMS subscription',
        type: 'payment_due',
        variables: ['firstName', 'amount', 'dueDate', 'planName'],
        isActive: true
      },
      {
        id: 'system_maintenance',
        name: 'System Maintenance Notice',
        subject: 'Scheduled maintenance - {{maintenanceDate}}',
        type: 'system_maintenance',
        variables: ['firstName', 'maintenanceDate', 'duration', 'description'],
        isActive: true
      }
    ];

    return NextResponse.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
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

    // Check if user is admin or instructor
    if (!['admin', 'instructor'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { templates } = await request.json();

    if (!templates || !Array.isArray(templates)) {
      return NextResponse.json(
        { error: 'Invalid templates data' },
        { status: 400 }
      );
    }

    // In a production system, you'd store these in the database
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Templates updated successfully'
    });

  } catch (error) {
    console.error('Error updating email templates:', error);
    return NextResponse.json(
      { error: 'Failed to update templates' },
      { status: 500 }
    );
  }
}
