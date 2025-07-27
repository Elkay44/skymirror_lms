import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

declare module '@prisma/client' {
  const prisma: PrismaClient;
  export default prisma;
}

// Extend the PrismaClient type to include the rubric model
declare module '@prisma/client' {
  interface PrismaClient {
    rubric: {
      findUnique: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
      delete: (args: any) => Promise<any>;
      findMany: (args?: any) => Promise<any[]>;
      create: (args: any) => Promise<any>;
    };
    rubricItem: {
      findMany: (args: any) => Promise<any[]>;
      create: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
      delete: (args: any) => Promise<any>;
      deleteMany: (args: any) => Promise<any>;
    };
    assignment: {
      findMany: (args: any) => Promise<any[]>;
    };
  }
}

export {};
