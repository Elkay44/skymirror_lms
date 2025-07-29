import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/learning-goals - Get all learning goals for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await prisma.learningGoal.findMany({
      where: { userId: Number(session.user.id) },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching learning goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning goals' },
      { status: 500 }
    );
  }
}

// POST /api/learning-goals - Create a new learning goal
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, deadline, targetCompletion, progress } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const goal = await prisma.learningGoal.create({
      data: {
        title,
        description: description || null,
        deadline: deadline ? new Date(deadline) : null,
        targetCompletion: targetCompletion || null,
        progress: progress || 0,
        userId: session.user.id.toString(),
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating learning goal:', error);
    return NextResponse.json(
      { error: 'Failed to create learning goal' },
      { status: 500 }
    );
  }
}
