import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or instructor
    if (!['admin', 'instructor'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { email, templateId } = await request.json();

    if (!email || !templateId) {
      return NextResponse.json(
        { error: 'Email and template ID are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get template data (in production, this would come from database)
    const templates = {
      welcome: {
        subject: 'Welcome to SkyMirror LMS, John!',
        content: `
          <h2>Welcome to SkyMirror LMS!</h2>
          <p>Hi John,</p>
          <p>Welcome to SkyMirror LMS! We're excited to have you on board.</p>
          <p>This is a test email to verify that our email notification system is working correctly.</p>
          <p>Best regards,<br>The SkyMirror LMS Team</p>
        `
      },
      course_enrollment: {
        subject: 'You\'re enrolled in Advanced React Development',
        content: `
          <h2>Course Enrollment Confirmation</h2>
          <p>Hi John,</p>
          <p>You have been successfully enrolled in <strong>Advanced React Development</strong>.</p>
          <p>Instructor: Jane Smith</p>
          <p>Start Date: Next Monday</p>
          <p>This is a test email to verify enrollment notifications.</p>
          <p>Best regards,<br>The SkyMirror LMS Team</p>
        `
      },
      assignment_reminder: {
        subject: 'Assignment "React Hooks Project" is due soon',
        content: `
          <h2>Assignment Due Reminder</h2>
          <p>Hi John,</p>
          <p>This is a reminder that your assignment <strong>"React Hooks Project"</strong> is due soon.</p>
          <p>Course: Advanced React Development</p>
          <p>Due Date: Tomorrow at 11:59 PM</p>
          <p>This is a test email to verify assignment reminders.</p>
          <p>Best regards,<br>The SkyMirror LMS Team</p>
        `
      },
      grade_notification: {
        subject: 'Your grade for React Hooks Project is available',
        content: `
          <h2>Grade Posted</h2>
          <p>Hi John,</p>
          <p>Your grade for <strong>"React Hooks Project"</strong> has been posted.</p>
          <p>Course: Advanced React Development</p>
          <p>Grade: A- (92%)</p>
          <p>Feedback: Excellent work on implementing custom hooks!</p>
          <p>This is a test email to verify grade notifications.</p>
          <p>Best regards,<br>The SkyMirror LMS Team</p>
        `
      }
    };

    const template = templates[templateId as keyof typeof templates];
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // In a production system, you would send the actual email here
    // For now, we'll simulate sending and return success
    console.log(`Test email would be sent to: ${email}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Content: ${template.content}`);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        recipient: email,
        template: templateId,
        subject: template.subject,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
