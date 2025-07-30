import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const { hash } = bcrypt;
const prisma = new PrismaClient();

// Helper function to generate random dates within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Sample course data
const sampleCourses = [
  {
    title: 'Introduction to Web Development',
    description: 'Learn the basics of web development with HTML, CSS, and JavaScript.',
    shortDescription: 'Start your journey in web development',
    difficulty: 'BEGINNER',
    category: 'Web Development',
    language: 'en',
    price: 99.99,
    discountPrice: 79.99,
    isPublished: true,
    status: 'PUBLISHED',
    imageUrl: '/course-placeholders/1.jpg',
  },
  {
    title: 'Advanced React Patterns',
    description: 'Master advanced React patterns and best practices for building scalable applications.',
    shortDescription: 'Take your React skills to the next level',
    difficulty: 'INTERMEDIATE',
    category: 'Web Development',
    language: 'en',
    price: 149.99,
    discountPrice: 129.99,
    isPublished: true,
    status: 'PUBLISHED',
    imageUrl: '/course-placeholders/2.jpg',
  },
  {
    title: 'Machine Learning Fundamentals',
    description: 'Learn the core concepts of machine learning and build your first models.',
    shortDescription: 'Introduction to machine learning concepts',
    difficulty: 'ADVANCED',
    category: 'Data Science',
    language: 'en',
    price: 199.99,
    isPublished: true,
    status: 'PUBLISHED',
    imageUrl: '/course-placeholders/3.jpg',
  },
  {
    title: 'Mobile App Development with Flutter',
    description: 'Build cross-platform mobile applications using Flutter and Dart.',
    shortDescription: 'Create beautiful native apps with Flutter',
    difficulty: 'INTERMEDIATE',
    category: 'Mobile Development',
    language: 'en',
    price: 129.99,
    isPublished: false,
    status: 'DRAFT',
    imageUrl: '/course-placeholders/4.jpg',
  },
];

// Sample module data
const sampleModules = [
  // For Web Development course
  { title: 'HTML & CSS Basics', order: 1 },
  { title: 'JavaScript Fundamentals', order: 2 },
  { title: 'Responsive Design', order: 3 },
  
  // For React course
  { title: 'React Hooks Deep Dive', order: 1 },
  { title: 'State Management', order: 2 },
  { title: 'Performance Optimization', order: 3 },
  
  // For ML course
  { title: 'Introduction to ML', order: 1 },
  { title: 'Supervised Learning', order: 2 },
  { title: 'Neural Networks', order: 3 },
];

// Sample lesson data
const sampleLessons = [
  // HTML & CSS Basics
  { title: 'Introduction to HTML', duration: 15, order: 1 },
  { title: 'CSS Selectors and Box Model', duration: 20, order: 2 },
  { title: 'Flexbox and Grid', duration: 25, order: 3 },
  
  // JavaScript Fundamentals
  { title: 'Variables and Data Types', duration: 20, order: 1 },
  { title: 'Functions and Scope', duration: 25, order: 2 },
  { title: 'DOM Manipulation', duration: 30, order: 3 },
  
  // React Hooks Deep Dive
  { title: 'useState and useEffect', duration: 30, order: 1 },
  { title: 'useContext and useReducer', duration: 35, order: 2 },
  { title: 'Custom Hooks', duration: 25, order: 3 },
];

