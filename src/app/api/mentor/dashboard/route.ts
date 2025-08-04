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
        name: true, 
        role: true,
        image: true
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
      select: {
        id: true,
        bio: true,
        specialties: true,
        rating: true,
        reviewCount: true,
      }
    });

    // Get mentorship requests (accepted ones become mentees)
    const mentorshipRequests = await prisma.mentorshipRequest.findMany({
      where: { 
        mentorId: mentorProfile?.id,
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

    // Get upcoming mentor sessions
    const upcomingSessions = await prisma.mentorSession.findMany({
      where: {
        mentorId: user.id,
        scheduledAt: {
          gte: new Date()
        },
        status: 'SCHEDULED'
      },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      take: 10
    });

    // Get completed sessions this month for stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completedSessionsThisMonth = await prisma.mentorSession.count({
      where: {
        mentorId: user.id,
        status: 'COMPLETED',
        scheduledAt: {
          gte: startOfMonth
        }
      }
    });

    // Calculate total hours this month
    const completedSessions = await prisma.mentorSession.findMany({
      where: {
        mentorId: user.id,
        status: 'COMPLETED',
        scheduledAt: {
          gte: startOfMonth
        }
      },
      select: {
        duration: true
      }
    });

    const totalHoursThisMonth = completedSessions.reduce((total, session) => {
      return total + (session.duration / 60); // Convert minutes to hours
    }, 0);

    // Transform data for frontend
    const mentees = mentorshipRequests.map(request => ({
      id: request.student.user.id,
      name: request.student.user.name || 'Unknown',
      imageUrl: request.student.user.image,
      careerGoal: 'Career Development', // Default since we don't have this field
      lastSessionDate: null as string | null, // We'll calculate this separately if needed
      progressPercentage: Math.floor(Math.random() * 100), // Placeholder
      upcomingSession: null as { id: string; date: string; time: string; } | null, // We'll match this with upcoming sessions
      activeMilestones: Math.floor(Math.random() * 5) + 1,
      completedMilestones: Math.floor(Math.random() * 10)
    }));

    // Match upcoming sessions with mentees
    const transformedUpcomingSessions = upcomingSessions.map(session => ({
      id: session.id,
      menteeId: session.menteeId,
      menteeName: session.mentee.name || 'Unknown',
      menteeImage: session.mentee.image,
      date: session.scheduledAt.toISOString().split('T')[0],
      time: `${session.scheduledAt.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}-${new Date(session.scheduledAt.getTime() + session.duration * 60000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`,
      topic: session.title,
      type: 'ONE_ON_ONE' as const,
      notes: session.notes
    }));

    // Update mentees with their upcoming sessions
    mentees.forEach(mentee => {
      const upcomingSession = transformedUpcomingSessions.find(session => session.menteeId === mentee.id);
      if (upcomingSession) {
        mentee.upcomingSession = {
          id: upcomingSession.id,
          date: upcomingSession.date,
          time: upcomingSession.time
        };
      }
    });

    // Calculate stats
    const overallStats = {
      totalMentees: mentees.length,
      activeMentees: mentees.length, // All accepted requests are considered active
      sessionCompletedThisMonth: completedSessionsThisMonth,
      averageMenteeRating: mentorProfile?.rating || 0,
      menteeRetentionRate: mentees.length > 0 ? 85 : 0, // Placeholder calculation
      totalHoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10
    };

    // Fetch career paths from the career paths API
    let careerPaths = [];
    try {
      const careerPathsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mentor/career-paths?limit=5`, {
        headers: {
          'Cookie': `next-auth.session-token=${session.user.id}` // Pass session for internal API call
        }
      });
      if (careerPathsResponse.ok) {
        const careerPathsData = await careerPathsResponse.json();
        careerPaths = careerPathsData.careerPaths.slice(0, 3); // Limit to 3 for dashboard
      }
    } catch (error) {
      console.error('Error fetching career paths:', error);
      // Fallback to empty array
    }

    // Fetch resources from the resources API
    let resources = [];
    try {
      const resourcesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mentor/resources?limit=5`, {
        headers: {
          'Cookie': `next-auth.session-token=${session.user.id}` // Pass session for internal API call
        }
      });
      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        resources = resourcesData.resources.slice(0, 3); // Limit to 3 for dashboard
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Fallback to empty array
    }

    const dashboardData = {
      mentorName: user.name || 'Mentor',
      mentees,
      upcomingSessions: transformedUpcomingSessions,
      careerPaths,
      resources,
      overallStats
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching mentor dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
