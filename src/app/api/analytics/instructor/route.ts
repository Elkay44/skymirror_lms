import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/analytics/instructor - Instructor analytics dashboard
export async function GET(req: NextRequest) {
  try {
    // Authenticate and get instructor user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true },
    });
    if (!user || user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all courses taught by the instructor
    const courses = await prisma.course.findMany({
      where: { instructorId: user.id },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        enrollments: { select: { id: true, completedAt: true } },
        
        isPublished: true,
        updatedAt: true,
        
        quizzes: {
          select: {
            id: true,
            title: true,
            attempts: { select: { score: true, isPassed: true } },
          },
        },
      },
    });

    // Aggregate course stats
    const recentCourses = (courses as any[] || []).slice(0, 3).map((course: any) => {
      const enrollments = Array.isArray(course.enrollments) ? course.enrollments : [];
      const reviews = Array.isArray(course.reviews) ? course.reviews : [];
      const enrollmentCount = enrollments.length;
      const completionRate =
        enrollmentCount === 0
          ? 0
          : Math.round(
              (enrollments.filter((e: any) => e.completedAt).length / enrollmentCount) * 100
            );
      const averageRating =
        reviews.length === 0
          ? 0
          : (
              reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
              reviews.length
            ).toFixed(1);
      return {
        id: course.id,
        title: course.title,
        imageUrl: course.imageUrl,
        enrollmentCount,
        completionRate,
        averageRating: Number(averageRating),
        isPublished: course.isPublished,
        revenue: typeof course.revenue === 'number' ? course.revenue : 0,
        updatedAt: course.updatedAt,
      };
    });

    // Aggregate quiz stats
    const quizPerformance = (courses as any[] || [])
      .flatMap((course: any) => {
        const quizzes = Array.isArray(course.quizzes) ? course.quizzes : [];
        return quizzes.map((quiz: any) => {
          const attempts = Array.isArray(quiz.attempts) ? quiz.attempts : [];
          const attemptsCount = attempts.length;
          const averageScore =
            attemptsCount === 0
              ? 0
              : Math.round(
                  attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / attemptsCount
                );
          const passRate =
            attemptsCount === 0
              ? 0
              : Math.round(
                  (attempts.filter((a: any) => a.isPassed).length / attemptsCount) * 100
                );
          return {
            quizId: quiz.id,
            quizTitle: quiz.title,
            courseId: course.id,
            courseTitle: course.title,
            averageScore,
            attemptsCount,
            passRate,
          };
        });
      });

    // Aggregate overall stats
    const totalStudents = (courses as any[] || []).reduce((sum: number, c: any) => sum + (Array.isArray(c.enrollments) ? c.enrollments.length : 0), 0);
    const totalCourses = (courses as any[] || []).length;
    const totalRevenue = (courses as any[] || []).reduce((sum: number, c: any) => sum + (typeof c.revenue === 'number' ? c.revenue : 0), 0);
    const newEnrollments = (courses as any[] || [])
      .reduce((sum: number, c: any) => sum + ((Array.isArray(c.enrollments) ? c.enrollments : []).filter((e: any) => {
        const enrolledDate = e.completedAt ? new Date(e.completedAt) : null;
        return enrolledDate && enrolledDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }).length), 0);
    const completionRate =
      totalStudents === 0
        ? 0
        : Math.round(
            ((courses as any[] || []).reduce((sum: number, c: any) => sum + ((Array.isArray(c.enrollments) ? c.enrollments : []).filter((e: any) => e.completedAt).length), 0) /
              totalStudents) *
              100
          );
    const allRatings = (courses as any[] || []).flatMap((c: any) => (Array.isArray(c.reviews) ? c.reviews : []).map((r: any) => r.rating || 0));
    const averageRating =
      allRatings.length === 0
        ? 0
        : (
            allRatings.reduce((sum: number, r: number) => sum + r, 0) / allRatings.length
          ).toFixed(1);

    // Recent student activity (last 5)
    const recentActivity: any[] = [];
    // TODO: Implement student activity aggregation if you have an activity/audit log

    // Upcoming sessions (placeholder)
    const upcomingSessions: any[] = [];
    // TODO: Implement if you have sessions/office hours in your schema

    return NextResponse.json({
      instructorName: user.name || '',
      recentCourses: Array.isArray(recentCourses) ? recentCourses : [],
      recentActivity: Array.isArray(recentActivity) ? recentActivity : [],
      upcomingSessions: Array.isArray(upcomingSessions) ? upcomingSessions : [],
      quizPerformance: Array.isArray(quizPerformance) ? quizPerformance : [],
      overallStats: {
        totalStudents: typeof totalStudents === 'number' ? totalStudents : 0,
        totalCourses: typeof totalCourses === 'number' ? totalCourses : 0,
        totalRevenue: typeof totalRevenue === 'number' ? totalRevenue : 0,
        newEnrollments: typeof newEnrollments === 'number' ? newEnrollments : 0,
        completionRate: typeof completionRate === 'number' ? completionRate : 0,
        averageRating: Number(averageRating) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching instructor analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch instructor analytics' }, { status: 500 });
  }
}
