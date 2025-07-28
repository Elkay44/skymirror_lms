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
        role: 'STUDENT',
        points: 0,
        level: 1,
        needsOnboarding: false
      }
    });
    userId = user.id;

    const course = await prisma.course.create({
      data: {
        title: 'Test Course',
        slug: 'test-course',
        description: 'Test Description',
        image: 'https://example.com/thumbnail.jpg',
        isPublished: true,
        price: 0,
        category: 'TEST',
        level: 'BEGINNER',
        language: 'en',
        totalHours: 1,
        instructorId: userId // Using same user as instructor for simplicity
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
          description: `Description for lesson ${i}`,
          moduleId,
          order: i,
          isPublished: true,
          duration: 10
        }
      });
      lessonIds.push(lesson.id);
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE',
        progress: 0,
        enrolledAt: new Date()
      }
    });
    enrollmentId = enrollment.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.lessonView.deleteMany({
      where: {
        userId
      }
    });
    await prisma.lesson.deleteMany({
      where: {
        id: { in: lessonIds }
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

  it('should calculate correct progress when lessons are viewed', async () => {
    // View first lesson
    await prisma.lessonView.create({
      data: {
        lessonId: lessonIds[0],
        userId,
        viewCount: 1
      }
    });

    let progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBe(33); // 1/3 lessons viewed (33%)

    // View second lesson
    await prisma.lessonView.create({
      data: {
        lessonId: lessonIds[1],
        userId,
        viewCount: 1
      }
    });

    progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBe(67); // 2/3 lessons viewed (67%)

    // View third lesson
    await prisma.lessonView.create({
      data: {
        lessonId: lessonIds[2],
        userId,
        viewCount: 1
      }
    });

    progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBe(100); // All lessons viewed (100%)
  });

  it('should handle multiple views of the same lesson', async () => {
    // Reset views
    await prisma.lessonView.deleteMany({
      where: {
        userId
      }
    });

    // View the same lesson multiple times
    for (let i = 0; i < 3; i++) {
      await prisma.lessonView.upsert({
        where: {
          id: `${userId}-${lessonIds[0]}` // Create a unique ID for the view
        },
        update: {
          viewCount: { increment: 1 },
          lastViewed: new Date()
        },
        create: {
          id: `${userId}-${lessonIds[0]}`,
          lessonId: lessonIds[0],
          userId,
          viewCount: 1,
          lastViewed: new Date()
        }
      });
    }

    const progress = await calculateCourseProgress(enrollmentId);
    expect(progress).toBe(33); // Still only 1/3 lessons viewed
  });
});
