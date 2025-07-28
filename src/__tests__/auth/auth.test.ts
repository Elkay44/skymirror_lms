import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CredentialsConfig } from 'next-auth/providers/credentials';

const prisma = new PrismaClient();

describe('Authentication', () => {
  beforeAll(async () => {
    // Create test user with password
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword, // Use 'password' instead of 'hashedPassword'
        role: 'STUDENT',
        points: 0,
        level: 1,
        needsOnboarding: false
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
      password: 'testpassword',
      role: 'STUDENT'
    };

    const credentialsProvider = authOptions.providers[0] as CredentialsConfig<any>;
    const authorize = credentialsProvider.authorize as Function;
    const result = await authorize(credentials);

    expect(result).toBeTruthy();
    if (result) {
      expect(result.email).toBe(credentials.email);
      expect(result.role).toBe('STUDENT');
    }
  });

  it('should reject invalid credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'wrongpassword',
      role: 'STUDENT'
    };

    const credentialsProvider = authOptions.providers[0] as CredentialsConfig<any>;
    const authorize = credentialsProvider.authorize as Function;
    
    await expect(authorize(credentials))
      .rejects
      .toThrow('Invalid credentials');
  });

  it('should reject non-existent user', async () => {
    const credentials = {
      email: 'nonexistent@example.com',
      password: 'testpassword',
      role: 'STUDENT'
    };

    const credentialsProvider = authOptions.providers[0] as CredentialsConfig<any>;
    const authorize = credentialsProvider.authorize as Function;
    
    await expect(authorize(credentials))
      .rejects
      .toThrow('Invalid credentials');
  });
});
