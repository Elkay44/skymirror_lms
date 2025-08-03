/* eslint-disable */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/courses/[courseId]/versions/[versionId] - Get specific version details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; versionId: string }> }
) {
  try {
    const { courseId, versionId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if user is instructor for this course or admin
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const isAdmin = session.user.role === 'ADMIN';
    const isInstructor = course.instructorId === userId.toString();
    
    if (!isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: 'Unauthorized to view this version' },
        { status: 403 }
      );
    }
    
    // Get the version
    const version = await prisma.courseVersion.findUnique({
      where: { 
        id: versionId,
        courseId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(version);
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}
