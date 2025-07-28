import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculates the course progress based on viewed lessons
 * @param enrollmentId - The ID of the enrollment to calculate progress for
 * @returns A number between 0 and 100 representing the completion percentage
 */
export async function calculateCourseProgress(enrollmentId: string): Promise<number> {
  // First get the enrollment with user ID
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      course: {
        select: {
          modules: {
            select: {
              id: true,
              lessons: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!enrollment || !enrollment.userId) {
    throw new Error('Enrollment or user not found');
  }

  // Get all lesson IDs in the course
  const lessonIds = enrollment.course.modules.flatMap(
    (module: { lessons: { id: string }[] }) => module.lessons.map(lesson => lesson.id)
  );
  
  const totalLessons = lessonIds.length;

  if (totalLessons === 0) {
    return 0;
  }

  // Get viewed lessons for the user
  const viewedLessons = await prisma.lessonView.findMany({
    where: {
      userId: enrollment.userId,
      lessonId: {
        in: lessonIds
      }
    },
    select: {
      lessonId: true
    }
  });

  // Count unique viewed lessons
  const viewedLessonIds = new Set(viewedLessons.map(view => view.lessonId));
  const viewedCount = viewedLessonIds.size;

  // Calculate progress percentage
  const progress = (viewedCount / totalLessons) * 100;
  return Math.min(Math.round(progress), 100); // Cap at 100% and round to nearest integer
}
