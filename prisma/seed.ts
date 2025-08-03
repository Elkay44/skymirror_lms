import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const { hash } = bcrypt;
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');
  
  // Create admin user if not exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await hash('admin123', 12);
    await prisma.user.create({
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
  
  console.log('✅ Database seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
