import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type MentorshipWithMentorAndCheckIns = {
  id: string;
  mentor: {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  };
  checkIns: Array<{
    id: string;
    scheduledFor: Date;
    completedAt: Date | null;
  }>;
  [key: string]: any;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const mentorships = await prisma.mentorship.findMany({
      where: {
        student: {
          userId: session.user.id
        },
        status: 'ACTIVE'
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        checkIns: {
          orderBy: {
            scheduledFor: 'asc'  // Get the next upcoming check-in
          },
          where: {
            scheduledFor: {
              gte: new Date()  // Only future check-ins
            }
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as unknown as MentorshipWithMentorAndCheckIns[];

    // Transform the data to include next session date
    const formattedMentorships = mentorships.map(mentorship => ({
      ...mentorship,
      nextSessionDate: mentorship.checkIns.length > 0 ? mentorship.checkIns[0].scheduledFor : null
    }));

    return NextResponse.json(formattedMentorships);
  } catch (error) {
    console.error('Error fetching user mentors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentors' },
      { status: 500 }
    );
  }
}
