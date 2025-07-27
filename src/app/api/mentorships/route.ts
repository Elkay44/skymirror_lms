import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  MentorSession,
  MentorSessionStatus,
  FormattedMentorSession,
  MentorProfile,
  StudentProfile,
  User
} from '@/types/mentorship';

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
    
    let sessions = [];
    
    if (role === 'mentor') {
      // Get sessions where user is the mentor
      sessions = (await prisma.mentorSession.findMany({
        where: {
          mentor: { userId: session.user.id },
          ...(status ? { status: status as any } : {})
        },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
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
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      })) as unknown as MentorSession[];
    } else if (role === 'mentee') {
      // Get sessions where user is the mentee
      sessions = (await prisma.mentorSession.findMany({
        where: {
          mentee: { userId: session.user.id },
          ...(status ? { status: status as any } : {})
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
      })) as unknown as MentorSession[];
    } else {
      // Get all sessions where user is either mentor or mentee
      const [asMentor, asMentee] = await Promise.all([
        prisma.mentorSession.findMany({
          where: {
            mentor: { userId: session.user.id },
            ...(status ? { status: status as any } : {})
          },
          include: {
            mentor: { include: { user: true } },
            mentee: { include: { user: true } },
          },
        }),
        prisma.mentorSession.findMany({
          where: {
            mentee: { userId: session.user.id },
            ...(status ? { status: status as any } : {})
          },
          include: {
            mentor: { include: { user: true } },
            mentee: { include: { user: true } },
          },
        }),
      ]) as [any[], any[]];
      
      // Combine and deduplicate sessions
      const allSessions = [...asMentor, ...asMentee];
      const sessionMap = new Map(allSessions.map(session => [session.id, session]));
      sessions = Array.from(sessionMap.values()) as any[];
    }
    
    // Format the response
    const formattedSessions = sessions.map(session => {
      const mentor = session.mentor as MentorProfile;
      const mentee = session.mentee as StudentProfile;
      
      return {
        id: session.id,
        title: session.title,
        description: session.description,
        status: session.status as MentorSessionStatus,
        scheduledAt: session.scheduledAt,
        duration: session.duration,
        meetingUrl: session.meetingUrl,
        notes: session.notes,
        mentor: {
          id: mentor.id,
          name: mentor.user?.name || null,
          email: mentor.user?.email || '',
          bio: mentor.bio,
        },
        mentee: {
          id: mentee.id,
          name: mentee.user?.name || null,
          email: mentee.user?.email || '',
        },
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      } as FormattedMentorSession;
    });
    
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
      description = null, 
      scheduledAt, 
      duration,
      meetingUrl = null,
      notes = null
    } = await req.json();
    
    const menteeId = session.user.id;
    
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
    
    // Create the session with mentor and mentee data
    const newSession = await prisma.mentorSession.create({
      data: {
        title,
        description,
        status: 'SCHEDULED' as MentorSessionStatus,
        scheduledAt: new Date(scheduledAt),
        duration,
        meetingUrl: meetingUrl || null,
        notes: notes || null,
        mentor: { connect: { id: mentorId } },
        mentee: { connect: { userId: menteeId } },
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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
                image: true,
              },
            },
          },
        },
      },
    }) as unknown as MentorSession;

    // Format the response
    const mentor = newSession.mentor as MentorProfile;
    const mentee = newSession.mentee as StudentProfile;
    
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
        id: mentor.id,
        name: mentor.user?.name || null,
        email: mentor.user?.email || '',
        bio: mentor.bio || null,
      },
      mentee: {
        id: mentee.id,
        name: mentee.user?.name || null,
        email: mentee.user?.email || '',
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
