import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/projects/[projectId]/commits - Get commits for a project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Get commits for this project
    const commits = await prisma.codeCommit.findMany({
      where: { projectId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { commitDate: 'desc' }
    });

    return NextResponse.json({
      success: true,
      commits
    });

  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/commits - Create a new commit record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const { commitHash, message, branch, repositoryUrl, filesChanged, linesAdded, linesDeleted } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create commit record
    const commit = await prisma.codeCommit.create({
      data: {
        projectId,
        studentId: user.id,
        commitHash,
        message,
        branch: branch || 'main',
        repositoryUrl,
        filesChanged: filesChanged || 0,
        linesAdded: linesAdded || 0,
        linesDeleted: linesDeleted || 0,
        commitDate: new Date()
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      commit,
      message: 'Commit recorded successfully'
    });

  } catch (error) {
    console.error('Error creating commit:', error);
    return NextResponse.json(
      { error: 'Failed to record commit' },
      { status: 500 }
    );
  }
}
