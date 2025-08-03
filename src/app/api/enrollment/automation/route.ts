import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Webhook secret for form integrations
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

interface EnrollmentWebhookData {
  name: string;
  email: string;
  courseId: string;
  source: 'typeform' | 'google_forms' | 'hubspot';
  metadata?: Record<string, any>;
}

function verifyWebhookSignature(signature: string, body: string) {
  const hmac = createHmac('sha256', WEBHOOK_SECRET);
  const calculatedSignature = hmac.update(body).digest('hex');
  return signature === calculatedSignature;
}

async function sendWelcomeEmail(email: string, name: string, courseTitle: string) {
  try {
    if (!resend) {
      console.warn('Resend API key not configured, skipping email');
      return;
    }
    await resend.emails.send({
      from: 'Skymirror Learning <noreply@skymirror.com>',
      to: email,
      subject: `Welcome to ${courseTitle}!`,
      html: `
        <h1>Welcome to ${courseTitle}, ${name}!</h1>
        <p>We're excited to have you on board. Here's what you need to know to get started:</p>
        <ol>
          <li>Access your course materials through your student dashboard</li>
          <li>Join the course forum to connect with fellow students</li>
          <li>Track your progress and earn achievements</li>
        </ol>
        <p>If you have any questions, don't hesitate to reach out to our support team.</p>
      `
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-webhook-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const body = await req.text();
    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body) as EnrollmentWebhookData;
    
    // Create or get user
    let user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      // Generate a random password that will require reset on first login
      const tempPassword = Math.random().toString(36).slice(-12);
      
      user = await (prisma as any).user.create({
        data: {
          email: data.email,
          name: data.name,
          password: tempPassword, // This will be hashed by Prisma middleware
          role: 'STUDENT'
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get course details
    const course = await (prisma as any).course.findUnique({
      where: { id: data.courseId },
      select: {
        id: true,
        title: true,
        enrollments: {
          where: {
            userId: user.id,
            status: 'ACTIVE'
          }
        },
        learningPath: true
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if already enrolled
    if (course.enrollments.length > 0) {
      return NextResponse.json(
        { error: 'User already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await (prisma as any).enrollment.create({
      data: {
        userId: user!.id,
        courseId: course.id,
        status: 'ACTIVE',
        progress: 0
      }
    });

    // Send welcome email if email exists
    if (user.email) {
      await sendWelcomeEmail(user.email, user.name || 'Student', course.title);
    }

    // Create learning path if it doesn't exist
    await (prisma as any).learningPath.upsert({
      where: { userId: user!.id },
      update: {},
      create: {
        userId: user!.id,
        preferences: data.metadata?.preferences || {},
        aiRecommendations: {}
      }
    });

    return NextResponse.json({
      message: 'Enrollment successful',
      enrollmentId: enrollment.id
    });
  } catch (error) {
    console.error('Error processing enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
