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
    
    // Check if the user is an instructor or admin
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN' && role !== 'MENTOR') {
      return NextResponse.json({ error: 'Forbidden - Instructor access required' }, { status: 403 });
    }
    
    // Get all submissions for courses taught by this instructor
    // For mentors, this would show submissions from their mentees
    let submissions = [];
    
    if (role === 'INSTRUCTOR') {
      submissions = await prisma.projectSubmission.findMany({
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
          }
        },
        orderBy: [
          { submittedAt: 'desc' }
        ]
      });
    } else if (role === 'MENTOR') {
      // Get mentor profile
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId },
        include: {
          mentorships: {
            where: { status: 'ACTIVE' },
            include: {
              student: true
            }
          }
        }
      });
      
      if (!mentorProfile) {
        return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
      }
      
      // Get all student IDs this mentor is responsible for
      const studentIds = mentorProfile.mentorships.map(m => m.student.userId);
      
      // Get submissions from these students
      submissions = await prisma.projectSubmission.findMany({
        where: {
          studentId: { in: studentIds }
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
          }
        },
        orderBy: [
          { submittedAt: 'desc' }
        ]
      });
    } else if (role === 'ADMIN') {
      // Admins can see all submissions
      submissions = await prisma.projectSubmission.findMany({
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
          }
        },
        orderBy: [
          { submittedAt: 'desc' }
        ]
      });
    }
    
    return NextResponse.json({
      submissions,
      totalCount: submissions.length
    });
  } catch (error) {
    console.error('Error fetching instructor submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
