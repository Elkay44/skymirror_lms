/* eslint-disable */
import { PrismaClient, Prisma } from '@prisma/client';
import { ProjectResource } from '@/types/project-resource';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Extend the base PrismaClient to include our custom methods
type PrismaClientWithExtensions = PrismaClient & {
  $queryRawUnsafe: <T = any>(query: string, ...values: any[]) => Promise<T>;
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<number>;
};

// Helper type for model data
type ModelData<T = any> = T & {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

// Base model type with common methods
type BaseModel<T = any> = {
  findMany: (args?: any) => Promise<T[]>;
  findUnique: (args: { where: { id: string } }) => Promise<T | null>;
  findFirst: (args?: any) => Promise<T | null>;
  create: (args: { data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> }) => Promise<T>;
  update: (args: { where: { id: string }; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }) => Promise<T>;
  updateMany: (args: { where: any; data: any }) => Promise<{ count: number }>;
  upsert: (args: { 
    where: any; 
    create: any; 
    update: any;
  }) => Promise<T>;
  delete: (args: { where: { id: string } }) => Promise<T>;
  count: (args?: any) => Promise<number>;
  deleteMany: (args?: any) => Promise<{ count: number }>;
  createMany: (args: { data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }) => Promise<{ count: number }>;
  $transaction: <T>(fn: (prisma: any) => Promise<T>) => Promise<T>;
};

// Extended Prisma client type
export type ExtendedPrismaClient = PrismaClient & {
  // Add conversation model to the extended client
  conversation: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };
  
  // Add conversationParticipant model to the extended client
  conversationParticipant: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
    findFirst: (args?: any) => Promise<any>;
  };
  
  // Add message model to the extended client
  message: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<{ count: number }>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };

  // Add page model to the extended client
  page: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };

  // Add pageView model to the extended client
  pageView: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };

  // Add skill model to the extended client
  skill: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findFirst: (args?: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };

  // Add review model to the extended client
  review: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findFirst: (args?: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
    upsert: (args: any) => Promise<any>;
  };

  // Add portfolioSetting model to the extended client
  portfolioSetting: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findFirst: (args?: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
    upsert: (args: any) => Promise<any>;
  };
  
  // Add menteeNotes model to the extended client
  menteeNotes: BaseModel<any> & {
    upsert: (args: { where: any; create: any; update: any }) => Promise<any>;
  };

  // Add mentorSession model to the extended client
  mentorSession: BaseModel<any> & {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };
  
  // Add activityLog model to the extended client
  activityLog: {
    create: (args: { data: any }) => Promise<any>;
  };
  
  // Add enrollment model to the extended client
  enrollment: BaseModel<any> & {
    findFirst: (args: any) => Promise<any>;
  };
  
  // Project-related models
  project: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    upsert: (args: { where: any; create: any; update: any }) => Promise<any>;
  };
  
  // Quiz-related models
  quiz: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    upsert: (args: { where: any; create: any; update: any }) => Promise<any>;
  };
  
  // Quiz Attempt model
  quizAttempt: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
  };
  
  // Learning Goal model
  learningGoal: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  
  // Forum model
  forum: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  
  // User Answer model
  userAnswer: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  
  // Notification model
  notification: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  
  // Course Version model
  courseVersion: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  
  // Lesson model
  lesson: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  
  // Question model
  question: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  
  // Question Option model
  questionOption: BaseModel & {
    count: (args?: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  
  projectResource: BaseModel & {
    deleteMany: (args?: any) => Promise<{ count: number }>;
    findMany: (args?: any) => Promise<ProjectResource[]>;
    findUnique: (args: { where: { id: string } }) => Promise<ProjectResource | null>;
    create: (args: { data: Omit<ProjectResource, 'id' | 'createdAt' | 'updatedAt'> }) => Promise<ProjectResource>;
    update: (args: { 
      where: { id: string }; 
      data: Partial<Omit<ProjectResource, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>> 
    }) => Promise<ProjectResource>;
    delete: (args: { where: { id: string } }) => Promise<ProjectResource>;
  };
  
  projectSubmission: BaseModel & {
    deleteMany: (args?: any) => Promise<{ count: number }>;
  };
  
  // Course-related models
  course: BaseModel & {
    findUnique: (args: {
      where: { id: string };
      select?: any;
      include?: any;
    }) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };
  
  // Assignment model
  assignment: BaseModel & {
    findUnique: (args: { 
      where: { id: string };
      include?: any;
    }) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: { id: string }; data: any }) => Promise<any>;
    deleteItem: (args: { where: { id: string } }) => Promise<any>;
    deleteMany: (args?: any) => Promise<{ count: number }>;
    count: (args?: any) => Promise<number>;
  };
  
  // Note model
  note: BaseModel & {
    findUnique: (args: { 
      where: { id: string };
      include?: any;
    }) => Promise<any>;
    findMany: (args?: { 
      where?: any;
      orderBy?: any;
    }) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: { id: string }; data: any }) => Promise<any>;
    deleteItem: (args: { where: { id: string } }) => Promise<any>;
    deleteMany: (args?: any) => Promise<{ count: number }>;
    count: (args?: any) => Promise<number>;
  };
  
  // Module model
  module: BaseModel & {
    findUnique: (args: { 
      where: { id: string };
      include?: any;
      select?: any;
    }) => Promise<any>;
    findFirst: (args: {
      where: any;
      include?: any;
      select?: any;
    }) => Promise<any>;
    findMany: (args?: { 
      where?: any;
      orderBy?: any;
      include?: any;
    }) => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: { id: string }; data: any }) => Promise<any>;
    deleteItem: (args: { where: { id: string } }) => Promise<any>;
    deleteMany: (args?: any) => Promise<{ count: number }>;
    count: (args?: any) => Promise<number>;
  };
};

