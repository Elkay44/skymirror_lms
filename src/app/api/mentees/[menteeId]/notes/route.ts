/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT /api/mentees/[menteeId]/notes - Update mentee notes
export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ menteeId: string }> }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Extract menteeId from params
    const { menteeId } = await params;
    
    // Check if the user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    const isMentor = user?.role === 'MENTOR' || user?.role === 'ADMIN';
    
    if (!isMentor) {
      return NextResponse.json(
        { error: 'Access denied. Only mentors can update mentee notes.' }, 
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const { notes } = await request.json();
    
    if (typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'Invalid notes format' }, 
        { status: 400 }
      );
    }
    
    // First, perform the upsert operation
    await prisma.menteeNotes.upsert({
      where: {
        menteeId_mentorId: {
          menteeId,
          mentorId: session.user.id
        }
      },
      update: { notes },
      create: {
        menteeId,
        mentorId: session.user.id,
        notes
      }
    });
    
    // Then fetch the updated note with related data
    const updatedNote = await prisma.menteeNotes.findFirst({
      where: {
        menteeId,
        mentorId: session.user.id
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating mentee notes:', error);
    return NextResponse.json(
      { error: 'Failed to update mentee notes' },
      { status: 500 }
    );
  }
}

// GET /api/mentees/[menteeId]/notes - Get mentee notes
export async function GET(
  _request: Request, 
  { params }: { params: Promise<{ menteeId: string }> }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Extract menteeId from params
    const { menteeId } = await params;
    
    // Check if the user is a mentor or the mentee themselves
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    const isMentor = user?.role === 'MENTOR' || user?.role === 'ADMIN';
    const isMentee = session.user.id === menteeId;
    
    if (!isMentor && !isMentee) {
      return NextResponse.json(
        { error: 'Access denied. Only mentors or the mentee can view these notes.' }, 
        { status: 403 }
      );
    }
    
    // Get mentee notes
    const notes = await prisma.menteeNotes.findMany({
      where: { 
        menteeId,
        ...(isMentee ? { isVisibleToMentee: true } : {})
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching mentee notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentee notes' },
      { status: 500 }
    );
  }
}
