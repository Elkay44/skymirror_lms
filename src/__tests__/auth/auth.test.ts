import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Authentication', () => {
  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        hashedPassword,
        role: 'STUDENT'
      }
    });
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: {
        email: 'test@example.com'
      }
    });
    await prisma.$disconnect();
  });

  it('should authenticate valid credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'testpassword'
    };

    const result = await authOptions.providers[0].authorize!(credentials);

    expect(result).toBeTruthy();
    if (result) {
      expect(result.email).toBe(credentials.email);
      expect(result.role).toBe('STUDENT');
    }
  });

  it('should reject invalid credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    await expect(authOptions.providers[0].authorize!(credentials))
      .rejects
      .toThrow('Invalid credentials');
  });

  it('should reject non-existent user', async () => {
    const credentials = {
      email: 'nonexistent@example.com',
      password: 'testpassword'
    };

    await expect(authOptions.providers[0].authorize!(credentials))
      .rejects
      .toThrow('Invalid credentials');
  });
});
