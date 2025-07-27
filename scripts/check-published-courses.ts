import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPublishedCourses() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Successfully connected to database');

    // Check if we have any courses at all
    const totalCourses = await prisma.course.count();
    console.log(`Total courses in database: ${totalCourses}`);

    if (totalCourses === 0) {
      console.log('No courses found in the database');
      return;
    }

    // Check for published courses
    const publishedCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 most recent
    });

    console.log('\n📊 Published Courses Report:');
    console.table(
      publishedCourses.map((course) => ({
        ID: course.id,
        Title: course.title,
        Published: course.isPublished ? '✅' : '❌',
        'Created At': course.createdAt.toISOString().split('T')[0],
        'Updated At': course.updatedAt.toISOString().split('T')[0],
        'Modules': course._count.modules,
        'Enrollments': course._count.enrollments,
      })));

    // If no published courses, show message
    if (publishedCourses.length === 0) {
      console.log('\nNo published courses found.');
    }

  } catch (error) {
    console.error('Error checking published courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkPublishedCourses()
  .catch((e) => {
    console.error('Script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
