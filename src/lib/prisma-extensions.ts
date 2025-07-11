/**
 * Prisma client extensions for models not directly defined in the schema
 * This allows us to work with models that might be created at runtime or through migrations
 */

import { PrismaClient } from '@prisma/client';
import { Forum, ForumPost, ForumPostLike, ForumPostComment } from './types/forum-types';

// Type for the extended PrismaClient
export type ExtendedPrismaClient = PrismaClient & {
  forum: {
    findUnique: (args: any) => Promise<Forum | null>;
    findMany: (args: any) => Promise<Forum[]>;
    create: (args: any) => Promise<Forum>;
    update: (args: any) => Promise<Forum>;
    delete: (args: any) => Promise<Forum>;
  };
  forumPost: {
    findUnique: (args: any) => Promise<ForumPost | null>;
    findMany: (args: any) => Promise<ForumPost[]>;
    create: (args: any) => Promise<ForumPost>;
    update: (args: any) => Promise<ForumPost>;
    delete: (args: any) => Promise<ForumPost>;
  };
  forumPostLike: {
    findUnique: (args: any) => Promise<ForumPostLike | null>;
    findMany: (args: any) => Promise<ForumPostLike[]>;
    create: (args: any) => Promise<ForumPostLike>;
    delete: (args: any) => Promise<ForumPostLike>;
  };
  forumPostComment: {
    findUnique: (args: any) => Promise<ForumPostComment | null>;
    findMany: (args: any) => Promise<ForumPostComment[]>;
    create: (args: any) => Promise<ForumPostComment>;
    update: (args: any) => Promise<ForumPostComment>;
    delete: (args: any) => Promise<ForumPostComment>;
  };
  // Project-related models - use any to avoid TypeScript errors
  project: any;
  projectSubmission: any;
  projectResource: any;
  page: any;
  certification: any;
  modulePrerequisite: any;
  lessonPrerequisite: any;
  discussionPost: any;
  discussion: any; // Adding discussion model for search functionality
  // Use proper types from @prisma/client when they exist, otherwise any
  courseApprovalHistory: any;
  CourseApprovalHistory: any; // Properly capitalized to match schema
  // Assignment and Rubric models
  assignment: any;
  rubricItem: any;
  // Course version custom implementation
  courseVersion: {
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
  // ActivityLog model
  activityLog: {
    findUnique: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  }
};

/**
 * Extend the Prisma client with forum-related models
 */
export function extendPrismaClient(prismaClient: PrismaClient): ExtendedPrismaClient {
  // Add forum model
  (prismaClient as any).forum = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "Forum" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "Forum" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "Forum" ${formatInsertClause(args.data)} RETURNING *`,
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "Forum" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "Forum" WHERE id = ${args.where.id} RETURNING *`,
  };

  // Add forumPost model
  (prismaClient as any).forumPost = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "ForumPost" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "ForumPost" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "ForumPost" ${formatInsertClause(args.data)} RETURNING *`,
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "ForumPost" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "ForumPost" WHERE id = ${args.where.id} RETURNING *`,
  };

  // Add forumPostLike model
  (prismaClient as any).forumPostLike = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "ForumPostLike" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "ForumPostLike" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "ForumPostLike" ${formatInsertClause(args.data)} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "ForumPostLike" WHERE id = ${args.where.id} RETURNING *`,
  };

  // Add forumPostComment model
  (prismaClient as any).forumPostComment = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "ForumPostComment" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "ForumPostComment" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "ForumPostComment" ${formatInsertClause(args.data)} RETURNING *`,
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "ForumPostComment" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "ForumPostComment" WHERE id = ${args.where.id} RETURNING *`,
  };

  // Add modulePrerequisite model
  (prismaClient as any).modulePrerequisite = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "ModulePrerequisite" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "ModulePrerequisite" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "ModulePrerequisite" ${formatInsertClause(args.data)} RETURNING *`,
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "ModulePrerequisite" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "ModulePrerequisite" WHERE id = ${args.where.id} RETURNING *`,
    deleteMany: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "ModulePrerequisite" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`
  };

  // Add lessonPrerequisite model
  (prismaClient as any).lessonPrerequisite = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "LessonPrerequisite" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "LessonPrerequisite" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "LessonPrerequisite" ${formatInsertClause(args.data)} RETURNING *`,
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "LessonPrerequisite" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "LessonPrerequisite" WHERE id = ${args.where.id} RETURNING *`,
    deleteMany: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "LessonPrerequisite" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`
  };

  // Add discussionPost model
  (prismaClient as any).discussionPost = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "DiscussionPost" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "DiscussionPost" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "DiscussionPost" ${formatInsertClause(args.data)} RETURNING *`,
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "DiscussionPost" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "DiscussionPost" WHERE id = ${args.where.id} RETURNING *`,
    count: (args: any) => (prismaClient as any).$queryRaw`SELECT COUNT(*) FROM "DiscussionPost" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`
  };

  // Add courseApprovalHistory model using raw SQL queries to avoid Prisma client issues
  (prismaClient as any).courseApprovalHistory = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "CourseApprovalHistory" WHERE id = ${args.where.id} LIMIT 1`,
    findFirst: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "CourseApprovalHistory" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "CourseApprovalHistory" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "CourseApprovalHistory" ${formatInsertClause(args.data)} RETURNING *`,
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "CourseApprovalHistory" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "CourseApprovalHistory" WHERE id = ${args.where.id} RETURNING *`,
    deleteMany: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "CourseApprovalHistory" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    upsert: (args: any) => (prismaClient as any).$executeRaw`
      INSERT INTO "CourseApprovalHistory" ${formatInsertClause(args.create)}
      ON CONFLICT (id) DO UPDATE SET ${formatUpdateClause(args.update)}
      RETURNING *
    `,
    count: (args: any) => (prismaClient as any).$queryRaw`SELECT COUNT(*) FROM "CourseApprovalHistory" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`
  };
  
  // Add CourseApprovalHistory model with proper capitalization to match the schema
  (prismaClient as any).CourseApprovalHistory = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "CourseApprovalHistory" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "CourseApprovalHistory" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    create: (args: any) => (prismaClient as any).$executeRaw`INSERT INTO "CourseApprovalHistory" ${formatInsertClause(args.data)} RETURNING *`,
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "CourseApprovalHistory" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "CourseApprovalHistory" WHERE id = ${args.where.id} RETURNING *`,
    deleteMany: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "CourseApprovalHistory" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`,
    count: (args: any) => (prismaClient as any).$queryRaw`SELECT COUNT(*) FROM "CourseApprovalHistory" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`
  };
  
  // Add courseVersion model using raw SQL queries
  (prismaClient as any).courseVersion = {
    findUnique: (args: any) => (prismaClient as any).$queryRaw`SELECT * FROM "CourseVersion" WHERE id = ${args.where.id} LIMIT 1`,
    findMany: (args: any) => {
      // Handle complex queries with skip, take, orderBy, include, etc.
      const whereClause = args.where ? `WHERE ${formatWhereClause(args.where)}` : '';
      const orderByClause = args.orderBy ? `ORDER BY ${formatOrderByClause(args.orderBy)}` : '';
      const limitClause = args.take ? `LIMIT ${args.take}` : '';
      const offsetClause = args.skip ? `OFFSET ${args.skip}` : '';
      
      return (prismaClient as any).$queryRaw`
        SELECT * FROM "CourseVersion" 
        ${whereClause}
        ${orderByClause}
        ${limitClause}
        ${offsetClause}
      `;
    },
    create: (args: any) => {
      // Special handling for complex objects in create
      const data = {...args.data};
      if (data.snapshot && typeof data.snapshot === 'object') {
        data.snapshot = JSON.stringify(data.snapshot);
      }
      return (prismaClient as any).$executeRaw`INSERT INTO "CourseVersion" ${formatInsertClause(data)} RETURNING *`;
    },
    update: (args: any) => (prismaClient as any).$executeRaw`UPDATE "CourseVersion" SET ${formatUpdateClause(args.data)} WHERE id = ${args.where.id} RETURNING *`,
    delete: (args: any) => (prismaClient as any).$executeRaw`DELETE FROM "CourseVersion" WHERE id = ${args.where.id} RETURNING *`,
    count: (args: any) => (prismaClient as any).$queryRaw`SELECT COUNT(*) FROM "CourseVersion" ${args.where ? `WHERE ${formatWhereClause(args.where)}` : ''}`
  };

  return prismaClient as ExtendedPrismaClient;
}

