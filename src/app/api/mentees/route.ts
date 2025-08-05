/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch all students (mentees)
export async function GET(_req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' }, 
        { status: 401 }
      );
    }
    
    // Check if user is a mentor
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Only mentors can access this endpoint' }, 
        { status: 403 }
      );
    }
    
    // Fetch all students
    const students = await prisma.user.findMany({
      where: { 
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      orderBy: { name: 'asc' }
    });

    // Transform the data to match the frontend's expected format
    const mentees = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      avatar: student.image || '/avatars/default.png'
    }));

    return NextResponse.json({ mentees });
  } catch (error) {
    console.error('Error fetching mentees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentees' },
      { status: 500 }
    );
  }
}

// POST: Add a note for a mentee
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' }, 
        { status: 401 }
      );
    }
    
    // Check if user is a mentor
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Only mentors can access this endpoint' }, 
        { status: 403 }
      );
    }
    
    const { menteeId, note } = await req.json();
    
    if (!menteeId) {
      return NextResponse.json(
        { error: 'Mentee ID is required' }, 
        { status: 400 }
      );
    }
    
    // Check if mentee exists and is a student
    const mentee = await prisma.user.findUnique({
      where: { id: menteeId, role: 'STUDENT' },
      select: { 
        id: true,
        name: true,
        email: true 
      }
    });
    
    if (!mentee) {
      return NextResponse.json(
        { error: 'Mentee not found or is not a student' }, 
        { status: 404 }
      );
    }
    
    // In a real application, you would save the note to the database here
    // For now, we'll just return the mentee info with the note
    return NextResponse.json({
      success: true,
      mentee: {
        ...mentee,
        note: note || 'No note provided'
      }
    });
  } catch (error) {
    console.error('Error in mentee management:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
