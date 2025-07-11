import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function calculateCourseProgress(enrollmentId: string): Promise<number> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
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

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get all lessons in the course
  const lessons = enrollment.course.modules.flatMap(module => module.lessons);
  const totalLessons = lessons.length;

  if (totalLessons === 0) {
    return 0;
  }

  // Get completed lessons for the user
  const completedLessons = await prisma.lessonProgress.count({
    where: {
      userId: enrollment.userId,
      lessonId: {
        in: lessons.map(lesson => lesson.id)
      },
      status: 'COMPLETED'
    }
  });

  // Calculate progress percentage
  const progress = (completedLessons / totalLessons) * 100;
  return Math.min(progress, 100); // Cap at 100%
}
