/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch detailed information about a specific mentee
export async function GET(
  _req: Request, 
  { params }: { params: Promise<{ menteeId: string }> }
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
    
    const { menteeId } = await params;
    
    if (!menteeId) {
      return NextResponse.json(
        { error: 'Mentee ID is required' }, 
        { status: 400 }
      );
    }
    
    // Fetch mentee details from the database
    const mentee = await prisma.user.findUnique({
      where: { 
        id: menteeId,
        role: 'STUDENT' // Ensure we're only fetching students
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentProfile: {
          select: {
            bio: true,
            learningGoals: true
          }
        },
        createdAt: true,
        updatedAt: true,
        // Include related data as needed
      }
    });

    if (!mentee) {
      return NextResponse.json(
        { error: 'Mentee not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(mentee);
  } catch (error) {
    console.error('Error fetching mentee details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentee details' },
      { status: 500 }
    );
  }
}

// PATCH: Update specific information about a mentee
export async function PATCH(
  req: Request, 
  { params }: { params: Promise<{ menteeId: string }> }
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
    
    // Only mentors can update mentee information
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Access denied. Only mentors can update mentee information.' }, 
        { status: 403 }
      );
    }
    
    const { menteeId } = await params;
    
    if (!menteeId) {
      return NextResponse.json(
        { error: 'Mentee ID is required' }, 
        { status: 400 }
      );
    }
    
    // Parse the request body
    const updates = await req.json();
    
    // Define allowed fields that can be updated
    const allowedUpdates = [
      'notes', 
      'learningPath', 
      'status', 
      'progress', 
      'nextSteps',
      'strengths',
      'areasForImprovement'
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
    
    // Update mentee information in the database
    const updatedMentee = await prisma.user.update({
      where: { 
        id: menteeId,
        role: 'STUDENT' // Ensure we're only updating students
      },
      data: filteredUpdates,
      select: {
        id: true,
        name: true,
        email: true,
        // Include other fields that were updated
        ...Object.keys(filteredUpdates).reduce((obj, key) => {
          obj[key] = true;
          return obj;
        }, {} as Record<string, boolean>)
      }
    });
    
    // Log the update activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_MENTEE_INFO',
        entityType: 'USER',
        entityId: menteeId,
        details: {
          updatedFields: Object.keys(filteredUpdates)
        }
      }
    });
    
    return NextResponse.json(updatedMentee);
  } catch (error) {
    console.error('Error updating mentee information:', error);
    return NextResponse.json(
      { error: 'Failed to update mentee information' },
      { status: 500 }
    );
  }
}
