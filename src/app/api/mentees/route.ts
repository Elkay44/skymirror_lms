/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch mentees assigned to the logged-in mentor
export async function GET(req: NextRequest) {
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
    
    // Fetch mentees assigned to this mentor from the database
    const mentees = await prisma.user.findMany({
      where: { 
        mentorId: session.user.id,
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        timezone: true,
        lastActive: true,
        // Include related data as needed
        _count: {
          select: {
            mentorSessions: {
              where: { status: 'COMPLETED' }
            },
            learningGoals: {
              where: { isActive: true }
            },
            assignments: {
              where: { status: 'PENDING' }
            }
          }
        },
        mentorSessions: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: {
            id: true,
            title: true,
            status: true,
            scheduledAt: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(mentees);
  } catch (error) {
    console.error('Error fetching mentees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentees' },
      { status: 500 }
    );
  }
}

// POST: Add a new mentee or update mentorship details
export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Only mentors can add/update mentees
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Access denied. Only mentors can manage mentees.' }, 
        { status: 403 }
      );
    }
    
    // Parse the request body
    const { menteeId, action, data } = await req.json();
    
    if (!menteeId || !action) {
      return NextResponse.json(
        { error: 'Mentee ID and action are required' }, 
        { status: 400 }
      );
    }
    
    // Handle different actions
    switch (action) {
      case 'ADD_NOTE':
        if (!data.notes) {
          return NextResponse.json(
            { error: 'Notes are required' }, 
            { status: 400 }
          );
        }
        
        // Add a note for the mentee
        const note = await prisma.mentorNote.create({
          data: {
            mentorId: session.user.id,
            menteeId,
            notes: data.notes,
            isVisibleToMentee: data.isVisibleToMentee ?? false,
            category: data.category || 'GENERAL'
          }
        });
        
        return NextResponse.json(note);
        
      case 'UPDATE_LEARNING_PATH':
        if (!data.learningPath) {
          return NextResponse.json(
            { error: 'Learning path data is required' }, 
            { status: 400 }
          );
        }
        
        // Update the mentee's learning path
        const updatedMentee = await prisma.user.update({
          where: { 
            id: menteeId,
            role: 'STUDENT'
          },
          data: {
            learningPath: data.learningPath,
            learningPathUpdatedAt: new Date()
          },
          select: {
            id: true,
            name: true,
            learningPath: true,
            learningPathUpdatedAt: true
          }
        });
        
        return NextResponse.json(updatedMentee);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in mentee management:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