// Helper functions for SQL clause formatting
function formatWhereClause(where: Record<string, any>): string {
  return Object.entries(where)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `"${key}" = '${value}'`;
      } else {
        return `"${key}" = ${value}`;
      }
    })
    .join(' AND ');
}

function formatInsertClause(data: Record<string, any>): string {
  const columns = Object.keys(data).map(key => `"${key}"`).join(', ');
  const values = Object.values(data).map(value => {
    if (typeof value === 'string') {
      return `'${value}'`;
    } else {
      return value;
    }
  }).join(', ');
  
  return `(${columns}) VALUES (${values})`;
}

function formatUpdateClause(data: Record<string, any>): string {
  return Object.entries(data)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `"${key}" = '${value}'`;
      } else {
        return `"${key}" = ${value}`;
      }
    })
    .join(', ');
}

function formatOrderByClause(orderBy: Record<string, any> | Array<Record<string, any>>): string {
  if (Array.isArray(orderBy)) {
    return orderBy.map(item => formatSingleOrderBy(item)).join(', ');
  } else {
    return formatSingleOrderBy(orderBy);
  }
}

function formatSingleOrderBy(orderBy: Record<string, any>): string {
  return Object.entries(orderBy)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `"${key}" ${value.toUpperCase()}`;
      } else {
        return `"${key}" ASC`; // Default to ASC if not a string
      }
    })
    .join(', ');
}
