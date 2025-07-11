import { PrismaClient } from '@prisma/client';
import { extendPrismaClient, ExtendedPrismaClient } from './prisma-extensions';

declare global {
  var prisma: ExtendedPrismaClient | undefined;
}

// Create the base Prisma client
const baseClient = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Extend it with our custom models
const prisma = extendPrismaClient(baseClient);

// Save to global object in development to prevent multiple instances in hot reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
