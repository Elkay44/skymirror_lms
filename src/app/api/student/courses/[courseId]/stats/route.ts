import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Calculate study streak (consecutive days with activity)
    const calculateStudyStreak = async () => {
      const today = new Date();
      let streak = 0;
      let currentDate = new Date(today);
      
      // Check each day going backwards
      for (let i = 0; i < 30; i++) { // Check last 30 days max
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Check if there was any activity on this day
        const hasActivity = await prisma.lessonProgress.findFirst({
          where: {
            userId,
            lesson: {
              module: {
                courseId
              }
            },
            updatedAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        });

        if (hasActivity) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // If today has no activity, don't break the streak yet
          if (i === 0) {
            currentDate.setDate(currentDate.getDate() - 1);
            continue;
          }
          break;
        }
      }
      
      return streak;
    };

    // Calculate time spent (estimate based on lesson durations and completions)
    const calculateTimeSpent = async () => {
      const completedLessons = await prisma.lessonProgress.findMany({
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
              duration: true
            }
          }
        }
      });

      const totalMinutes = completedLessons.reduce((sum, progress) => {
        return sum + (progress.lesson.duration || 0);
      }, 0);

      return Math.round((totalMinutes / 60) * 10) / 10; // Convert to hours, round to 1 decimal
    };

    // Get assignment statistics
    const getAssignmentStats = async () => {
      const totalAssignments = await prisma.project.count({
        where: {
          courseId,
          isPublished: true
        }
      });

      const completedAssignments = await prisma.projectSubmission.count({
        where: {
          userId,
          project: {
            courseId
          }
        }
      });

      const pendingAssignments = totalAssignments - completedAssignments;

      return {
        totalAssignments,
        assignmentsCompleted: completedAssignments,
        pendingAssignments: Math.max(0, pendingAssignments)
      };
    };

    // Get current grade from marks
    const getCurrentGrade = async () => {
      try {
        // Calculate grade based on project submissions
        const submissions = await prisma.projectSubmission.findMany({
          where: {
            userId,
            project: {
              courseId
            }
          },
          include: {
            project: {
              select: {
                pointsValue: true
              }
            }
          }
        });

        if (submissions.length === 0) return 'N/A';

        const totalPoints = submissions.reduce((sum, sub) => sum + (sub.project.pointsValue || 0), 0);
        const earnedPoints = submissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
        
        if (totalPoints === 0) return 'N/A';
        
        const percentage = (earnedPoints / totalPoints) * 100;
        
        if (percentage >= 97) return 'A+';
        if (percentage >= 93) return 'A';
        if (percentage >= 90) return 'A-';
        if (percentage >= 87) return 'B+';
        if (percentage >= 83) return 'B';
        if (percentage >= 80) return 'B-';
        if (percentage >= 77) return 'C+';
        if (percentage >= 73) return 'C';
        if (percentage >= 70) return 'C-';
        if (percentage >= 67) return 'D+';
        if (percentage >= 65) return 'D';
        return 'F';
      } catch (error) {
        console.error('Error calculating grade:', error);
        return 'N/A';
      }
    };

    // Get forum activity count
    const getForumStats = async () => {
      // Since forums might not be implemented yet, return 0
      return {
        activeForums: 0,
        totalPosts: 0
      };
    };

    // Execute all calculations in parallel
    const [studyStreak, timeSpent, assignmentStats, currentGrade, forumStats] = await Promise.all([
      calculateStudyStreak(),
      calculateTimeSpent(),
      getAssignmentStats(),
      getCurrentGrade(),
      getForumStats()
    ]);

    return NextResponse.json({
      studyStreak,
      timeSpent,
      currentGrade,
      ...assignmentStats,
      ...forumStats
    });

  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats data' },
      { status: 500 }
    );
  }
}
