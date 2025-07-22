import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Define types based on Prisma schema
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MentorProfile {
  id: string;
  userId: string;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

interface StudentProfile {
  id: string;
  userId: string;
  bio: string | null;
  learningGoals: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

type MentorSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface MentorSession {
  id: string;
  mentorId: string;
  menteeId: string;
  title: string;
  description: string | null;
  status: MentorSessionStatus;
  scheduledAt: Date;
  duration: number;
  meetingUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  mentor: MentorProfile;
  mentee: StudentProfile;
}

interface FormattedMentorSession {
  id: string;
  title: string;
  description: string | null;
  status: MentorSessionStatus;
  scheduledAt: Date;
  duration: number;
  meetingUrl: string | null;
  notes: string | null;
  mentor: {
    id: string;
    name: string | null;
    email: string;
    bio: string | null;
  };
  mentee: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/mentorships
 * Get all mentor sessions for the current user (either as mentor or mentee)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as MentorSessionStatus | null;
    const role = searchParams.get('role') as 'mentor' | 'mentee' | null;
    
    let sessions: MentorSession[] = [];
    
    if (role === 'mentor') {
      // Get sessions where user is the mentor
      sessions = await prisma.mentorSession.findMany({
        where: {
          mentor: { userId: session.user.id },
          ...(status ? { status } : {})
        },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          mentee: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      });
    } else if (role === 'mentee') {
      // Get sessions where user is the mentee
      sessions = await prisma.mentorSession.findMany({
        where: {
          mentee: { userId: session.user.id },
          ...(status ? { status } : {})
        },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          mentee: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      });
    } else {
      // Get all sessions where user is either mentor or mentee
      const [asMentor, asMentee] = await Promise.all([
        prisma.mentorSession.findMany({
          where: {
            mentor: { userId: session.user.id },
            ...(status ? { status } : {})
          },
          include: {
            mentor: { include: { user: true } },
            mentee: { include: { user: true } },
          },
        }),
        prisma.mentorSession.findMany({
          where: {
            mentee: { userId: session.user.id },
            ...(status ? { status } : {})
          },
          include: {
            mentor: { include: { user: true } },
            mentee: { include: { user: true } },
          },
        }),
      ]);
      
      // Combine and deduplicate sessions
      const allSessions = [...asMentor, ...asMentee];
      const sessionMap = new Map(allSessions.map(session => [session.id, session]));
      sessions = Array.from(sessionMap.values());
    }
    
    // Format the response
    const formattedSessions: FormattedMentorSession[] = sessions.map(session => ({
      id: session.id,
      title: session.title,
      description: session.description,
      status: session.status,
      scheduledAt: session.scheduledAt,
      duration: session.duration,
      meetingUrl: session.meetingUrl,
      notes: session.notes,
      mentor: {
        id: session.mentor.id,
        name: session.mentor.user.name,
        email: session.mentor.user.email,
        bio: session.mentor.bio,
      },
      mentee: {
        id: session.mentee.id,
        name: session.mentee.user.name,
        email: session.mentee.user.email,
      },
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
    
    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching mentor sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentorships
 * Schedule a new mentor session
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { 
      mentorId, 
      title, 
      description, 
      scheduledAt, 
      duration,
      meetingUrl 
    } = await req.json();
    
    // Validate required fields
    if (!mentorId || !title || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user has a student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    });
    
    if (!studentProfile) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }
    
    // Check if mentor exists
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: { user: true }
    });
    
    if (!mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }
    
    // Check for scheduling conflicts
    const conflictingSession = await prisma.mentorSession.findFirst({
      where: {
        OR: [
          { mentorId: mentorId },
          { menteeId: studentProfile.id }
        ],
        scheduledAt: {
          lte: new Date(new Date(scheduledAt).getTime() + duration * 60 * 1000),
        },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        NOT: {
          scheduledAt: {
            gte: new Date(new Date(scheduledAt).getTime() + duration * 60 * 1000),
          },
        },
      },
    });
    
    if (conflictingSession) {
      return NextResponse.json(
        { error: 'There is a scheduling conflict with an existing session' },
        { status: 409 }
      );
    }
    
    // Create new mentor session
    const newSession = await prisma.mentorSession.create({
      data: {
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration,
        meetingUrl: meetingUrl || null,
        status: 'SCHEDULED',
        mentor: { connect: { id: mentorId } },
        mentee: { connect: { id: studentProfile.id } },
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        mentee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    // Format the response
    const formattedSession: FormattedMentorSession = {
      id: newSession.id,
      title: newSession.title,
      description: newSession.description,
      status: newSession.status as MentorSessionStatus,
      scheduledAt: newSession.scheduledAt,
      duration: newSession.duration,
      meetingUrl: newSession.meetingUrl,
      notes: newSession.notes,
      mentor: {
        id: newSession.mentor.id,
        name: newSession.mentor.user.name,
        email: newSession.mentor.user.email,
        bio: newSession.mentor.bio,
      },
      mentee: {
        id: newSession.mentee.id,
        name: newSession.mentee.user.name,
        email: newSession.mentee.user.email,
      },
      createdAt: newSession.createdAt,
      updatedAt: newSession.updatedAt,
    };
    
    return NextResponse.json(formattedSession, { status: 201 });
  } catch (error) {
    console.error('Error creating mentor session:', error);
    return NextResponse.json(
      { error: 'Failed to create mentor session' },
      { status: 500 }
    );
  }
}
