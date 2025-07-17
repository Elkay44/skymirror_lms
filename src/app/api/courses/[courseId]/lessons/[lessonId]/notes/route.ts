import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET all notes for a specific lesson
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert userId to integer
    const userId = parseInt(session.user.id);
    const { courseId, lessonId } = params;

    // Verify user has access to this course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        userId,
      },
    });

    if (!enrollment && session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Get all notes for this lesson
    const notes = await prisma.note.findMany({
      where: {
        lessonId,
        userId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST create a new note for a lesson
export async function POST(
  request: Request,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert userId to integer
    const userId = parseInt(session.user.id);
    const { courseId, lessonId } = params;
    const { content, timestamp } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    // Verify user has access to this course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        userId,
      },
    });

    if (!enrollment && session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Create the note
    const note = await prisma.note.create({
      data: {
        content,
        timestamp,
        lessonId,
        userId,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
