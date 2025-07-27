import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/projects/submissions/instructor - Get all submissions for an instructor
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const role = session.user.role;
    
    // Check if the user is an instructor, admin, or mentor
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN' && role !== 'MENTOR') {
      return NextResponse.json({ error: 'Forbidden - Access denied' }, { status: 403 });
    }
    
    // Define the submission type
    type SubmissionWithDetails = {
      id: string;
      projectId: string;
      studentId: string;
      submissionNotes: string | null;
      attachments: string[];
      status: string;
      grade: number | null;
      reviewNotes: string | null;
      submittedAt: Date | null;
      reviewedAt: Date | null;
      reviewerId: string | null;
      createdAt: Date;
      updatedAt: Date;
      project: {
        id: string;
        title: string;
        course: {
          id: string;
          title: string;
        };
      };
      student: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
      reviewer?: {
        id: string;
        name: string | null;
        email: string | null;
      } | null;
    };
    
    // For mentors, get active mentees from mentor sessions
    if (role === 'MENTOR') {
      // Get active mentor sessions
      const activeSessions = await prisma.mentorSession.findMany({
        where: {
          mentorId: userId,
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS']
          },
          scheduledAt: {
            gte: new Date()
          }
        },
        select: {
          menteeId: true
        }
      });
      
      if (activeSessions.length === 0) {
        return NextResponse.json({ submissions: [] });
      }
      
      const menteeIds = activeSessions.map(session => session.menteeId);
      
      // Get submissions from mentees
      const submissions = await prisma.projectSubmission.findMany({
        where: {
          studentId: { in: menteeIds }
        },
        include: {
          project: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });
      
      return NextResponse.json({ submissions });
    }
    
    // For instructors, get submissions from their courses
    if (role === 'INSTRUCTOR') {
      const submissions = await prisma.projectSubmission.findMany({
        where: {
          project: {
            course: {
              instructorId: userId
            }
          }
        },
        include: {
          project: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });
      
      return NextResponse.json({ submissions });
    }
    
    // For admins, get all submissions
    if (role === 'ADMIN') {
      const submissions = await prisma.projectSubmission.findMany({
        include: {
          project: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });
      
      return NextResponse.json({ submissions });
    }
    
    return NextResponse.json({ submissions: [] });
    
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
