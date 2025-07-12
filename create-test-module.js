/**
 * Create a test module for debugging
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestModule() {
  try {
    console.log('Creating a test module...');
    
    // Course ID to test with (replace with actual ID from your database)
    const courseId = process.argv[2] || 'cmbybxzhm0000u0pbc9sm560b';
    
    console.log(`Using courseId: ${courseId}`);
    
    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true }
    });
    
    if (!course) {
      console.error(`❌ Course not found with ID: ${courseId}`);
      return;
    }
    
    console.log(`✅ Found course: ${course.title} (ID: ${course.id})`);
    
    // Create a test module
    const testModule = await prisma.module.create({
      data: {
        title: 'Test Module',
        description: 'This is a test module created for debugging',
        order: 1,
        courseId: courseId
      }
    });
    
    console.log('✅ Successfully created test module:', testModule);
    
    console.log('\nTo test lesson creation, run:');
    console.log(`node test-lesson-create.js ${course.id} ${testModule.id}`);
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Error details:');
    console.error('- Name:', error.name);
    console.error('- Message:', error.message);
    
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

createTestModule();
