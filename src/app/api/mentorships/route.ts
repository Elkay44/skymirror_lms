import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  MentorSessionStatus
} from '@/types/mentorship';

/**
 * GET /api/mentorships
 * Get all mentor sessions for the current user (either as mentor or mentee)
 */
export async function GET(req: Request) {
  try {
    console.log('Mentorship API GET request received');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('Unauthorized access attempt - no user ID');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view mentorships.' }, 
        { status: 401 }
      );
    }

    if (!session?.user?.role) {
      console.error('Unauthorized access attempt - no user role');
      return NextResponse.json(
        { error: 'User role not found' }, 
        { status: 400 }
      );
    }

    console.log('Authenticated user:', { userId: session.user.id, role: session.user.role });
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as MentorSessionStatus | null;
    const role = searchParams.get('role') as 'mentor' | 'student' | null;

    if (role === 'student') {
      try {
        console.log('Fetching mentorship requests for student with role:', session.user.role);
        const mentorshipRequests = await prisma.mentorSession.findMany({
          where: {
            menteeId: session.user.id,
            ...(status ? { status: status as any } : {})
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            scheduledAt: true,
            duration: true,
            meetingUrl: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            mentor: {
              select: {
                id: true,
                name: true,
                image: true,
                mentorProfile: {
                  select: {
                    id: true,
                    bio: true,
                    specialties: true,
                    rating: true,
                    reviewCount: true,
                    createdAt: true,
                    updatedAt: true
                  }
                }
              }
            },
            mentee: {
              select: {
                id: true,
                name: true,
                image: true,
                studentProfile: {
                  select: {
                    id: true,
                    bio: true,
                    createdAt: true,
                    updatedAt: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        console.log('Found mentorship requests:', mentorshipRequests.length);
        console.log('First request:', mentorshipRequests[0]);
        
        return NextResponse.json({ data: mentorshipRequests, error: null });
      } catch (error) {
        console.error('Error fetching mentorship requests:', error);
        return NextResponse.json({ error: 'Failed to fetch mentorship requests' }, { status: 500 });
      }
    } else {
      try {
        console.log('Fetching mentor sessions for user with role:', session.user.role);
        const [mentorSessions, menteeSessions] = await Promise.all([
          prisma.mentorSession.findMany({
            where: {
              mentorId: session.user.id,
              ...(status ? { status: status as any } : {})
            },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              scheduledAt: true,
              duration: true,
              meetingUrl: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
              mentor: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  mentorProfile: {
                    select: {
                      id: true,
                      bio: true,
                      specialties: true,
                      rating: true,
                      reviewCount: true,
                      createdAt: true,
                      updatedAt: true
                    }
                  }
                }
              },
              mentee: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  studentProfile: {
                    select: {
                      id: true,
                      bio: true,
                      createdAt: true,
                      updatedAt: true
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }),
          prisma.mentorSession.findMany({
            where: {
              menteeId: session.user.id,
              ...(status ? { status: status as any } : {})
            },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              scheduledAt: true,
              duration: true,
              meetingUrl: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
              mentor: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  mentorProfile: {
                    select: {
                      id: true,
                      bio: true,
                      specialties: true,
                      rating: true,
                      reviewCount: true,
                      createdAt: true,
                      updatedAt: true
                    }
                  }
                }
              },
              mentee: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  studentProfile: {
                    select: {
                      id: true,
                      bio: true,
                      createdAt: true,
                      updatedAt: true
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
        ]);

        const allSessions = [...mentorSessions, ...menteeSessions];
        console.log('Found mentor sessions:', allSessions.length);
        console.log('First session:', allSessions[0]);
        
        return NextResponse.json({ data: allSessions, error: null });
      } catch (error) {
        console.error('Error fetching mentor sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch mentor sessions' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error in mentorship API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      meetingUrl,
      menteeId,
      notes
    } = await req.json() as {
      mentorId: string;
      title: string;
      description: string | null;
      scheduledAt: string;
      duration: number;
      meetingUrl: string | null;
      menteeId: string;
      notes?: string | null;
    };
    
    // Validate required fields
    if (!mentorId || !title || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get or create student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    });

    if (!studentProfile) {
      // Create a default student profile if it doesn't exist
      await prisma.studentProfile.create({
        data: {
          userId: session.user.id,
          bio: 'Looking to learn and grow',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Use the newly created profile
      return NextResponse.json({
        error: 'Student profile created successfully. Please try again.'
      }, { status: 201 });
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
        status: 'SCHEDULED',
        scheduledAt,
        duration,
        meetingUrl,
        notes,
        mentorId: mentorId,
        menteeId: menteeId,
        mentor: {
          connect: { id: mentorId }
        },
        mentee: {
          connect: { id: menteeId }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        scheduledAt: true,
        duration: true,
        meetingUrl: true,
        notes: true,
        mentorId: true,
        menteeId: true,
        mentor: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            role: true,
            mentorProfile: {
              select: {
                id: true,
                bio: true,
                specialties: true,
                rating: true,
                reviewCount: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        },
        mentee: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            role: true,
            studentProfile: {
              select: {
                id: true,
                bio: true,
                learningGoals: true,
                interests: true,
                goals: true,
                preferredLearningStyle: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating mentor session:', error);
    return NextResponse.json(
      { error: 'Failed to create mentor session' },
      { status: 500 }
    );
  }
}
