import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma-extensions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they have mentor role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      select: { 
        id: true,
        rating: true,
        reviewCount: true
      }
    });

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get total mentees (accepted mentorship requests)
    const totalMentees = await prisma.mentorshipRequest.count({
      where: {
        mentorId: mentorProfile?.id,
        status: 'ACCEPTED'
      }
    });

    // Get mentorship requests for performance data
    const mentorshipRequests = await prisma.mentorshipRequest.findMany({
      where: {
        mentorId: mentorProfile?.id,
        status: 'ACCEPTED'
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get sessions data for this month
    const sessionsThisMonth = await prisma.mentorSession.findMany({
      where: {
        mentorId: user.id,
        scheduledAt: {
          gte: startOfMonth
        }
      },
      select: {
        id: true,
        status: true,
        duration: true,
        scheduledAt: true
      }
    });

    // Get sessions data for last month
    const sessionsLastMonth = await prisma.mentorSession.findMany({
      where: {
        mentorId: user.id,
        scheduledAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      select: {
        id: true,
        status: true,
        duration: true,
        scheduledAt: true
      }
    });

    // Get all sessions for the year for monthly breakdown
    const sessionsThisYear = await prisma.mentorSession.findMany({
      where: {
        mentorId: user.id,
        scheduledAt: {
          gte: startOfYear
        }
      },
      select: {
        id: true,
        status: true,
        duration: true,
        scheduledAt: true
      }
    });

    // Calculate real metrics from database
    const completedSessionsThisMonth = sessionsThisMonth.filter(s => s.status === 'COMPLETED').length;
    const completedSessionsLastMonth = sessionsLastMonth.filter(s => s.status === 'COMPLETED').length;
    
    const totalHoursThisMonth = sessionsThisMonth
      .filter(s => s.status === 'COMPLETED')
      .reduce((total, session) => total + (session.duration / 60), 0);
    
    const totalHoursLastMonth = sessionsLastMonth
      .filter(s => s.status === 'COMPLETED')
      .reduce((total, session) => total + (session.duration / 60), 0);

    // Calculate monthly breakdown for the year
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const month = index;
      const monthSessions = sessionsThisYear.filter(session => {
        const sessionMonth = session.scheduledAt.getMonth();
        return sessionMonth === month && session.status === 'COMPLETED';
      });
      
      return {
        month: new Date(now.getFullYear(), month, 1).toLocaleDateString('en-US', { month: 'short' }),
        sessions: monthSessions.length,
        hours: Math.round((monthSessions.reduce((total, s) => total + (s.duration / 60), 0)) * 10) / 10
      };
    });

    // Calculate growth percentages
    const sessionGrowth = completedSessionsLastMonth > 0 
      ? Math.round(((completedSessionsThisMonth - completedSessionsLastMonth) / completedSessionsLastMonth) * 100)
      : completedSessionsThisMonth > 0 ? 100 : 0;

    const hoursGrowth = totalHoursLastMonth > 0
      ? Math.round(((totalHoursThisMonth - totalHoursLastMonth) / totalHoursLastMonth) * 100)
      : totalHoursThisMonth > 0 ? 100 : 0;

    // Get upcoming sessions count
    const upcomingSessions = await prisma.mentorSession.count({
      where: {
        mentorId: user.id,
        scheduledAt: {
          gte: now
        },
        status: 'SCHEDULED'
      }
    });

    // Calculate session completion rate
    const totalScheduledSessions = sessionsThisMonth.length;
    const completionRate = totalScheduledSessions > 0 
      ? Math.round((completedSessionsThisMonth / totalScheduledSessions) * 100)
      : 0;

    // Session types breakdown (placeholder since we don't have types in schema)
    const sessionTypes = [
      { type: 'One-on-One', count: Math.floor(completedSessionsThisMonth * 0.6), percentage: 60 },
      { type: 'Career Planning', count: Math.floor(completedSessionsThisMonth * 0.25), percentage: 25 },
      { type: 'Project Review', count: Math.floor(completedSessionsThisMonth * 0.15), percentage: 15 }
    ];

    // Popular session times (placeholder)
    const popularTimes = [
      { time: '10:00 AM', count: Math.floor(completedSessionsThisMonth * 0.3) },
      { time: '2:00 PM', count: Math.floor(completedSessionsThisMonth * 0.25) },
      { time: '4:00 PM', count: Math.floor(completedSessionsThisMonth * 0.2) },
      { time: '6:00 PM', count: Math.floor(completedSessionsThisMonth * 0.25) }
    ];

    // Get real mentee progress from enrollments and course completions
    const menteeEnrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          instructorId: user.id
        },
        status: 'ACTIVE'
      },
      include: {
        user: {
          include: {
            studentProfile: {
              include: {
                mentorshipRequests: {
                  where: {
                    mentorId: mentorProfile?.id,
                    status: 'ACCEPTED'
                  }
                }
              }
            }
          }
        },
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      }
    });

    // Calculate mentee progress based on actual course completion
    const menteeProgress = {
      onTrack: 0,
      completing: 0, 
      needsAttention: 0,
      inactive: 0
    };

    // Calculate progress for each mentee
    for (const enrollment of menteeEnrollments) {
      if (enrollment.user.studentProfile?.mentorshipRequests.length > 0) {
        const totalLessons = enrollment.course.modules.reduce((sum: number, module: any) => sum + module.lessons.length, 0);
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            userId: enrollment.userId,
            lesson: {
              module: {
                courseId: enrollment.courseId
              }
            },
            completed: true
          }
        });
        
        const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        
        if (progressPercentage >= 80) {
          menteeProgress.onTrack++;
        } else if (progressPercentage >= 50) {
          menteeProgress.completing++;
        } else if (progressPercentage >= 20) {
          menteeProgress.needsAttention++;
        } else {
          menteeProgress.inactive++;
        }
      }
    }

    const averageSessionsPerMentee = totalMentees > 0 ? Math.round((completedSessionsThisMonth / totalMentees) * 10) / 10 : 0;
    
    // Calculate real course completion rate
    const totalCourseEnrollments = menteeEnrollments.length;
    const completedCourses = await prisma.enrollment.count({
      where: {
        course: {
          instructorId: user.id
        },
        status: 'COMPLETED',
        user: {
          studentProfile: {
            mentorshipRequests: {
              some: {
                mentorId: mentorProfile?.id,
                status: 'ACCEPTED'
              }
            }
          }
        }
      }
    });
    
    const courseCompletionRate = totalCourseEnrollments > 0 ? Math.round((completedCourses / totalCourseEnrollments) * 100) : 0;
    
    // Get real skills data from mentee course enrollments
    const skillsData = await prisma.course.findMany({
      where: {
        instructorId: user.id,
        enrollments: {
          some: {
            user: {
              studentProfile: {
                mentorshipRequests: {
                  some: {
                    mentorId: mentorProfile?.id,
                    status: 'ACCEPTED'
                  }
                }
              }
            }
          }
        }
      },
      select: {
        title: true,
        category: true,
        tags: true,
        enrollments: {
          where: {
            user: {
              studentProfile: {
                mentorshipRequests: {
                  some: {
                    mentorId: mentorProfile?.id,
                    status: 'ACCEPTED'
                  }
                }
              }
            }
          },
          select: {
            id: true
          }
        }
      }
    });

    // Extract and count skills from course tags and categories
    const skillCounts: { [key: string]: number } = {};
    skillsData.forEach(course => {
      // Count category as a skill
      if (course.category) {
        skillCounts[course.category] = (skillCounts[course.category] || 0) + course.enrollments.length;
      }
      // Count tags as skills
      if (course.tags) {
        course.tags.forEach((tag: string) => {
          skillCounts[tag] = (skillCounts[tag] || 0) + course.enrollments.length;
        });
      }
    });

    // Convert to array and sort by count
    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get most popular courses among mentees
    const mostPopularCourses = skillsData
      .map(course => ({
        course: course.title,
        enrolledMentees: course.enrollments.length
      }))
      .sort((a, b) => b.enrolledMentees - a.enrolledMentees)
      .slice(0, 5);

    // Get real mentees by career path from course categories
    const careerPathCounts: { [key: string]: number } = {};
    skillsData.forEach(course => {
      if (course.category) {
        careerPathCounts[course.category] = (careerPathCounts[course.category] || 0) + course.enrollments.length;
      }
    });

    const menteesByCareerPath = Object.entries(careerPathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);

    // Get real individual mentee performance data
    const menteePerformanceData = await Promise.all(
      mentorshipRequests.slice(0, 10).map(async (request) => {
        // Get mentee's course enrollments
        const menteeEnrollments = await prisma.enrollment.findMany({
          where: {
            userId: request.student.user.id,
            status: 'ACTIVE'
          },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                modules: {
                  include: {
                    lessons: true
                  }
                }
              }
            }
          }
        });

        // Calculate completed courses
        const completedCourses = await prisma.enrollment.count({
          where: {
            userId: request.student.user.id,
            status: 'COMPLETED'
          }
        });

        // Calculate average progress across all courses
        let totalProgress = 0;
        for (const enrollment of menteeEnrollments) {
          const totalLessons = enrollment.course.modules.reduce((sum: number, module: any) => sum + module.lessons.length, 0);
          const completedLessons = await prisma.lessonProgress.count({
            where: {
              userId: enrollment.userId,
              lesson: {
                module: {
                  courseId: enrollment.courseId
                }
              },
              completed: true
            }
          });
          totalProgress += totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        }
        const averageProgress = menteeEnrollments.length > 0 ? totalProgress / menteeEnrollments.length : 0;

        // Get mentee's sessions with this mentor
        const menteeSessions = await prisma.mentorSession.count({
          where: {
            mentorId: user.id,
            menteeId: request.student.user.id
          }
        });

        // Get last activity (last lesson progress or session)
        const lastLessonProgress = await prisma.lessonProgress.findFirst({
          where: {
            userId: request.student.user.id
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });

        const lastSession = await prisma.mentorSession.findFirst({
          where: {
            mentorId: user.id,
            menteeId: request.student.user.id
          },
          orderBy: {
            scheduledAt: 'desc'
          }
        });

        const lastActive = lastLessonProgress && lastSession 
          ? (lastLessonProgress.updatedAt > lastSession.scheduledAt ? lastLessonProgress.updatedAt : lastSession.scheduledAt)
          : (lastLessonProgress?.updatedAt || lastSession?.scheduledAt || new Date());

        // Calculate average grade from project submissions
        const projectGrades = await prisma.projectSubmission.findMany({
          where: {
            userId: request.student.user.id,
            grade: { not: null }
          },
          select: {
            grade: true,
            project: {
              select: {
                points: true
              }
            }
          }
        });

        let averageGrade = 'N/A';
        if (projectGrades.length > 0) {
          const totalPercentage = projectGrades.reduce((sum, submission) => {
            const percentage = submission.project.points > 0 ? (submission.grade! / submission.project.points) * 100 : 0;
            return sum + percentage;
          }, 0);
          const avgPercentage = totalPercentage / projectGrades.length;
          
          if (avgPercentage >= 90) averageGrade = 'A';
          else if (avgPercentage >= 80) averageGrade = 'B';
          else if (avgPercentage >= 70) averageGrade = 'C';
          else if (avgPercentage >= 60) averageGrade = 'D';
          else averageGrade = 'F';
        }

        return {
          menteeId: request.student.user.id,
          menteeName: request.student.user.name || 'Unknown',
          menteeAvatar: request.student.user.image,
          coursesCompleted: completedCourses,
          activeCourses: menteeEnrollments.length,
          lastActive: lastActive.toISOString(),
          averageGrade,
          totalSessions: menteeSessions,
          progress: Math.round(averageProgress)
        };
      })
    );

    // Get real weekly activity data from lesson progress and sessions
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get daily activity counts for the past week
    const dailyActivity = await Promise.all(
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(async (day, index) => {
        const dayStart = new Date(oneWeekAgo.getTime() + index * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        // Count lesson progress activities
        const lessonActivities = await prisma.lessonProgress.count({
          where: {
            updatedAt: {
              gte: dayStart,
              lt: dayEnd
            },
            user: {
              studentProfile: {
                mentorshipRequests: {
                  some: {
                    mentorId: mentorProfile?.id,
                    status: 'ACCEPTED'
                  }
                }
              }
            }
          }
        });
        
        // Count session activities
        const sessionActivities = await prisma.mentorSession.count({
          where: {
            mentorId: user.id,
            scheduledAt: {
              gte: dayStart,
              lt: dayEnd
            },
            status: 'COMPLETED'
          }
        });
        
        return {
          day,
          count: lessonActivities + sessionActivities
        };
      })
    );
    
    const menteeActivityByDay = dailyActivity;

    const analytics = {
      // Main analytics data expected by frontend
      totalMentees,
      activeMentees: totalMentees, // All accepted mentees are considered active
      menteeProgress,
      averageSessionsPerMentee,
      totalSessionsCompleted: completedSessionsThisMonth,
      upcomingSessions,
      courseCompletionRate,
      topSkills,
      menteeActivityByDay,
      mostPopularCourses,
      menteesByCareerPath,
      menteePerformanceData,
      
      // Additional overview data
      overview: {
        totalMentees,
        sessionsThisMonth: completedSessionsThisMonth,
        totalHoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
        upcomingSessions,
        averageRating: mentorProfile?.rating || 0,
        completionRate,
        sessionGrowth,
        hoursGrowth
      },
      monthlyData,
      sessionTypes,
      popularTimes,
      recentActivity: sessionsThisMonth
        .filter(s => s.status === 'COMPLETED')
        .slice(0, 5)
        .map(session => ({
          id: session.id,
          date: session.scheduledAt.toISOString(),
          duration: session.duration,
          type: 'One-on-One' // Placeholder
        }))
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching mentor analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
