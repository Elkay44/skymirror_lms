import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
          userId: Number(session.user.id)
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
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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
