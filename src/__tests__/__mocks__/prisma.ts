import { PrismaClient } from '@prisma/client';

// Create mock implementations
const mockUserCreate = jest.fn();
const mockCourseCreate = jest.fn();
const mockModuleCreate = jest.fn();
const mockModuleFindMany = jest.fn();

// Create mock Prisma client
const mockPrisma = {
  user: {
    create: mockUserCreate,
    deleteMany: jest.fn(),
  },
  course: {
    create: mockCourseCreate,
    deleteMany: jest.fn(),
  },
  module: {
    deleteMany: jest.fn(),
    create: mockModuleCreate,
    findMany: mockModuleFindMany,
  },
} as unknown as PrismaClient;

// Export the mock implementations for test files to use
export {
  mockPrisma,
  mockUserCreate,
  mockCourseCreate,
  mockModuleCreate,
  mockModuleFindMany,
};
