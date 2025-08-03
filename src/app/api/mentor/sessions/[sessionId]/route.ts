/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch a specific session by ID
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Only mentors can access this endpoint
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Access denied. Only mentors can access this resource.' }, 
        { status: 403 }
      );
    }
    
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' }, 
        { status: 400 }
      );
    }
    
    // Fetch the session from the database
    const mentorSession = await prisma.mentorSession.findUnique({
      where: { 
        id: sessionId,
        mentorId: session.user.id // Ensure the session belongs to this mentor
      },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        meeting: {
          select: {
            id: true,
            joinUrl: true,
            startUrl: true,
            meetingId: true,
            password: true
          }
        }
      }
    });
    
    if (!mentorSession) {
      return NextResponse.json(
        { error: 'Session not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(mentorSession);
  } catch (error) {
    console.error('Error fetching mentor session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PATCH: Update a specific session (change status, update details, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Only mentors can update sessions
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Access denied. Only mentors can update sessions.' }, 
        { status: 403 }
      );
    }
    
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' }, 
        { status: 400 }
      );
    }
    
    // Parse the request body
    const updates = await req.json();
    
    // Define allowed fields that can be updated
    const allowedUpdates = [
      'title',
      'description',
      'scheduledAt',
      'duration',
      'status',
      'meetingLink',
      'notes',
      'recordingUrl'
    ];
    
    // Filter updates to only include allowed fields
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as Record<string, any>);
    
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' }, 
        { status: 400 }
      );
    }
    
    // Update the session in the database
    const updatedSession = await prisma.mentorSession.update({
      where: { 
        id: sessionId,
        mentorId: session.user.id // Ensure the session belongs to this mentor
      },
      data: filteredUpdates,
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Log the update activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_MENTOR_SESSION',
        entityType: 'MENTOR_SESSION',
        entityId: sessionId,
        details: {
          updatedFields: Object.keys(filteredUpdates)
        }
      }
    });
    
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating mentor session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel/delete a session
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Only mentors can delete sessions
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Access denied. Only mentors can delete sessions.' }, 
        { status: 403 }
      );
    }
    
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' }, 
        { status: 400 }
      );
    }
    
    // Delete the session from the database
    await prisma.mentorSession.delete({
      where: { 
        id: sessionId,
        mentorId: session.user.id, // Ensure the session belongs to this mentor
        status: { 
          in: ['PENDING', 'SCHEDULED'] // Only allow deleting pending/scheduled sessions
        }
      }
    });
    
    // Log the deletion activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_MENTOR_SESSION',
        entityType: 'MENTOR_SESSION',
        entityId: sessionId,
        details: {}
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mentor session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
