import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Define base types for the mentorship data
type User = {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
};

type StudentProfile = {
  id: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  interests: string | null;
  goals: string | null;
  preferredLearningStyle: string | null;
  careerPathId: string | null;
};

type MentorProfile = {
  id: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  bio: string | null;
  expertise: string[];
  availability: string | null;
  isActive: boolean;
};

type Conversation = {
  id: string;
  lastActivity: Date;
  _count: { messages: number };
};

type CheckIn = {
  id: string;
  scheduledFor: Date;
  completedAt: Date | null;
  progress: string | null;
  summary: string | null;
  mentorshipId: string;
  createdAt: Date;
  updatedAt: Date;
  nextSteps: string | null;
  mood: string | null;
};

type MentorshipBase = {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  studentId: string;
  mentorId: string;
};

type MentorshipWithRelations = MentorshipBase & {
  student: StudentProfile;
  mentor: MentorProfile;
  conversations: Conversation[];
  checkIns: CheckIn[];
  _count: {
    conversations: number;
    checkIns: number;
  };
  userRole?: 'mentor' | 'student';
};

type FormattedMentorship = {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
  userRole: 'mentor' | 'student';
  otherParty: {
    id: string;
    userId: number;
    name: string | null;
    email: string;
    image: string | null;
  };
  lastConversation: {
    id: string;
    lastActivity: Date;
    messageCount: number;
  } | null;
  lastCheckIn: {
    scheduledFor: Date;
    completed: boolean;
  } | null;
  conversationCount: number;
  checkInCount: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * GET /api/mentorships
 * Get all mentorships for the current user (either as mentor or student)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role') as 'mentor' | 'student' | null; // 'mentor' or 'student'
    
    // Check if user has a mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: Number(session.user.id) },
      select: { id: true }
    });
    
    // Check if user has a student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: Number(session.user.id) },
      select: { id: true }
    });
    
    // Build query conditions based on role
    let mentorships: any[] = [];
    
    // Handle filtering based on role
    if (role === 'mentor' && mentorProfile) {
      // Get mentorships where user is the mentor
      mentorships = await prisma.mentorship.findMany({
        where: {
          mentorId: mentorProfile.id,
          ...(status ? { status } : {})
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              }
            }
          },
          conversations: {
            select: {
              id: true,
              lastActivity: true,
              _count: { select: { messages: true } }
            },
            orderBy: { lastActivity: 'desc' },
            take: 1
          },
          checkIns: {
            orderBy: { scheduledFor: 'desc' },
            take: 1
          },
          _count: {
            select: {
              conversations: true,
              checkIns: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { updatedAt: 'desc' }
        ]
      });
    } else if (role === 'student' && studentProfile) {
      // Get mentorships where user is the student
      mentorships = await prisma.mentorship.findMany({
        where: {
          studentId: studentProfile.id,
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
                  image: true,
                }
              }
            }
          },
          conversations: {
            select: {
              id: true,
              lastActivity: true,
              _count: { select: { messages: true } }
            },
            orderBy: { lastActivity: 'desc' },
            take: 1
          },
          checkIns: {
            orderBy: { scheduledFor: 'desc' },
            take: 1
          },
          _count: {
            select: {
              conversations: true,
              checkIns: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { updatedAt: 'desc' }
        ]
      });
    } else {
      // If no specific role requested, get all mentorships for the user
      const mentorMentorships = mentorProfile ? await prisma.mentorship.findMany({
        where: {
          mentorId: mentorProfile.id,
          ...(status ? { status } : {})
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              }
            }
          },
          conversations: {
            select: {
              id: true,
              lastActivity: true,
              _count: { select: { messages: true } }
            },
            orderBy: { lastActivity: 'desc' },
            take: 1
          },
          _count: {
            select: {
              conversations: true,
              checkIns: true
            }
          }
        }
      }) : [];
      
      const studentMentorships = studentProfile ? await prisma.mentorship.findMany({
        where: {
          studentId: studentProfile.id,
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
                  image: true,
                }
              }
            }
          },
          conversations: {
            select: {
              id: true,
              lastActivity: true,
              _count: { select: { messages: true } }
            },
            orderBy: { lastActivity: 'desc' },
            take: 1
          },
          _count: {
            select: {
              conversations: true,
              checkIns: true
            }
          }
        }
      }) : [];
      
      // Combine both types of mentorships
      mentorships = [
        ...mentorMentorships.map(m => ({ ...m, userRole: 'mentor' })),
        ...studentMentorships.map(m => ({ ...m, userRole: 'student' }))
      ];
      
      // Sort by updated date
      mentorships.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    
    // Format the response for easier consumption
    interface FormattedMentorship {
      id: string;
      status: string;
      startDate: Date | null;
      endDate: Date | null;
      notes: string | null;
      userRole: 'mentor' | 'student';
      otherParty: {
        id: string;
        userId: string;
        name: string;
        email: string;
        image: string;
      };
      lastConversation: {
        id: string;
        lastActivity: Date;
        messageCount: number;
      } | null;
      lastCheckIn: {
        scheduledFor: Date;
        completed: boolean;
      } | null;
      conversationCount: number;
      checkInCount: number;
      createdAt: Date;
      updatedAt: Date;
    }
    
    const formattedMentorships = mentorships.map((mentorship: any): FormattedMentorship => {
      // Determine user role based on the presence of student or mentor in the query
      const isMentor = role === 'mentor' || (mentorship as any).userRole === 'mentor';
      
      // Safely access the other party (mentor or student) based on user role
      const otherParty = isMentor
        ? {
            id: mentorship.student.id,
            userId: mentorship.student.user.id,
            name: mentorship.student.user.name,
            email: mentorship.student.user.email,
            image: mentorship.student.user.image,
          }
        : {
            id: mentorship.mentor.id,
            userId: mentorship.mentor.user.id,
            name: mentorship.mentor.user.name,
            email: mentorship.mentor.user.email,
            image: mentorship.mentor.user.image,
          };
      
      // Format the response object with proper type safety
      const result: FormattedMentorship = {
        id: mentorship.id,
        status: mentorship.status,
        startDate: mentorship.startDate,
        endDate: mentorship.endDate,
        notes: mentorship.notes || null,
        userRole: isMentor ? 'mentor' : 'student',
        otherParty,
        lastConversation: mentorship.conversations?.[0] ? {
          id: mentorship.conversations[0].id,
          lastActivity: mentorship.conversations[0].lastActivity,
          messageCount: mentorship.conversations[0]._count?.messages || 0
        } : null,
        lastCheckIn: mentorship.checkIns?.[0] ? {
          scheduledFor: mentorship.checkIns[0].scheduledFor,
          completed: !!mentorship.checkIns[0].completedAt
        } : null,
        conversationCount: mentorship._count?.conversations || 0,
        checkInCount: mentorship._count?.checkIns || 0,
        createdAt: mentorship.createdAt,
        updatedAt: mentorship.updatedAt
      };
      
      return result;
    });
    
    return NextResponse.json(formattedMentorships);
  } catch (error) {
    console.error('Error fetching mentorships:', error);
    
    // Return more detailed error information in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : 'Unknown error occurred'
      : 'Failed to fetch mentorships';
      
    return NextResponse.json(
      { 
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentorships
 * Request a new mentorship with a mentor
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { mentorId, notes } = await req.json() as { mentorId: string; notes?: string };
    
    if (!mentorId) {
      return NextResponse.json(
        { error: 'Mentor ID is required' },
        { status: 400 }
      );
    }
    
    // Get or create student profile
    let studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: Number(session.user.id) }
    });
    
    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({
        data: { userId: Number(session.user.id) }
      });
    }
    
    // Check if mentor exists
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorId }
    });
    
    if (!mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }
    
    // Check if mentorship already exists
    const existingMentorship = await prisma.mentorship.findUnique({
      where: {
        mentorId_studentId: {
          mentorId,
          studentId: studentProfile.id
        }
      }
    });
    
    if (existingMentorship) {
      return NextResponse.json(
        { error: 'Mentorship already exists', mentorship: existingMentorship },
        { status: 400 }
      );
    }
    
    // Create new mentorship
    const mentorship = await prisma.mentorship.create({
      data: {
        mentorId,
        studentId: studentProfile.id,
        status: 'PENDING',
        ...(notes ? { notes } : {})
      }
    });
    
    // Create initial conversation
    const conversation = await prisma.conversation.create({
      data: {
        mentorshipId: mentorship.id,
        topic: 'Introduction'
      }
    });
    
    // Add system message to the conversation
    await prisma.message.create({
      data: {
        conversation: { connect: { id: conversation.id } },
        sender: { connect: { id: Number(session.user.id) } },
        content: `${session.user.name || 'A student'} has requested mentorship. Please review and respond.`,
        isRead: false
      }
    });
    
    // Send welcome message from student if notes provided
    if (notes) {
      await prisma.message.create({
        data: {
          conversation: { connect: { id: conversation.id } },
          sender: { connect: { id: Number(session.user.id) } },
          content: notes,
          isRead: false
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      mentorship,
      conversation
    });
  } catch (error) {
    console.error('Error creating mentorship:', error);
    return NextResponse.json(
      { error: 'Failed to create mentorship' },
      { status: 500 }
    );
  }
}