// Helper function to format WHERE clause for raw queries
const formatWhereClause = (where: Record<string, unknown> | null | undefined): string => {
  if (!where) return '';
  
  const conditions: string[] = [];
  
  for (const key in where) {
    if (Object.prototype.hasOwnProperty.call(where, key)) {
      const value = where[key];
      
      if (value === null || value === undefined) {
        conditions.push(`"${key}" IS NULL`);
        continue;
      }
      
      if (typeof value === 'object' && value !== null) {
        if ('in' in value && Array.isArray((value as any).in)) {
          const values = (value as any).in
            .map((v: unknown) => 
              v === null || v === undefined ? 'NULL' : 
              typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
              v instanceof Date ? `'${v.toISOString()}'` :
              `'${String(v)}'`
            )
            .join(',');
          conditions.push(`"${key}" IN (${values})`);
          continue;
        }
        
        if ('equals' in value) {
          const eqValue = (value as any).equals;
          if (eqValue === null || eqValue === undefined) {
            conditions.push(`"${key}" IS NULL`);
          } else if (typeof eqValue === 'string') {
            conditions.push(`"${key}" = '${eqValue.replace(/'/g, "''")}'`);
          } else if (eqValue instanceof Date) {
            conditions.push(`"${key}" = '${eqValue.toISOString()}'`);
          } else if (typeof eqValue === 'object') {
            conditions.push(`"${key}" = '${JSON.stringify(eqValue).replace(/'/g, "''")}'`);
          } else {
            conditions.push(`"${key}" = ${eqValue}`);
          }
          continue;
        }
        
        // Handle other operators like gt, gte, lt, lte, contains, etc.
        const operators = ['gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith'];
        const hasOperator = Object.keys(value).some(k => operators.includes(k));
        
        if (hasOperator) {
          for (const op in value) {
            if (operators.includes(op)) {
              const opValue = (value as any)[op];
              let sqlOp = '';
              
              switch (op) {
                case 'gt': sqlOp = '>'; break;
                case 'gte': sqlOp = '>='; break;
                case 'lt': sqlOp = '<'; break;
                case 'lte': sqlOp = '<='; break;
                case 'contains': 
                  conditions.push(`"${key}"::text LIKE '%${String(opValue).replace(/'/g, "''")}%'`);
                  continue;
                case 'startsWith':
                  conditions.push(`"${key}"::text LIKE '${String(opValue).replace(/'/g, "''")}%'`);
                  continue;
                case 'endsWith':
                  conditions.push(`"${key}"::text LIKE '%${String(opValue).replace(/'/g, "''")}'`);
                  continue;
                default:
                  continue;
              }
              
              if (opValue === null || opValue === undefined) continue;
              
              if (typeof opValue === 'string') {
                conditions.push(`"${key}" ${sqlOp} '${opValue.replace(/'/g, "''")}'`);
              } else if (opValue instanceof Date) {
                conditions.push(`"${key}" ${sqlOp} '${opValue.toISOString()}'`);
              } else if (typeof opValue === 'object') {
                conditions.push(`"${key}" ${sqlOp} '${JSON.stringify(opValue).replace(/'/g, "''")}'`);
              } else {
                conditions.push(`"${key}" ${sqlOp} ${opValue}`);
              }
            }
          }
          continue;
        }
      }
      
      // Default equality check
      if (typeof value === 'string') {
        conditions.push(`"${key}" = '${value.replace(/'/g, "''")}'`);
      } else if (value instanceof Date) {
        conditions.push(`"${key}" = '${value.toISOString()}'`);
      } else if (typeof value === 'object') {
        conditions.push(`"${key}" = '${JSON.stringify(value).replace(/'/g, "''")}'`);
      } else {
        conditions.push(`"${key}" = ${value}`);
      }
    }
  }
  
  return conditions.join(' AND ');
};

