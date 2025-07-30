import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { menteeId } = await req.json();
    if (!menteeId) {
      return NextResponse.json({ error: 'Missing menteeId' }, { status: 400 });
    }

    // Check if profile already exists
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId: menteeId }
    });

    if (existingProfile) {
      return NextResponse.json(existingProfile);
    }

    // Create new profile
    const profile = await prisma.studentProfile.create({
      data: {
        userId: menteeId,
        bio: 'Looking to learn and grow',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in profile creation:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
