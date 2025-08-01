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

    try {
      const { title, description, deadline, targetCompletion, progress } = await request.json();

      if (!title) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }

      // Validate deadline and targetCompletion are valid dates if provided
      if (deadline && isNaN(new Date(deadline).getTime())) {
        return NextResponse.json(
          { error: 'Invalid deadline date format' },
          { status: 400 }
        );
      }

      if (targetCompletion && isNaN(new Date(targetCompletion).getTime())) {
        return NextResponse.json(
          { error: 'Invalid target completion date format' },
          { status: 400 }
        );
      }

      // Validate progress is a number between 0 and 100
      if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
        return NextResponse.json(
          { error: 'Progress must be a number between 0 and 100' },
          { status: 400 }
        );
      }

      const goal = await prisma.learningGoal.create({
        data: {
          title,
          description: description || null,
          deadline: deadline ? new Date(deadline) : null,
          targetCompletion: targetCompletion ? new Date(targetCompletion) : null,
          progress: progress || 0,
          userId: session.user.id,
        },
      });

      return NextResponse.json(goal, { status: 201 });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating learning goal:', {
          message: error.message,
          stack: error.stack
        });
        
        if (error.message.includes('Unique constraint failed')) {
          return NextResponse.json(
            { error: 'A goal with this title already exists' },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to create learning goal' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating learning goal:', error);
    return NextResponse.json(
      { error: 'Failed to create learning goal' },
      { status: 500 }
    );
  }
}
