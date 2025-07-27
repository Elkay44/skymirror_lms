import { PrismaClient } from '@prisma/client';
import { ExtendedPrismaClient } from './prisma-extensions';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: ExtendedPrismaClient | undefined;
}

// Create or reuse the Prisma client
const prisma: ExtendedPrismaClient = global.prisma || (() => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }) as unknown as ExtendedPrismaClient;

  // Add error handling middleware
  client.$use(async (params, next) => {
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

  return client;
})();

// Save to global object in development to prevent multiple instances in hot reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export both as default and named export
export { prisma };
export default prisma;
