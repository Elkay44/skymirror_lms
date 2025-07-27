// Simple script to check database connection and list all tables
import { PrismaClient } from '@prisma/client';
import process from 'process';

async function checkDatabase() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Successfully connected to database');

    // Check if we can query the database
    console.log('\nDatabase connection details:');
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.table(dbInfo);

    // List all tables in the database
    console.log('\nTables in the database:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.table(tables);

    // Check if courses table exists and has data
    console.log('\nChecking courses table...');
    try {
      const courseTables = tables.some(t => t.table_name === 'courses' || t.table_name === 'course');
      
      if (!courseTables) {
        console.log('❌ No courses table found in the database');
        return;
      }

      // Check course count
      const courseCount = await prisma.course.count();
      console.log(`📊 Total courses in database: ${courseCount}`);

      if (courseCount > 0) {
        // Get some sample courses
        const sampleCourses = await prisma.course.findMany({
          take: 5,
          select: {
            id: true,
            title: true,
            isPublished: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        console.log('\nSample courses:');
        console.table(sampleCourses);

        // Check published courses
        const publishedCount = await prisma.course.count({
          where: {
            isPublished: true,
          },
        });
        console.log(`\n📢 Published courses: ${publishedCount}`);

        if (publishedCount > 0) {
          const publishedCourses = await prisma.course.findMany({
            where: {
              isPublished: true,
            },
            select: {
              id: true,
              title: true,
              status: true,
              isPublished: true,
            },
            take: 5,
          });
          console.log('\nSample published courses:');
          console.table(publishedCourses);
        }
      }
    } catch (error) {
      console.error('Error querying courses:', error);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
