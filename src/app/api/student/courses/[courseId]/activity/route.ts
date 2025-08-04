import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Activity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const userId = session.user.id;

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE'
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Fetch recent activities for the student in this course
    const activities: Activity[] = [];

    // Get recent lesson completions
    const recentLessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          module: {
            courseId
          }
        },
        completed: true
      },
      include: {
        lesson: {
          select: {
            title: true,
            module: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 5
    });

    // Add lesson completions to activities
    recentLessonProgress.forEach(progress => {
      if (progress.completedAt) {
        activities.push({
          type: 'lesson_completed',
          title: 'Lesson Completed',
          description: progress.lesson.title,
          timestamp: progress.completedAt.toISOString()
        });
      }
    });

    // Get recent project submissions
    const recentSubmissions = await prisma.projectSubmission.findMany({
      where: {
        userId,
        project: {
          courseId
        }
      },
      include: {
        project: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 3
    });

    // Add project submissions to activities
    recentSubmissions.forEach(submission => {
      activities.push({
        type: 'assignment_submitted',
        title: 'Assignment Submitted',
        description: submission.project.title,
        timestamp: submission.submittedAt.toISOString()
      });
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return the most recent 10 activities
    return NextResponse.json({
      activities: activities.slice(0, 10)
    });

  } catch (error) {
    console.error('Error fetching student activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}
