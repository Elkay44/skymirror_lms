import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    // Get accepted mentorship requests (these are the mentees)
    const mentorshipRequests = await prisma.mentorshipRequest.findMany({
      where: { 
        mentorId: mentorProfile.id,
        status: 'ACCEPTED'
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Get recent sessions for each mentee to calculate progress
    const menteeIds = mentorshipRequests.map(req => req.student.user.id);
    
    const recentSessions = await prisma.mentorSession.findMany({
      where: {
        mentorId: user.id,
        menteeId: { in: menteeIds }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    // Get upcoming sessions for each mentee
    const upcomingSessions = await prisma.mentorSession.findMany({
      where: {
        mentorId: user.id,
        menteeId: { in: menteeIds },
        scheduledAt: {
          gte: new Date()
        },
        status: 'SCHEDULED'
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    // Transform data for frontend
    const mentees = mentorshipRequests.map(request => {
      const menteeId = request.student.user.id;
      
      // Find last session for this mentee
      const lastSession = recentSessions.find(session => session.menteeId === menteeId);
      
      // Find upcoming session for this mentee
      const upcomingSession = upcomingSessions.find(session => session.menteeId === menteeId);
      
      // Calculate completed sessions
      const completedSessions = recentSessions.filter(
        session => session.menteeId === menteeId && session.status === 'COMPLETED'
      ).length;
      
      // Calculate total sessions
      const totalSessions = recentSessions.filter(
        session => session.menteeId === menteeId
      ).length;
      
      // Calculate progress percentage (based on completed sessions)
      const progressPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      return {
        id: menteeId,
        name: request.student.user.name || 'Unknown',
        imageUrl: request.student.user.image,
        email: request.student.user.email,
        careerGoal: 'Career Development', // Default since we don't have this field
        lastSessionDate: lastSession ? lastSession.scheduledAt.toISOString().split('T')[0] : null,
        progressPercentage,
        upcomingSession: upcomingSession ? {
          id: upcomingSession.id,
          date: upcomingSession.scheduledAt.toISOString().split('T')[0],
          time: `${upcomingSession.scheduledAt.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })}-${new Date(upcomingSession.scheduledAt.getTime() + upcomingSession.duration * 60000).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })}`
        } : null,
        activeMilestones: Math.max(1, Math.floor(Math.random() * 5)), // Placeholder
        completedMilestones: completedSessions,
        totalSessions,
        completedSessions,
        requestedAt: request.createdAt.toISOString(),
        status: request.status
      };
    });

    return NextResponse.json({ mentees });
  } catch (error) {
    console.error('Error fetching mentees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentees' },
      { status: 500 }
    );
  }
}