async function main() {
  console.log('Starting database seeding...');
  
  // Create admin user if not exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Create instructors
  console.log('Creating instructors...');
  
  // First, create the users
  const instructor1 = await prisma.user.upsert({
    where: { email: 'instructor1@example.com' },
    update: {},
    create: {
      name: 'Sarah Johnson',
      email: 'instructor1@example.com',
      password: await hash('instructor123', 12),
      role: 'INSTRUCTOR',
    },
  });

  const instructor2 = await prisma.user.upsert({
    where: { email: 'instructor2@example.com' },
    update: {},
    create: {
      name: 'Michael Chen',
      email: 'instructor2@example.com',
      password: await hash('instructor123', 12),
      role: 'INSTRUCTOR',
    },
  });

  // Then create mentor profiles for them
  // Create mentor profiles without skills field as it's not in the schema
  await prisma.mentorProfile.upsert({
    where: { userId: instructor1.id },
    update: {},
    create: {
      userId: instructor1.id,
      // Include skills in the bio since skills field is not in the schema
      bio: 'Senior Web Developer with 8+ years of experience. Skills: JavaScript, React, Node.js',
    },
  });

  await prisma.mentorProfile.upsert({
    where: { userId: instructor2.id },
    update: {},
    create: {
      userId: instructor2.id,
      // Include skills in the bio since skills field is not in the schema
      bio: 'Machine Learning Engineer and Data Scientist. Skills: Python, TensorFlow, Data Analysis',
    },
  });

  console.log('✅ Instructors created');

  // Create test student user
  const testStudent = await prisma.user.upsert({
    where: { email: 'lukman.ibrahim@skymirror.eu' },
    update: {},
    create: {
      name: 'Lukman Ibrahim',
      email: 'lukman.ibrahim@skymirror.eu',
      password: await hash('password123', 12),
      role: 'STUDENT',
    },
  });

  // Create student profile
  await prisma.studentProfile.upsert({
    where: { userId: testStudent.id },
    update: {},
    create: {
      userId: testStudent.id,
      bio: 'New student learning web development',
    },
  });

  console.log('✅ Test student user created');

  // Create courses
  console.log('Creating courses...');
  for (const [index, courseData] of sampleCourses.entries()) {
    const instructor = index % 2 === 0 ? instructor1 : instructor2;
    
    const slug = courseData.title.toLowerCase().replace(/\s+/g, '-');
    const course = await prisma.course.upsert({
      where: { slug },
      update: {},
      create: {
        title: courseData.title,
        description: courseData.description,
        slug: slug,
        image: courseData.imageUrl,
        isPublished: courseData.isPublished,
        price: courseData.price,
        discountPrice: courseData.discountPrice,
        level: courseData.difficulty,
        category: courseData.category,
        language: courseData.language,
        totalHours: faker.number.int({ min: 2, max: 10 }),
        totalLectures: faker.number.int({ min: 10, max: 50 }),
        totalQuizzes: faker.number.int({ min: 0, max: 10 }),
        totalProjects: faker.number.int({ min: 1, max: 5 }),
        totalStudents: faker.number.int({ min: 0, max: 1000 }),
        averageRating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
        totalReviews: faker.number.int({ min: 0, max: 200 }),
        instructorId: instructor.id,
      },
    });

    console.log(`✅ Course created: ${course.title}`);

    // Create modules for each course
    const courseModules = sampleModules.slice(
      (index % 3) * 3,
      ((index % 3) + 1) * 3
    );

    for (const [moduleIndex, moduleData] of courseModules.entries()) {
      const module = await prisma.module.create({
        data: {
          title: moduleData.title,
          description: `Learn about ${moduleData.title.toLowerCase()}`,
          order: moduleData.order,
          isPublished: true,
          courseId: course.id,
        },
      });

      // Create lessons for each module
      const moduleLessons = sampleLessons.slice(
        (moduleIndex % 3) * 3,
        ((moduleIndex % 3) + 1) * 3
      );

      for (const [lessonIndex, lessonData] of moduleLessons.entries()) {
        await prisma.lesson.create({
          data: {
            title: lessonData.title,
            description: `In this lesson, you'll learn about ${lessonData.title.toLowerCase()}`,
            videoUrl: 'https://example.com/sample-video',
            duration: lessonData.duration,
            order: lessonData.order,
            isPublished: true,
            isPreview: false,
            moduleId: module.id,
          },
        });
      }
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
