import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET a specific note
export async function GET(
  request: Request,
  { params }: { params: { courseId: string; lessonId: string; noteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert userId to integer
    const userId = parseInt(session.user.id);
    const { noteId } = params;

    // Find the note
    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if the user owns the note
    if (note.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to access this note' }, { status: 403 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

// PUT update a note
export async function PUT(
  request: Request,
  { params }: { params: { courseId: string; lessonId: string; noteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert userId to integer
    const userId = parseInt(session.user.id);
    const { noteId } = params;
    const { content } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    // Find the note
    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteId,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if the user owns the note
    if (existingNote.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to update this note' }, { status: 403 });
    }

    // Update the note
    const updatedNote = await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        content,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE a note
export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string; lessonId: string; noteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert userId to integer
    const userId = parseInt(session.user.id);
    const { noteId } = params;

    // Find the note
    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteId,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if the user owns the note
    if (existingNote.userId !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to delete this note' }, { status: 403 });
    }

    // Delete the note
    await prisma.note.delete({
      where: {
        id: noteId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
