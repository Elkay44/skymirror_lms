import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking student users...');
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, email: true, name: true, role: true, password: true }
    });
    
    console.log('Found student users:', JSON.stringify(students, null, 2));
    
    if (students.length === 0) {
      console.log('No student users found. Creating a test student...');
      const hashedPassword = await bcrypt.hash('Test@1234', 10);
      
      const testStudent = await prisma.user.create({
        data: {
          name: 'Test Student',
          email: 'student@test.com',
          password: hashedPassword,
          role: 'STUDENT',
          points: 0,
          level: 1,
          needsOnboarding: true,
          studentProfile: {
            create: {
              bio: 'Test student account',
              learningGoals: 'Learn and grow'
            }
          }
        },
        include: {
          studentProfile: true
        }
      });
      
      console.log('Created test student:', JSON.stringify(testStudent, null, 2));
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers().catch(console.error);