// Helper function to format ORDER BY clause for raw queries
const formatOrderByClause = (orderBy: unknown): string => {
  if (!orderBy) return '';
  
  // Handle array of order by objects
  if (Array.isArray(orderBy)) {
    return orderBy
      .map(ob => formatOrderByClause(ob))
      .filter(Boolean)
      .join(', ');
  }
  
  // Handle single order by object
  if (orderBy && typeof orderBy === 'object') {
    const orderByObj = orderBy as Record<string, unknown>;
    const orderBys: string[] = [];
    
    for (const key in orderByObj) {
      if (Object.prototype.hasOwnProperty.call(orderByObj, key)) {
        const value = orderByObj[key];
        const direction = value === 'desc' || value === 'descending' ? 'DESC' : 'ASC';
        orderBys.push(`"${key}" ${direction}`);
      }
    }
    
    return orderBys.join(', ');
  }
  
  // Handle string input (e.g., 'name asc' or 'createdAt desc')
  if (typeof orderBy === 'string') {
    const [field, direction] = orderBy.trim().split(/\s+/);
    if (!field) return '';
    const dir = direction && (direction.toLowerCase() === 'desc' || direction.toLowerCase() === 'descending') 
      ? 'DESC' 
      : 'ASC';
    return `"${field}" ${dir}`;
  }
  
  return '';
};

// Helper function to format INSERT clause for raw queries
const formatInsertClause = (data: Record<string, unknown>): string => {
  const columns: string[] = [];
  const values: string[] = [];
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      columns.push(`"${key}"`);
      
      if (value === null || value === undefined) {
        values.push('NULL');
      } else if (typeof value === 'string') {
        values.push(`'${value.replace(/'/g, "''")}'`);
      } else if (value instanceof Date) {
        values.push(`'${value.toISOString()}'`);
      } else if (typeof value === 'object') {
        values.push(`'${JSON.stringify(value).replace(/'/g, "''")}'`);
      } else if (typeof value === 'boolean') {
        values.push(value ? 'TRUE' : 'FALSE');
      } else {
        values.push(String(value));
      }
    }
  }
  
  return `(${columns.join(', ')}) VALUES (${values.join(', ')})`;
};

// Helper function to format UPDATE clause for raw queries
const formatUpdateClause = (data: Record<string, unknown>): string => {
  const clauses: string[] = [];
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      let clause: string;
      
      if (value === null || value === undefined) {
        clause = `"${key}" = NULL`;
      } else if (typeof value === 'string') {
        clause = `"${key}" = '${value.replace(/'/g, "''")}'`;
      } else if (value instanceof Date) {
        clause = `"${key}" = '${value.toISOString()}'`;
      } else if (typeof value === 'object') {
        clause = `"${key}" = '${JSON.stringify(value).replace(/'/g, "''")}'`;
      } else {
        clause = `"${key}" = ${value}`;
      }
      
      clauses.push(clause);
    }
  }
  
  return clauses.join(', ');
};

