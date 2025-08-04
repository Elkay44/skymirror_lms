import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        name: true,
        role: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create mentor profile if it doesn't exist
    let mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id }
    });

    if (!mentorProfile) {
      mentorProfile = await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          bio: 'Experienced mentor helping students achieve their career goals.',
          specialties: 'Web Development, Career Guidance, Technical Skills',
          rating: 4.8,
          reviewCount: 12
        }
      });
    }

    // Create some sample mentorship requests if none exist
    const existingRequests = await prisma.mentorshipRequest.count({
      where: { mentorId: mentorProfile.id }
    });

    if (existingRequests === 0) {
      // First, we need to find some student profiles or create them
      const students = await prisma.studentProfile.findMany({
        take: 2,
        include: {
          user: true
        }
      });

      if (students.length > 0) {
        // Create mentorship requests for existing students
        for (const student of students) {
          await prisma.mentorshipRequest.create({
            data: {
              mentorId: mentorProfile.id,
              studentId: student.id,
              message: `Hi ${user.name}, I would love to have you as my mentor. I'm interested in learning more about web development and career guidance.`,
              status: 'ACCEPTED'
            }
          });

          // Create a sample session
          await prisma.mentorSession.create({
            data: {
              mentorId: user.id,
              menteeId: student.user.id,
              title: 'Career Planning Session',
              description: 'Discuss career goals and create a development plan',
              scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
              duration: 60,
              status: 'SCHEDULED'
            }
          });
        }
      }
    }

    // Create some completed sessions for analytics
    const completedSessions = await prisma.mentorSession.count({
      where: { 
        mentorId: user.id,
        status: 'COMPLETED'
      }
    });

    if (completedSessions === 0) {
      const students = await prisma.studentProfile.findMany({
        take: 2,
        include: { user: true }
      });

      if (students.length > 0) {
        // Create some past completed sessions
        for (let i = 0; i < 5; i++) {
          const student = students[i % students.length];
          await prisma.mentorSession.create({
            data: {
              mentorId: user.id,
              menteeId: student.user.id,
              title: `Session ${i + 1}: ${['JavaScript Fundamentals', 'React Basics', 'Career Planning', 'Portfolio Review', 'Interview Prep'][i]}`,
              description: 'Completed mentorship session',
              scheduledAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000), // Past weeks
              duration: 60,
              status: 'COMPLETED',
              notes: `Session completed successfully. Good progress on ${['JavaScript', 'React', 'career goals', 'portfolio', 'interview skills'][i]}.`
            }
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Mentor setup completed successfully',
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      mentorProfile: {
        id: mentorProfile.id,
        bio: mentorProfile.bio,
        specialties: mentorProfile.specialties,
        rating: mentorProfile.rating
      }
    });
  } catch (error) {
    console.error('Error setting up mentor:', error);
    return NextResponse.json(
      { error: 'Failed to setup mentor data' },
      { status: 500 }
    );
  }
}
