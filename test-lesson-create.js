/**
 * Test script for debugging lesson creation
 * Run with: node test-lesson-create.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugLessonCreation() {
  try {
    console.log('Starting lesson creation debug test...');
    
    // Course ID and Module ID to test with (replace with actual IDs from your database)
    const courseId = process.argv[2] || 'COURSE_ID_HERE';
    const moduleId = process.argv[3] || 'MODULE_ID_HERE';
    
    console.log(`Testing with courseId: ${courseId}, moduleId: ${moduleId}`);
    
    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, instructorId: true }
    });
    
    if (!course) {
      console.error(`❌ Course not found with ID: ${courseId}`);
      return;
    }
    
    console.log(`✅ Found course: ${course.title} (ID: ${course.id})`);
    
    // Verify the module exists and belongs to the course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId: courseId
      },
      select: { id: true, title: true }
    });
    
    if (!module) {
      console.error(`❌ Module not found with ID: ${moduleId} in course: ${courseId}`);
      return;
    }
    
    console.log(`✅ Found module: ${module.title} (ID: ${module.id})`);
    
    // Get the highest lesson order in this module
    const highestOrderLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    
    const nextOrder = highestOrderLesson ? highestOrderLesson.order + 1 : 1;
    console.log(`Next lesson order will be: ${nextOrder}`);
    
    // Attempt to create a test lesson
    console.log('Attempting to create test lesson...');
    const testLesson = await prisma.lesson.create({
      data: {
        title: 'Debug Test Lesson',
        description: 'This is a test lesson created for debugging',
        content: 'Test content',
        videoUrl: null,
        duration: 10,
        order: nextOrder,
        moduleId: moduleId
      }
    });
    
    console.log('✅ Successfully created lesson:', testLesson);
    
    // Clean up - delete the test lesson unless --keep flag is provided
    if (!process.argv.includes('--keep')) {
      console.log('Cleaning up test lesson...');
      await prisma.lesson.delete({
        where: { id: testLesson.id }
      });
      console.log('✅ Test lesson deleted');
    } else {
      console.log('Test lesson kept in database');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Error details:');
    console.error('- Name:', error.name);
    console.error('- Message:', error.message);
    console.error('- Stack:', error.stack);
    
    if (error.code) {
      console.error('- Error code:', error.code);
    }
    
    if (error.meta) {
      console.error('- Metadata:', JSON.stringify(error.meta, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugLessonCreation();
