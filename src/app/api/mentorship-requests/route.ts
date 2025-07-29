import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MentorSessionStatus } from '@/types/mentorship';

interface MentorshipRequestData {
  mentorId: string;
  message: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await req.json() as MentorshipRequestData;
    
    // Validate required fields
    if (!data.mentorId || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if mentor exists
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: data.mentorId },
      include: { user: true }
    });
    
    if (!mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }
    
    // Create mentorship request
    const request = await prisma.mentorshipRequest.create({
      data: {
        message: data.message,
        status: 'PENDING' as MentorSessionStatus,
        mentor: { connect: { id: data.mentorId } },
        student: { connect: { userId: session.user.id } }
      },
      include: {
        mentor: {
          include: { user: true }
        },
        student: {
          include: { user: true }
        }
      }
    });

    // Create notification for mentor
    await prisma.notification.create({
      data: {
        type: 'MENTORSHIP_REQUEST',
        content: `New mentorship request from ${request.student.user.name}`,
        userId: mentorProfile.userId,
        data: {
          requestId: request.id,
          mentorId: data.mentorId,
          studentId: request.student.id
        }
      }
    });

    // Format response
    return NextResponse.json({
      id: request.id,
      mentor: {
        id: request.mentor.id,
        name: request.mentor.user.name,
        image: request.mentor.user.image
      },
      status: request.status,
      message: request.message,
      createdAt: request.createdAt
    });
  } catch (error) {
    console.error('Error creating mentorship request:', error);
    return NextResponse.json(
      { error: 'Failed to create mentorship request' },
      { status: 500 }
    );
  }
}
