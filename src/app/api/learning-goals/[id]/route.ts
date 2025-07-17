import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/learning-goals/[id] - Get a specific learning goal
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goal = await prisma.learningGoal.findUnique({
      where: { id: params.id, userId: Number(session.user.id) },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Learning goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error fetching learning goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning goal' },
      { status: 500 }
    );
  }
}

// PATCH /api/learning-goals/[id] - Update a learning goal
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, deadline, targetCompletion, progress } = await request.json();

    const goal = await prisma.learningGoal.update({
      where: { id: params.id, userId: Number(session.user.id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(targetCompletion !== undefined && { targetCompletion }),
        ...(progress !== undefined && { progress }),
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating learning goal:', error);
    return NextResponse.json(
      { error: 'Failed to update learning goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/learning-goals/[id] - Delete a learning goal
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.learningGoal.delete({
      where: { id: params.id, userId: Number(session.user.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting learning goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete learning goal' },
      { status: 500 }
    );
  }
}
