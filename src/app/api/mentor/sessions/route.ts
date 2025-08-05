import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch all sessions for the logged-in mentor
export async function GET(_req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only mentors can access this endpoint
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Only mentors can access this resource.' }, { status: 403 });
    }
    
    // Fetch sessions from database
    const mentorSessions = await prisma.mentorSession.findMany({
      where: {
        mentorId: session.user.id
      },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });
    
    // Transform data for frontend
    const transformedSessions = mentorSessions.map(session => ({
      id: session.id,
      menteeId: session.menteeId,
      menteeName: session.mentee.name || 'Unknown',
      menteeAvatar: session.mentee.image,
      date: session.scheduledAt.toISOString(),
      duration: session.duration,
      topic: session.title,
      type: 'ONE_ON_ONE', // Default type since we don't have this field in schema
      status: session.status,
      notes: session.notes || ''
    }));
    
    return NextResponse.json({ sessions: transformedSessions });
  } catch (error) {
    console.error('Error fetching mentor sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new mentorship session
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only mentors can access this endpoint
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Only mentors can access this resource.' }, { status: 403 });
    }
    
    // Parse request body
    const data = await req.json();
    const { menteeId, date, topic, notes, duration } = data;
    
    // Validate required fields
    if (!menteeId || !date || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate that the mentee exists
    const mentee = await prisma.user.findUnique({
      where: { id: menteeId },
      select: { id: true, name: true, image: true }
    });
    
    if (!mentee) {
      return NextResponse.json({ error: 'Mentee not found' }, { status: 404 });
    }
    
    // Create session in database
    const newSession = await prisma.mentorSession.create({
      data: {
        mentorId: session.user.id,
        menteeId,
        title: topic,
        description: notes || '',
        scheduledAt: new Date(date),
        duration: duration || 30,
        status: 'SCHEDULED',
        notes: notes || ''
      },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    // Transform for frontend
    const transformedSession = {
      id: newSession.id,
      menteeId: newSession.menteeId,
      menteeName: newSession.mentee.name || 'Unknown',
      menteeAvatar: newSession.mentee.image,
      date: newSession.scheduledAt.toISOString(),
      duration: newSession.duration,
      topic: newSession.title,
      type: 'ONE_ON_ONE',
      status: newSession.status,
      notes: newSession.notes || '',
      mentorId: newSession.mentorId
    };
    
    return NextResponse.json({
      success: true,
      message: 'Session scheduled successfully',
      session: transformedSession
    });
  } catch (error) {
    console.error('Error creating mentorship session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
