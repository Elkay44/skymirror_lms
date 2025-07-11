import { PrismaClient } from '@prisma/client';
import { calculateCourseProgress } from '@/lib/progress';

const prisma = new PrismaClient();

describe('Progress Tracking', () => {
  let userId: string;
  let courseId: string;
  let enrollmentId: string;
  let moduleId: string;
  let lessonIds: string[] = [];

  beforeAll(async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: 'student@test.com',
        name: 'Test Student',
        role: 'STUDENT'
      }
    });
    userId = user.id;

    const course = await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'Test Description',
        instructorId: userId, // Using same user as instructor for simplicity
      }
    });
    courseId = course.id;

    const module = await prisma.module.create({
      data: {
        title: 'Test Module',
        description: 'Test Module Description',
        courseId,
        order: 1
      }
    });
    moduleId = module.id;

    // Create 3 lessons
    for (let i = 1; i <= 3; i++) {
      const lesson = await prisma.lesson.create({
        data: {
          title: `Lesson ${i}`,
          content: `Content ${i}`,
          moduleId,
          order: i
        }
      });
      lessonIds.push(lesson.id);
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE'
      }
    });
    enrollmentId = enrollment.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.lessonProgress.deleteMany({
      where: {
        userId
      }
    });
    await prisma.lesson.deleteMany({
      where: {
        moduleId
      }
    });
    await prisma.module.deleteMany({
      where: {
        id: moduleId
      }
    });
    await prisma.enrollment.deleteMany({
      where: {
        id: enrollmentId
      }
    });
    await prisma.course.deleteMany({
      where: {
        id: courseId
      }
    });
    await prisma.user.deleteMany({
      where: {
        id: userId
      }
    });
    await prisma.$disconnect();
  });

  it('should start with 0% progress', async () => {
    const progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBe(0);
  });

  it('should calculate correct progress when lessons are completed', async () => {
    // Complete first lesson
    await prisma.lessonProgress.create({
      data: {
        lessonId: lessonIds[0],
        userId,
        status: 'COMPLETED'
      }
    });

    let progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBeCloseTo(33.33, 2); // 1/3 lessons completed

    // Complete second lesson
    await prisma.lessonProgress.create({
      data: {
        lessonId: lessonIds[1],
        userId,
        status: 'COMPLETED'
      }
    });

    progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBeCloseTo(66.67, 2); // 2/3 lessons completed

    // Complete third lesson
    await prisma.lessonProgress.create({
      data: {
        lessonId: lessonIds[2],
        userId,
        status: 'COMPLETED'
      }
    });

    progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBe(100); // All lessons completed
  });

  it('should not count in-progress lessons as completed', async () => {
    // Reset progress
    await prisma.lessonProgress.deleteMany({
      where: {
        userId
      }
    });

    // Mark one lesson as in-progress
    await prisma.lessonProgress.create({
      data: {
        lessonId: lessonIds[0],
        userId,
        status: 'IN_PROGRESS'
      }
    });

    const progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBe(0); // In-progress lessons don't count towards completion
  });
});
