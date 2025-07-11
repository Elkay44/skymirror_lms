const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createInstructorProfile() {
  try {
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    // Check if instructor profile already exists
    const existingProfile = await prisma.instructorProfile.findUnique({
      where: { userId: adminUser.id },
    });

    if (existingProfile) {
      console.log('Instructor profile already exists:', existingProfile);
      return;
    }

    // Create instructor profile
    const instructorProfile = await prisma.instructorProfile.create({
      data: {
        userId: adminUser.id,
        bio: 'Administrator account with full access',
        expertise: ['Full Stack Development', 'System Administration'],
        yearsOfExperience: 5,
        education: 'Computer Science',
        teachingPhilosophy: 'Empowering students through practical, hands-on learning',
      },
    });

    console.log('Instructor profile created successfully:', instructorProfile);
  } catch (error) {
    console.error('Error creating instructor profile:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInstructorProfile();
