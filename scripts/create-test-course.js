// Script to check for courses and create a test course if none exists
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking for existing courses...');
  
  const courseCount = await prisma.course.count();
  console.log(`Found ${courseCount} courses in the database.`);
  
  if (courseCount === 0) {
    console.log('No courses found. Creating a test course...');
    
    // First ensure we have a user with instructor role
    let instructor = await prisma.user.findFirst({
      where: {
        role: 'INSTRUCTOR'
      }
    });
    
    if (!instructor) {
      console.log('No instructor found. Creating a test instructor...');
      instructor = await prisma.user.create({
        data: {
          name: 'Test Instructor',
          email: 'instructor@example.com',
          hashedPassword: '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXX', // placeholder, not a real hash
          role: 'INSTRUCTOR',
          emailVerified: new Date()
        }
      });
      console.log('Created instructor:', instructor.id);
    }
    
    // Create the test course
    const course = await prisma.course.create({
      data: {
        title: 'Test Course',
        shortDescription: 'A test course for development',
        description: 'This is a test course created automatically to help with development and testing.',
        difficulty: 'BEGINNER',
        isPublished: true,
        price: 0,
        language: 'English',
        instructorId: instructor.id
      }
    });
    
    console.log('Created test course with ID:', course.id);
    
    // Create a test module
    const module = await prisma.module.create({
      data: {
        title: 'Getting Started',
        description: 'Introduction to the course',
        order: 1,
        courseId: course.id
      }
    });
    
    console.log('Created test module with ID:', module.id);
    
    return { course, module };
  } else {
    const courses = await prisma.course.findMany({
      include: {
        modules: true
      }
    });
    
    console.log('Existing courses:');
    courses.forEach(course => {
      console.log(`- ${course.id}: ${course.title} (${course.modules.length} modules)`);
    });
    
    return courses;
  }
}

main()
  .then(async (result) => {
    console.log('Operation completed successfully.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
