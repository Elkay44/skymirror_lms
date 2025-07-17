import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({
        error: 'Authentication required'
      }, {
        status: 401
      });
    }

    const courses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            userId: parseInt(userId),
            status: 'ACTIVE'
          }
        }
      },
      include: {
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                order: true,
                progress: {
                  where: {
                    userId: parseInt(userId)
                  },
                  select: {
                    completed: true,
                    completedAt: true
                  }
                }
              }
            }
          }
        },
        enrollments: {
          where: {
            userId: parseInt(userId)
          },
          select: {
            status: true,
            completedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match our Course type
    const transformedCourses = courses.map(course => ({
      ...course,
      modules: course.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          completed: lesson.progress?.[0]?.completed || false,
          completedAt: lesson.progress?.[0]?.completedAt || null,
          duration: lesson.duration || 0
        }))
      })),
      isEnrolled: true,
      enrollmentStatus: course.enrollments[0]?.status || 'ACTIVE'
    }));

    return NextResponse.json({
      courses: transformedCourses
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return NextResponse.json({
      error: 'Failed to fetch enrolled courses'
    }, {
      status: 500
    });
  }
}
