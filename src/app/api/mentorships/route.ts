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
    const role = searchParams.get('role') as 'mentor' | 'student' | null;

    if (role === 'student') {
      // Get mentor sessions where user is the student
      const mentorSessions = await prisma.mentorSession.findMany({
        where: {
          menteeId: session.user.id,
          ...(status ? { status: status as any } : {})
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              mentorProfile: {
                select: {
                  bio: true,
                  specialties: true,
                  experience: true,
                  availability: true,
                  isActive: true
                }
              }
            }
          },
          mentee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              studentProfile: {
                select: {
                  bio: true,
                  learningGoals: true,
                  interests: true,
                  goals: true,
                  preferredLearningStyle: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledAt: 'desc'
        }
      });

      const formattedSessions = mentorSessions.map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description,
        status: session.status as MentorSessionStatus,
        scheduledAt: session.scheduledAt,
        duration: session.duration,
        meetingUrl: session.meetingUrl,
        notes: session.notes,
        mentor: {
          id: session.mentorId,
          name: session.mentor?.name || null,
          email: session.mentor?.email || '',
          bio: session.mentor?.mentorProfile?.bio || '',
          specialties: session.mentor?.mentorProfile?.specialties ? session.mentor?.mentorProfile?.specialties.split(',') : [],
          experience: session.mentor?.mentorProfile?.experience || '',
          availability: session.mentor?.mentorProfile?.availability || '',
          isActive: session.mentor?.mentorProfile?.isActive || false
        },
        mentee: {
          id: session.menteeId,
          name: session.mentee?.name || null,
          email: session.mentee?.email || '',
          bio: session.mentee?.studentProfile?.bio || '',
          learningGoals: session.mentee?.studentProfile?.learningGoals || '',
          interests: session.mentee?.studentProfile?.interests || '',
          goals: session.mentee?.studentProfile?.goals || '',
          preferredLearningStyle: session.mentee?.studentProfile?.preferredLearningStyle || ''
        },
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }));

      return NextResponse.json(formattedSessions);
    } else {
      // Get all mentor sessions where user is either mentor or mentee
      const [asMentor, asMentee] = await Promise.all([
        prisma.mentorSession.findMany({
          where: {
            mentorId: session.user.id,
            ...(status ? { status: status as any } : {})
          },
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                mentorProfile: {
                  select: {
                    bio: true,
                    specialties: true,
                    experience: true,
                    availability: true,
                    isActive: true
                  }
                }
              }
            },
            mentee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                studentProfile: {
                  select: {
                    bio: true,
                    learningGoals: true,
                    interests: true,
                    goals: true,
                    preferredLearningStyle: true
                  }
                }
              }
            }
          },
          orderBy: {
            scheduledAt: 'desc'
          }
        }),
        prisma.mentorSession.findMany({
          where: {
            menteeId: session.user.id,
            ...(status ? { status: status as any } : {})
          },
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                mentorProfile: {
                  select: {
                    bio: true,
                    specialties: true,
                    experience: true,
                    availability: true,
                    isActive: true
                  }
                }
              }
            },
            mentee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                studentProfile: {
                  select: {
                    bio: true,
                    learningGoals: true,
                    interests: true,
                    goals: true,
                    preferredLearningStyle: true
                  }
                }
              }
            }
          },
          orderBy: {
            scheduledAt: 'desc'
          }
        })
      ]);

      const formattedSessions = [...asMentor, ...asMentee].map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description,
        status: session.status as MentorSessionStatus,
        scheduledAt: session.scheduledAt,
        duration: session.duration,
        meetingUrl: session.meetingUrl,
        notes: session.notes,
        mentor: {
          id: session.mentorId,
          name: session.mentor?.name || null,
          email: session.mentor?.email || '',
          bio: session.mentor?.mentorProfile?.bio || '',
          specialties: session.mentor?.mentorProfile?.specialties || [],
          experience: session.mentor?.mentorProfile?.experience || '',
          availability: session.mentor?.mentorProfile?.availability || '',
          isActive: session.mentor?.mentorProfile?.isActive || false
        },
        mentee: {
          id: session.menteeId,
          name: session.mentee?.name || null,
          email: session.mentee?.email || '',
          bio: session.mentee?.studentProfile?.bio || '',
          learningGoals: session.mentee?.studentProfile?.learningGoals || '',
          interests: session.mentee?.studentProfile?.interests || '',
          goals: session.mentee?.studentProfile?.goals || '',
          preferredLearningStyle: session.mentee?.studentProfile?.preferredLearningStyle || ''
        },
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }));

      return NextResponse.json(formattedSessions);
    }
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
