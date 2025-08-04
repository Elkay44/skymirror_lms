import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; projectId: string }> }
) {
  const { courseId, projectId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify the course belongs to this instructor or student is enrolled
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        OR: [
          { instructorId: userId },
          { enrollments: { some: { userId: userId } } }
        ]
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have access to it' },
        { status: 404 }
      );
    }

    // Verify the project belongs to this course
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        courseId: courseId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get all commits for this project
    const commits = await (prisma as any).codeCommit.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        commitDate: 'desc',
      },
    });

    // Format the response data
    const formattedCommits = commits.map((commit: any) => ({
      id: commit.id,
      commitHash: commit.commitHash,
      message: commit.message,
      branch: commit.branch,
      repositoryUrl: commit.repositoryUrl,
      filesChanged: commit.filesChanged,
      linesAdded: commit.linesAdded,
      linesDeleted: commit.linesDeleted,
      commitDate: commit.commitDate.toISOString(),
      student: {
        id: commit.student.id,
        name: commit.student.name,
        email: commit.student.email,
        image: commit.student.image,
      },
      project: commit.project,
    }));

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
        },
        commits: formattedCommits,
        totalCommits: formattedCommits.length,
      },
    });
  } catch (error) {
    console.error('Error fetching project commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project commits' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; projectId: string }> }
) {
  const { courseId, projectId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Verify the student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: courseId,
        userId: userId,
      },
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // Verify the project belongs to this course
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        courseId: courseId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const { 
      commitHash, 
      message, 
      branch = 'main', 
      repositoryUrl, 
      filesChanged = 0, 
      linesAdded = 0, 
      linesDeleted = 0,
      commitDate 
    } = body;

    if (!commitHash || !message) {
      return NextResponse.json(
        { error: 'Commit hash and message are required' },
        { status: 400 }
      );
    }

    // Create the code commit
    const commit = await (prisma as any).codeCommit.create({
      data: {
        projectId: projectId,
        studentId: userId,
        commitHash,
        message,
        branch,
        repositoryUrl,
        filesChanged: parseInt(filesChanged) || 0,
        linesAdded: parseInt(linesAdded) || 0,
        linesDeleted: parseInt(linesDeleted) || 0,
        commitDate: commitDate ? new Date(commitDate) : new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Code commit recorded successfully',
      data: {
        id: commit.id,
        commitHash: commit.commitHash,
        message: commit.message,
        branch: commit.branch,
        repositoryUrl: commit.repositoryUrl,
        filesChanged: commit.filesChanged,
        linesAdded: commit.linesAdded,
        linesDeleted: commit.linesDeleted,
        commitDate: commit.commitDate.toISOString(),
        student: commit.student,
        project: commit.project,
      },
    });
  } catch (error) {
    console.error('Error creating code commit:', error);
    
    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'This commit has already been recorded' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to record code commit' },
      { status: 500 }
    );
  }
}
