import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify the course belongs to this instructor
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructorId: userId 
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have access to it' },
        { status: 404 }
      );
    }

    // Get project submissions which represent "commits" in our system
    // In a real system, this would connect to a Git provider API
    const projectSubmissions = await prisma.projectSubmission.findMany({
      where: {
        project: {
          courseId: courseId,
        },
      },
      include: {
        user: {
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
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Transform submissions into commit-like data
    const commits = projectSubmissions.map((submission) => {
      // Generate mock commit data based on submission
      const commitId = submission.id.slice(0, 7);
      const message = `Submit ${submission.project.title}`;
      const author = submission.user.name || 'Unknown Student';
      const timestamp = formatTimeAgo(submission.submittedAt);
      
      // Mock git-like data (in a real system, this would come from Git API)
      const mockChanges = Math.floor(Math.random() * 20) + 1;
      const mockAdditions = Math.floor(Math.random() * 500) + 50;
      const mockDeletions = Math.floor(Math.random() * 200) + 10;

      return {
        id: commitId,
        message,
        author,
        branch: 'main', // Default branch
        timestamp,
        changes: mockChanges,
        additions: mockAdditions,
        deletions: mockDeletions,
        pullRequest: undefined, // No PR system in our LMS
      };
    });

    return NextResponse.json({
      commits,
      totalCommits: commits.length,
    });
  } catch (error) {
    console.error('Error fetching course commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits data' },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} weeks ago`;
}
