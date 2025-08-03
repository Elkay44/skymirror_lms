import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const { mentorId } = await params;

  if (!mentorId) {
    return NextResponse.json({ error: 'Missing mentorId parameter' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mentorProfile = await prisma.mentorProfile.findFirst({
      where: {
        userId: mentorId
      },
      include: {
        user: true
      }
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    return NextResponse.json(mentorProfile);
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    return NextResponse.json({ error: 'Failed to fetch mentor profile' }, { status: 500 });
  }
}
