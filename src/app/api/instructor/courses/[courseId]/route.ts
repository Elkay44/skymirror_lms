import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/instructor/courses/[courseId] - Get specific course for instructor
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Get the user session to check if they're authenticated
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is an instructor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    if (!user || user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Only instructors can access this endpoint' },
        { status: 403 }
      );
    }
    
    // Get the course and verify it belongs to this instructor
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        instructorId: userId 
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        modules: {
          orderBy: {
            order: 'asc',
          },
        },
        enrollments: true,
        projects: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            submissions: {
              select: {
                id: true,
                status: true,
                grade: true,
              },
            },
          },
        },
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have access to it' },
        { status: 404 }
      );
    }
    
    // Calculate course statistics
    const totalStudents = course.enrollments.length;
    const totalModules = course.modules.length;
    const totalProjects = course.projects?.length || 0;
    const totalLessons = 0; // Simplified for now
    
    // Calculate completion rate based on actual course progress
    // TODO: Calculate based on actual lesson/module completion when progress tracking is implemented
    const completionRate = 0; // Will be calculated from real progress data
    
    // Get real recent activity - for now showing enrollment-based activity
    const recentActivity = course.enrollments.slice(0, 3).map((enrollment: any, index: number) => ({
      id: index + 1,
      type: 'enrollment',
      title: 'New student enrolled',
      date: new Date(enrollment.createdAt || Date.now()).toLocaleDateString(),
      user: enrollment.user?.name || 'Anonymous Student',
    }));
    
    // If no enrollments, show placeholder
    if (recentActivity.length === 0) {
      recentActivity.push({
        id: 1,
        type: 'info',
        title: 'Course created',
        date: new Date(course.createdAt).toLocaleDateString(),
        user: course.instructor?.name || 'Instructor',
      });
    }
    
    // Transform the course data
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      shortDescription: (course as any).shortDescription || course.description,
      imageUrl: course.image || '/course-placeholder.jpg',
      isPublished: course.isPublished,
      status: (course as any).status || 'DRAFT',
      price: course.price,
      level: course.level,
      difficulty: (course.level || 'BEGINNER') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
      category: course.category,
      language: course.language,
      totalHours: course.totalHours,
      averageRating: course.averageRating || 0,
      totalReviews: course.totalReviews,
      enrollmentCount: totalStudents,
      modulesCount: totalModules,
      lessonsCount: totalLessons,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      instructor: {
        name: course.instructor?.name || 'Unknown',
        avatar: course.instructor?.image || '/default-avatar.png',
        title: 'Instructor',
      },
      stats: {
        totalStudents,
        activeStudents: totalStudents, // TODO: Calculate based on recent activity when activity tracking is implemented
        projectCompletion: completionRate,
        avgProjectScore: '0%', // TODO: Calculate from actual project grades
        mentorSessions: 0, // TODO: Calculate from actual mentorship session data
        peerReviews: 0, // TODO: Calculate from actual peer review data
        codeCommits: 0, // TODO: Calculate from actual code commit data
        projectMilestones: totalModules,
      },
      projectsCount: totalProjects,
      completionRate,
      recentActivity,
      modules: course.modules.map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        order: module.order,
        lessons: 0, // TODO: Calculate from actual lessons when lesson system is implemented
        duration: null, // TODO: Calculate from actual lesson durations
        completed: false, // TODO: Calculate based on instructor's module completion tracking
      })),
      projects: course.projects.map((project: any) => {
        const totalSubmissions = project.submissions.length;
        const completedSubmissions = project.submissions.filter((s: any) => s.status === 'SUBMITTED' || s.status === 'GRADED').length;
        const progress = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;
        
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          dueDate: project.dueDate,
          pointsValue: project.pointsValue,
          isPublished: project.isPublished,
          progress: progress,
          totalSubmissions,
          completedSubmissions,
          averageGrade: project.submissions.length > 0 
            ? project.submissions.reduce((acc: number, s: any) => acc + (s.grade || 0), 0) / project.submissions.length
            : 0,
        };
      }),
    };
    
    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error('Error fetching instructor course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course data' },
      { status: 500 }
    );
  }
}
