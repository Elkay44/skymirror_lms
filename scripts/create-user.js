const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'mentor@example.com' },
      include: { mentorProfile: true }
    });

    if (existingUser) {
      console.log('User already exists, updating...');
      // Update existing user
      const user = await prisma.user.update({
        where: { email: 'mentor@example.com' },
        data: {
          name: 'Mentor User',
          hashedPassword: hashedPassword,
          role: 'MENTOR',
          emailVerified: new Date(),
          points: 100,
          level: 5,
          mentorProfile: existingUser.mentorProfile ? {
            update: {
              bio: 'Experienced mentor in web development and system design',
              specialties: 'JavaScript, React, Node.js, Database Design',
              experience: '8 years',
              availability: JSON.stringify({
                monday: ['09:00-12:00', '14:00-18:00'],
                tuesday: ['09:00-12:00', '14:00-18:00'],
                wednesday: ['09:00-12:00'],
                thursday: ['09:00-12:00', '14:00-18:00'],
                friday: ['09:00-12:00']
              }),
              hourlyRate: 5000, // $50.00
              isActive: true
            }
          } : {
            create: {
              bio: 'Experienced mentor in web development and system design',
              specialties: 'JavaScript, React, Node.js, Database Design',
              experience: '8 years',
              availability: JSON.stringify({
                monday: ['09:00-12:00', '14:00-18:00'],
                tuesday: ['09:00-12:00', '14:00-18:00'],
                wednesday: ['09:00-12:00'],
                thursday: ['09:00-12:00', '14:00-18:00'],
                friday: ['09:00-12:00']
              }),
              hourlyRate: 5000, // $50.00
              isActive: true
            }
          }
        },
        include: {
          mentorProfile: true
        }
      });
      console.log('User updated successfully:', user);
    } else {
      // Create new user with mentor profile
      const user = await prisma.user.create({
        data: {
          name: 'Mentor User',
          email: 'mentor@example.com',
          hashedPassword: hashedPassword,
          role: 'MENTOR',
          emailVerified: new Date(),
          points: 100,
          level: 5,
          mentorProfile: {
            create: {
              bio: 'Experienced mentor in web development and system design',
              specialties: 'JavaScript, React, Node.js, Database Design',
              experience: '8 years',
              availability: JSON.stringify({
                monday: ['09:00-12:00', '14:00-18:00'],
                tuesday: ['09:00-12:00', '14:00-18:00'],
                wednesday: ['09:00-12:00'],
                thursday: ['09:00-12:00', '14:00-18:00'],
                friday: ['09:00-12:00']
              }),
              hourlyRate: 5000, // $50.00
              isActive: true
            }
          }
        },
        include: {
          mentorProfile: true
        }
      });
      console.log('User created successfully:', user);
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
