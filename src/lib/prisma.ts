/* eslint-disable */
import { PrismaClient } from '@prisma/client';
import { extendPrismaClient, ExtendedPrismaClient } from './prisma-extensions';
import { logger } from './logger';

declare global {
  var prisma: ExtendedPrismaClient | undefined;
}

// Create the base Prisma client with enhanced error handling
const baseClient = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Extend it with our custom models
const prisma = extendPrismaClient(baseClient);

// Add error handling middleware
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    logger.error('Prisma operation failed:', {
      operation: params.action,
      model: params.model,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});

// Save to global object in development to prevent multiple instances in hot reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export both as default and named export
export { prisma };
export default prisma;
