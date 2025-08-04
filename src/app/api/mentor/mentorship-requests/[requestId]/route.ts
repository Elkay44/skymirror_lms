import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

interface RequestParams {
  params: Promise<{
    requestId: string;
  }>;
}

// GET - Fetch a specific mentorship request
export async function GET(
  _request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    // Get the mentorship request
    const mentorshipRequest = await prisma.mentorshipRequest.findFirst({
      where: {
        id: requestId,
        mentorId: mentorProfile.id
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!mentorshipRequest) {
      return NextResponse.json({ error: 'Mentorship request not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: mentorshipRequest.id,
      message: mentorshipRequest.message,
      status: mentorshipRequest.status,
      createdAt: mentorshipRequest.createdAt,
      student: {
        id: mentorshipRequest.student.user.id,
        name: mentorshipRequest.student.user.name,
        email: mentorshipRequest.student.user.email,
        image: mentorshipRequest.student.user.image
      }
    });
  } catch (error) {
    console.error('Error fetching mentorship request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentorship request' },
      { status: 500 }
    );
  }
}

// PATCH - Accept or reject a mentorship request
export async function PATCH(
  request: Request,
  { params }: RequestParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    // Validate status
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be ACCEPTED or REJECTED' }, { status: 400 });
    }

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true },
    });

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    // Get the mentorship request
    const mentorshipRequest = await prisma.mentorshipRequest.findFirst({
      where: {
        id: requestId,
        mentorId: mentorProfile.id,
        status: 'PENDING'
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!mentorshipRequest) {
      return NextResponse.json({ error: 'Pending mentorship request not found' }, { status: 404 });
    }

    // Update the mentorship request status
    const updatedRequest = await prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    // Create notification for the student
    const notificationMessage = status === 'ACCEPTED' 
      ? `Your mentorship request has been accepted by ${user.name}`
      : `Your mentorship request has been declined by ${user.name}`;

    await prisma.notification.create({
      data: {
        userId: mentorshipRequest.student.user.id,
        type: status === 'ACCEPTED' ? 'MENTORSHIP_ACCEPTED' : 'MENTORSHIP_REJECTED',
        title: status === 'ACCEPTED' ? 'Mentorship Request Accepted!' : 'Mentorship Request Update',
        message: notificationMessage,
        isRead: false,
        metadata: JSON.stringify({
          requestId: requestId,
          mentorId: mentorProfile.id,
          mentorName: user.name,
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined
        })
      }
    });

    return NextResponse.json({
      id: updatedRequest.id,
      status: updatedRequest.status,
      message: updatedRequest.message,
      createdAt: updatedRequest.createdAt,
      updatedAt: updatedRequest.updatedAt,
      student: {
        id: updatedRequest.student.user.id,
        name: updatedRequest.student.user.name,
        email: updatedRequest.student.user.email,
        image: updatedRequest.student.user.image
      }
    });
  } catch (error) {
    console.error('Error updating mentorship request:', error);
    return NextResponse.json(
      { error: 'Failed to update mentorship request' },
      { status: 500 }
    );
  }
}
