/**
 * Find valid course and module IDs for testing
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findIds() {
  try {
    console.log('Looking for valid IDs...');
    
    // Get first course
    const course = await prisma.course.findFirst({
      select: {
        id: true,
        title: true
      }
    });
    
    if (!course) {
      console.log('No courses found in database');
      return;
    }
    
    console.log(`Found course: "${course.title}" (ID: ${course.id})`);
    
    // Find a module in this course
    const module = await prisma.module.findFirst({
      where: {
        courseId: course.id
      },
      select: {
        id: true,
        title: true
      }
    });
    
    if (!module) {
      console.log(`No modules found in course ${course.id}`);
      return;
    }
    
    console.log(`Found module: "${module.title}" (ID: ${module.id})`);
    console.log('\nTo test lesson creation, run:');
    console.log(`node test-lesson-create.js ${course.id} ${module.id}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findIds();