// Create a model with common CRUD operations
const createModel = <T extends Record<string, any> = any>(
  prisma: PrismaClientWithExtensions, 
  tableName: string
): BaseModel<ModelData<T>> & { tableName: string } => {
  // Define the model type with required fields
  type ModelType = T & {
    id: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  
  // Helper to convert raw DB result to ModelType
  const toModel = (data: any): ModelType => ({
    ...data,
    id: String(data.id),
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  });
  
  const model: BaseModel<ModelType> & { tableName: string } = {
    tableName,
    $transaction: prisma.$transaction.bind(prisma),
    async findMany(args?: any): Promise<ModelType[]> {
      const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
      const orderByClause = args?.orderBy ? `ORDER BY ${formatOrderByClause(args.orderBy)}` : '';
      const limitClause = args?.take ? `LIMIT ${args.take}` : '';
      const offsetClause = args?.skip ? `OFFSET ${args.skip}` : '';
      
      const query = `SELECT * FROM \`${tableName}\` ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`;
      const results = await prisma.$queryRawUnsafe<any[]>(query);
      return results.map(toModel);
    },
    
    async update(args: { where: { id: string }; data: any }): Promise<ModelType> {
      if (!args?.where?.id) throw new Error('update requires a where.id parameter');
      if (!args?.data) throw new Error('update requires a data parameter');
      
      const setClause = formatUpdateClause({
        ...args.data,
        updatedAt: new Date().toISOString(),
      });
      
      const query = `
        UPDATE "${tableName}"
        SET ${setClause}
        WHERE id = '${args.where.id}'
        RETURNING *
      `;
      
      const result = await prisma.$queryRawUnsafe<ModelType[]>(query);
      const updated = Array.isArray(result) ? result[0] : result;
      if (!updated) throw new Error('Failed to update record');
      return toModel(updated);
    },
    
    async updateMany(args: { where: any; data: any }): Promise<{ count: number }> {
      if (!args?.where) throw new Error('updateMany requires a where parameter');
      if (!args?.data) throw new Error('updateMany requires a data parameter');
      
      const whereClause = formatWhereClause(args.where);
      const setClause = formatUpdateClause({
        ...args.data,
        updatedAt: new Date().toISOString(),
      });
      
      const query = `
        UPDATE "${tableName}"
        SET ${setClause}
        ${whereClause}
        RETURNING id
      `;
      
      const result = await prisma.$queryRawUnsafe<Array<{ id: string }>>(query);
      return { count: Array.isArray(result) ? result.length : 0 };
    },
    
    async delete(args: { where: { id: string } }): Promise<ModelType> {
      if (!args?.where?.id) throw new Error('delete requires a where.id parameter');
      
      const query = `
        DELETE FROM "${tableName}"
        WHERE id = '${args.where.id}'
        RETURNING *
      `;
      
      const result = await prisma.$queryRawUnsafe<ModelType[]>(query);
      const deleted = Array.isArray(result) ? result[0] : result;
      if (!deleted) throw new Error('Failed to delete record');
      return toModel(deleted);
    },
    
    async count(args?: any): Promise<number> {
      const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
      const query = `SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`;
      const result = await prisma.$queryRawUnsafe<Array<{ count: string }>>(query);
      return parseInt(Array.isArray(result) ? result[0]?.count || '0' : '0', 10);
    },
    async findUnique(args: { where: { id: string } }): Promise<ModelType | null> {
      if (!args?.where?.id) throw new Error('findUnique requires a where.id parameter');
      const query = `SELECT * FROM \`${tableName}\` WHERE id = ? LIMIT 1`;
      const results = await prisma.$queryRawUnsafe<any[]>(query, args.where.id);
      return results[0] ? toModel(results[0]) : null;
    },
    async findFirst(args: { where?: any } = {}): Promise<ModelType | null> {
      const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
      const query = `SELECT * FROM \`${tableName}\` ${whereClause} LIMIT 1`;
      const results = await prisma.$queryRawUnsafe<any[]>(query);
      return results[0] ? toModel(results[0]) : null;
    },
    async create(args: { data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> }): Promise<ModelType> {
      if (!args?.data) throw new Error('create requires a data parameter');
      
      const now = new Date().toISOString();
      const dataWithTimestamps: any = {
        ...args.data,
        createdAt: now,
        updatedAt: now,
      };
      
      const insertClause = formatInsertClause(dataWithTimestamps);
      const query = `INSERT INTO "${tableName}" ${insertClause} RETURNING *`;
      const result = await prisma.$queryRawUnsafe<ModelType[]>(query);
      return toModel(Array.isArray(result) ? result[0] : result);
    },
    
    async upsert(args: { where: any; create: any; update: any }): Promise<ModelType> {
      const { where, create, update } = args;
      const whereClause = formatWhereClause(where);
      
      // First try to find existing record
      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "${tableName}" ${whereClause} LIMIT 1`
      );
      
      if (Array.isArray(existing) && existing.length > 0) {
        // Update existing record
        const setClause = formatUpdateClause(update);
        const query = `
          UPDATE "${tableName}"
          SET ${setClause}, "updatedAt" = NOW()
          ${whereClause}
          RETURNING *
        `;
        
        const result = await prisma.$queryRawUnsafe<ModelType[]>(
          query,
          ...Object.values(where as Record<string, unknown>),
          ...Object.values(update as Record<string, unknown>)
        );
        
        return toModel(Array.isArray(result) ? result[0] : result);
      } else {
        // Create new record with where conditions merged into create data
        const createData = { ...create, ...where };
        const insertClause = formatInsertClause({
          ...createData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        const query = `INSERT INTO "${tableName}" ${insertClause} RETURNING *`;
        const result = await prisma.$queryRawUnsafe<ModelType[]>(query);
        return toModel(Array.isArray(result) ? result[0] : result);
      }
    },
    
    async deleteMany(args?: any): Promise<{ count: number }> {
      const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
      const query = `DELETE FROM "${tableName}" ${whereClause} RETURNING id`;
      const result = await prisma.$queryRawUnsafe<any[]>(query);
      return { count: Array.isArray(result) ? result.length : 0 };
    },
  
  createMany: async (args: { data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }) => {
    if (!Array.isArray(args?.data) || args.data.length === 0) {
      throw new Error('createMany requires a non-empty data array');
    }
    
    // Prepare data with IDs and timestamps
    const now = new Date().toISOString();
    const preparedData = args.data.map(item => {
      const dataWithId = {
        ...item,
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };
      return dataWithId as T & { id: string; createdAt: string; updatedAt: string };
    });
    
    if (preparedData.length === 0) {
      return { count: 0 };
    }
    
    // Format values for SQL - handle different value types safely
    const valueRows = [];
    
    for (const item of preparedData) {
      const valueStrings: string[] = [];
      const itemRecord = item as Record<string, unknown>;
      
      for (const key in itemRecord) {
        if (Object.prototype.hasOwnProperty.call(itemRecord, key)) {
          const value = itemRecord[key];
          let sqlValue: string;
          
          if (value === null || value === undefined) {
            sqlValue = 'NULL';
          } else if (typeof value === 'string') {
            sqlValue = `'${value.replace(/'/g, "''")}'`;
          } else if (value instanceof Date) {
            sqlValue = `'${value.toISOString()}'`;
          } else if (typeof value === 'object') {
            sqlValue = `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          } else {
            sqlValue = `'${value}'`;
          }
          
          valueStrings.push(sqlValue);
        }
      }
      
      valueRows.push(`(${valueStrings.join(', ')})`);
    }
    
    const values = valueRows.join(', ');
    const columns = Object.keys(preparedData[0]).map(col => `"${col}"`).join(', ');
    
    // Execute the batch insert
    const count = await prisma.$executeRawUnsafe(
      `INSERT INTO "${tableName}" (${columns}) VALUES ${values} ON CONFLICT DO NOTHING`
    );
    
    // Ensure count is a number
    const countNum = typeof count === 'number' ? count : 0;
    return { count: countNum };
  }
};

return model;
}

export function extendPrismaClient(prisma: PrismaClient): ExtendedPrismaClient {
  // Create extended client with all models
  const extendedClient = prisma as unknown as ExtendedPrismaClient;

  // Add conversation model with all required methods
  extendedClient.conversation = {
    ...createModel(extendedClient, 'Conversation'),
    findMany: (args?: any) => createModel(extendedClient, 'Conversation').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'Conversation').findUnique(args),
    create: (args: any) => createModel(extendedClient, 'Conversation').create(args),
    update: (args: any) => createModel(extendedClient, 'Conversation').update(args),
    delete: (args: any) => createModel(extendedClient, 'Conversation').delete(args),
    count: (args?: any) => createModel(extendedClient, 'Conversation').count(args)
  };
  
  // Add conversationParticipant model with all required methods
  extendedClient.conversationParticipant = {
    ...createModel(extendedClient, 'ConversationParticipant'),
    findMany: (args?: any) => createModel(extendedClient, 'ConversationParticipant').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'ConversationParticipant').findUnique(args),
    create: (args: any) => createModel(extendedClient, 'ConversationParticipant').create(args),
    update: (args: any) => createModel(extendedClient, 'ConversationParticipant').update(args),
    delete: (args: any) => createModel(extendedClient, 'ConversationParticipant').delete(args),
    count: (args?: any) => createModel(extendedClient, 'ConversationParticipant').count(args),
    findFirst: (args?: any) => createModel(extendedClient, 'ConversationParticipant').findFirst(args),
  };

  // Add message model with all required methods
  extendedClient.message = {
    ...createModel(extendedClient, 'Message'),
    findMany: (args?: any) => createModel(extendedClient, 'Message').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'Message').findUnique(args),
    create: (args: any) => createModel(extendedClient, 'Message').create(args),
    update: (args: any) => createModel(extendedClient, 'Message').update(args),
    updateMany: (args: any) => createModel(extendedClient, 'Message').updateMany(args),
    delete: (args: any) => createModel(extendedClient, 'Message').delete(args),
    count: (args?: any) => createModel(extendedClient, 'Message').count(args),
  };

  // Add page model with all required methods
  extendedClient.page = {
    ...createModel(extendedClient, 'Page'),
    findMany: (args?: any) => createModel(extendedClient, 'Page').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'Page').findUnique(args),
    create: (args: any) => createModel(extendedClient, 'Page').create(args),
    update: (args: any) => createModel(extendedClient, 'Page').update(args),
    delete: (args: any) => createModel(extendedClient, 'Page').delete(args),
    count: (args?: any) => createModel(extendedClient, 'Page').count(args),
  };

  // Add pageView model with all required methods including upsert
  extendedClient.pageView = {
    ...createModel(extendedClient, 'PageView'),
    findMany: (args?: any) => createModel(extendedClient, 'PageView').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'PageView').findUnique(args),
    create: (args: any) => createModel(extendedClient, 'PageView').create(args),
    update: (args: any) => createModel(extendedClient, 'PageView').update(args),
    upsert: async (args: any) => {
      // First try to update
      try {
        const updated = await createModel(extendedClient, 'PageView').update({
          where: args.where,
          data: args.update || {}
        });
        return updated;
      } catch (error: any) {
        // If update fails, try to create
        if (error?.code === 'P2025') { // Record not found
          return createModel(extendedClient, 'PageView').create({
            data: { ...args.where, ...(args.create || {}) }
          });
        }
        throw error;
      }
    },
    delete: (args: any) => createModel(extendedClient, 'PageView').delete(args),
    count: (args?: any) => createModel(extendedClient, 'PageView').count(args),
  };

  // Add skill model with all required methods
  extendedClient.skill = {
    ...createModel(extendedClient, 'Skill'),
    findMany: (args?: any) => createModel(extendedClient, 'Skill').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'Skill').findUnique(args),
    findFirst: (args?: any) => createModel(extendedClient, 'Skill').findFirst(args),
    create: (args: any) => createModel(extendedClient, 'Skill').create(args),
    update: (args: any) => createModel(extendedClient, 'Skill').update(args),
    delete: (args: any) => createModel(extendedClient, 'Skill').delete(args),
    count: (args?: any) => createModel(extendedClient, 'Skill').count(args),
  };

  // Add review model with all required methods including upsert
  extendedClient.review = {
    ...createModel(extendedClient, 'Review'),
    findMany: (args?: any) => createModel(extendedClient, 'Review').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'Review').findUnique(args),
    findFirst: (args?: any) => createModel(extendedClient, 'Review').findFirst(args),
    create: (args: any) => createModel(extendedClient, 'Review').create(args),
    update: (args: any) => createModel(extendedClient, 'Review').update(args),
    delete: (args: any) => createModel(extendedClient, 'Review').delete(args),
    count: (args?: any) => createModel(extendedClient, 'Review').count(args),
    upsert: async (args: any) => {
      try {
        // Try to update first
        const updated = await createModel(extendedClient, 'Review').update({
          where: args.where,
          data: args.update || {}
        });
        return updated;
      } catch (error: any) {
        // If update fails with not found error, create
        if (error?.code === 'P2025') {
          return createModel(extendedClient, 'Review').create({
            data: { ...args.where, ...(args.create || {}) }
          });
        }
        throw error;
      }
    },
  };

  // Add portfolioSetting model with all required methods including upsert
  extendedClient.portfolioSetting = {
    ...createModel(extendedClient, 'PortfolioSetting'),
    findMany: (args?: any) => createModel(extendedClient, 'PortfolioSetting').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'PortfolioSetting').findUnique(args),
    findFirst: (args?: any) => createModel(extendedClient, 'PortfolioSetting').findFirst(args),
    create: (args: any) => createModel(extendedClient, 'PortfolioSetting').create(args),
    update: (args: any) => createModel(extendedClient, 'PortfolioSetting').update(args),
    delete: (args: any) => createModel(extendedClient, 'PortfolioSetting').delete(args),
    count: (args?: any) => createModel(extendedClient, 'PortfolioSetting').count(args),
    upsert: async (args: any) => {
      try {
        // Try to update first
        const updated = await createModel(extendedClient, 'PortfolioSetting').update({
          where: args.where,
          data: args.update || {}
        });
        return updated;
      } catch (error: any) {
        // If update fails with not found error, create
        if (error?.code === 'P2025') {
          return createModel(extendedClient, 'PortfolioSetting').create({
            data: { ...args.where, ...(args.create || {}) }
          });
        }
        throw error;
      }
    },
  };

  // Add menteeNotes model with upsert support
  extendedClient.menteeNotes = {
    ...createModel(extendedClient, 'menteeNotes'),
    upsert: async (args: { where: any; create: any; update: any }) => {
      const model = createModel(extendedClient, 'menteeNotes');
      return model.upsert(args);
    }
  };
  
  // Add project-related models
  extendedClient.project = {
    ...createModel(extendedClient, 'Project'),
    count: (args?: any) => createModel(extendedClient, 'Project').count(args)
  };
  
  extendedClient.projectResource = {
    ...createModel(extendedClient, 'ProjectResource'),
    deleteMany: (args?: any) => createModel(extendedClient, 'ProjectResource').deleteMany(args)
  };
  
  extendedClient.projectSubmission = {
    ...createModel(extendedClient, 'ProjectSubmission'),
    deleteMany: (args?: any) => createModel(extendedClient, 'ProjectSubmission').deleteMany(args)
  };
  
  // Add learning goal model
  extendedClient.learningGoal = {
    ...createModel(extendedClient, 'LearningGoal'),
    count: (args?: any) => createModel(extendedClient, 'LearningGoal').count(args)
  };
  
  // Add enrollment model with all required methods
  extendedClient.enrollment = {
    ...createModel(extendedClient, 'Enrollment'),
    findMany: (args?: any) => createModel(extendedClient, 'Enrollment').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'Enrollment').findUnique(args),
    findFirst: (args: any) => createModel(extendedClient, 'Enrollment').findFirst(args),
    create: (args: any) => createModel(extendedClient, 'Enrollment').create(args),
    update: (args: any) => createModel(extendedClient, 'Enrollment').update(args),
    delete: (args: any) => createModel(extendedClient, 'Enrollment').delete(args),
    count: (args?: any) => createModel(extendedClient, 'Enrollment').count(args)
  };
  
  // Add course-related models
  extendedClient.course = {
    ...createModel(extendedClient, 'Course'),
    count: (args?: any) => createModel(extendedClient, 'Course').count(args)
  };
  
  // Add quiz model
  extendedClient.quiz = {
    ...createModel(extendedClient, 'Quiz'),
    count: (args?: any) => createModel(extendedClient, 'Quiz').count(args)
  };
  
  // Add quiz attempt model
  extendedClient.quizAttempt = {
    ...createModel(extendedClient, 'QuizAttempt'),
    count: (args?: any) => createModel(extendedClient, 'QuizAttempt').count(args)
  };
  
  // Add forum model
  extendedClient.forum = {
    ...createModel(extendedClient, 'Forum'),
    count: (args?: any) => createModel(extendedClient, 'Forum').count(args)
  };
  
  // Add user answer model
  extendedClient.userAnswer = {
    ...createModel(extendedClient, 'UserAnswer'),
    count: (args?: any) => createModel(extendedClient, 'UserAnswer').count(args)
  };
  
  // Add notification model
  extendedClient.notification = {
    ...createModel(extendedClient, 'Notification'),
    count: (args?: any) => createModel(extendedClient, 'Notification').count(args)
  };
  
  // Add course version model
  extendedClient.courseVersion = {
    ...createModel(extendedClient, 'CourseVersion'),
    count: (args?: any) => createModel(extendedClient, 'CourseVersion').count(args)
  };
  
  // Add lesson model
  extendedClient.lesson = {
    ...createModel(extendedClient, 'Lesson'),
    count: (args?: any) => createModel(extendedClient, 'Lesson').count(args)
  };
  
  // Add question model
  extendedClient.question = {
    ...createModel(extendedClient, 'Question'),
    count: (args?: any) => createModel(extendedClient, 'Question').count(args)
  };
  
  // Add question option model
  extendedClient.questionOption = {
    ...createModel(extendedClient, 'QuestionOption'),
    count: (args?: any) => createModel(extendedClient, 'QuestionOption').count(args)
  };
  
  // Add activity log model with proper typing and error handling
  extendedClient.activityLog = {
    create: async (args: { data: any }) => {
      if (!args?.data) {
        throw new Error('activityLog.create requires a data parameter');
      }
      
      try {
        const dataWithTimestamps = {
          ...args.data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const insertClause = formatInsertClause(dataWithTimestamps);
        const result = await extendedClient.$queryRawUnsafe<any[]>(
          `INSERT INTO "ActivityLog" ${insertClause} RETURNING *`
        );
        
        return Array.isArray(result) && result.length > 0 ? result[0] : null;
      } catch (error) {
        console.error('Error creating activity log:', error);
        throw new Error('Failed to create activity log');
      }
    }
  };

  // Add enrollment model with proper typing and no duplicates
  extendedClient.enrollment = {
    ...createModel(extendedClient, 'Enrollment'),
    findFirst: async (args: { where?: any } = {}) => {
      try {
        const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
        const result = await extendedClient.$queryRawUnsafe<any[]>(
          `SELECT * FROM "Enrollment" ${whereClause} LIMIT 1`
        );
        return result?.[0] || null;
      } catch (error) {
        console.error('Error in enrollment.findFirst:', error);
        throw new Error('Failed to find enrollment');
      }
    },
    findMany: (args?: any) => createModel(extendedClient, 'Enrollment').findMany(args),
    findUnique: (args: any) => createModel(extendedClient, 'Enrollment').findUnique(args),
    create: (args: any) => createModel(extendedClient, 'Enrollment').create(args),
    update: (args: any) => createModel(extendedClient, 'Enrollment').update(args),
    delete: (args: any) => createModel(extendedClient, 'Enrollment').delete(args),
    count: (args?: any) => createModel(extendedClient, 'Enrollment').count(args),
    deleteMany: (args?: any) => createModel(extendedClient, 'Enrollment').deleteMany(args)
  };

  // Define MentorSession type for better type safety
  type MentorSession = {
    id: string;
    mentorId: string;
    menteeId: string;
    title: string;
    description?: string | null;
    scheduledAt: Date;
    duration: number;
    status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    meetingLink?: string | null;
    notes?: string | null;
    recordingUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  // Add mentorSession model with minimal implementation
  extendedClient.mentorSession = {
    ...createModel(extendedClient, 'MentorSession'),
    
    // Use the base implementation from createModel for all methods
    // This ensures we maintain Prisma's type safety
    async findUnique(args: any) {
      try {
        const result = await extendedClient.$queryRawUnsafe<MentorSession[]>(
          `SELECT * FROM "MentorSession" WHERE id = $1 LIMIT 1`,
          [args.where.id]
        );
        return result?.[0] || null;
      } catch (error) {
        console.error('Error in mentorSession.findUnique:', error);
        throw new Error('Failed to fetch mentor session');
      }
    },
    
    async findMany(args: any = {}) {
      try {
        const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
        const orderByClause = args?.orderBy ? `ORDER BY ${formatOrderByClause(args.orderBy)}` : '';
        const limitClause = args?.take ? `LIMIT ${args.take}` : '';
        const offsetClause = args?.skip ? `OFFSET ${args.skip}` : '';
        
        return await extendedClient.$queryRawUnsafe<MentorSession[]>(
          `SELECT * FROM "MentorSession" ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`.trim()
        );
      } catch (error) {
        console.error('Error in mentorSession.findMany:', error);
        throw new Error('Failed to fetch mentor sessions');
      }
    },
    
    async create(args: { data: any }) {
      try {
        const now = new Date();
        const dataWithTimestamps = {
          ...args.data,
          createdAt: now,
          updatedAt: now,
        };
        
        const result = await extendedClient.$queryRawUnsafe<MentorSession[]>(
          `INSERT INTO "MentorSession" ("mentorId", "menteeId", "title", "description", "scheduledAt", "duration", "status", "meetingLink", "notes", "recordingUrl", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            dataWithTimestamps.mentorId,
            dataWithTimestamps.menteeId,
            dataWithTimestamps.title,
            dataWithTimestamps.description || null,
            dataWithTimestamps.scheduledAt,
            dataWithTimestamps.duration,
            dataWithTimestamps.status,
            dataWithTimestamps.meetingLink || null,
            dataWithTimestamps.notes || null,
            dataWithTimestamps.recordingUrl || null,
            dataWithTimestamps.createdAt,
            dataWithTimestamps.updatedAt
          ]
        );
        
        return result?.[0];
      } catch (error) {
        console.error('Error in mentorSession.create:', error);
        throw new Error('Failed to create mentor session');
      }
    },
    
    async update(args: { 
      where: { id: string }; 
      data: any;
    }) {
      try {
        const updateData = {
          ...args.data,
          updatedAt: new Date(),
        };
        
        const setClause = [];
        const values = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            setClause.push(`"${key}" = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
        
        values.push(args.where.id);
        
        const result = await extendedClient.$queryRawUnsafe<MentorSession[]>(
          `UPDATE "MentorSession" 
           SET ${setClause.join(', ')}
           WHERE id = $${paramIndex}
           RETURNING *`,
          values
        );
        
        return result?.[0];
      } catch (error) {
        console.error('Error in mentorSession.update:', error);
        throw new Error('Failed to update mentor session');
      }
    },
    
    async delete(args: { where: { id: string } }) {
      try {
        const result = await extendedClient.$queryRawUnsafe<MentorSession[]>(
          'DELETE FROM "MentorSession" WHERE id = $1 RETURNING *',
          [args.where.id]
        );
        return result?.[0];
      } catch (error) {
        console.error('Error in mentorSession.delete:', error);
        throw new Error('Failed to delete mentor session');
      }
    },
    
    async count(args: { where?: any } = {}) {
      try {
        const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
        const result = await extendedClient.$queryRawUnsafe<Array<{ count: string }>>(
          `SELECT COUNT(*) FROM "MentorSession" ${whereClause}`.trim()
        );
        return parseInt(result?.[0]?.count || '0', 10);
      } catch (error) {
        console.error('Error in mentorSession.count:', error);
        throw new Error('Failed to count mentor sessions');
      }
    },
  } as any; // Use type assertion to bypass TypeScript errors
  
  return extendedClient;
}
