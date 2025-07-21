import { PrismaClient, Prisma } from '@prisma/client';
import { ProjectResource } from '@/types/project-resource';

// Extend the base PrismaClient to include our custom methods
type PrismaClientWithExtensions = PrismaClient & {
  $queryRawUnsafe: <T = any>(query: string, ...values: any[]) => Promise<T>;
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<number>;
};

// Base model type with common methods
type BaseModel<T extends Record<string, any> = any> = {
  findMany: (args?: any) => Promise<T[]>;
  findUnique: (args: { where: { id: string } }) => Promise<T | null>;
  findFirst: (args?: any) => Promise<T | null>;
  create: (args: { data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> }) => Promise<T>;
  update: (args: { where: { id: string }; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }) => Promise<T>;
  delete: (args: { where: { id: string } }) => Promise<T>;
  count: (args?: any) => Promise<number>;
  deleteMany: (args?: any) => Promise<{ count: number }>;
  createMany: (args: { data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }) => Promise<{ count: number }>;
};

// Extended Prisma client type
export type ExtendedPrismaClient = PrismaClient & {
  // Project-related models
  project: BaseModel & {
    count: (args?: any) => Promise<number>;
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
  
  // Enrollment model
  enrollment: BaseModel & {
    findFirst: (args: any) => Promise<any | null>;
  };
  
  // Activity log model
  activityLog: {
    create: (args: any) => Promise<any>;
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

// Helper type for model data
type ModelData<T> = T & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

// Create a model with common CRUD operations
const createModel = <T extends Record<string, any>>(
  prisma: PrismaClientWithExtensions, 
  tableName: string
): BaseModel<T> => ({
  findMany: async (args: any = {}) => {
    const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
    const orderByClause = args?.orderBy ? `ORDER BY ${formatOrderByClause(args.orderBy)}` : '';
    const limitClause = args?.take ? `LIMIT ${args.take}` : '';
    const offsetClause = args?.skip ? `OFFSET ${args.skip}` : '';
    
    const query = `SELECT * FROM "${tableName}" ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`.trim();
    const result = await prisma.$queryRawUnsafe<T[]>(query);
    return Array.isArray(result) ? result : [];
  },
  
  findUnique: async (args: { where: { id: string } }) => {
    if (!args?.where?.id) {
      throw new Error('findUnique requires a where.id condition');
    }
    const result = await prisma.$queryRawUnsafe<T[]>(
      `SELECT * FROM "${tableName}" WHERE id = '${args.where.id}' LIMIT 1`
    );
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  },
  
  findFirst: async (args: { where?: any } = {}) => {
    const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
    const result = await prisma.$queryRawUnsafe<T[]>(
      `SELECT * FROM "${tableName}" ${whereClause} LIMIT 1`
    );
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  },
  
  create: async (args: { data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> }): Promise<T> => {
    // Generate a new ID and timestamps
    const id = `temp-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Create the data with required fields
    const dataWithId: ModelData<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> = {
      ...args.data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    // Convert data to SQL values
    const columns = Object.keys(dataWithId).map(k => `"${k}"`).join(', ');
    const values = Object.entries(dataWithId as Record<string, unknown>)
      .map(([key, value]) => {
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === 'object' && value !== null) {
          return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        }
        return `'${value}'`;
      })
      .join(', ');
    
    const result = await prisma.$queryRawUnsafe<T[]>(
      `INSERT INTO "${tableName}" (${columns}) VALUES (${values}) RETURNING *`
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Failed to create record');
    }
    
    return result[0] as T;
  },
  
  update: async (args: { where: { id: string }; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }) => {
    if (!args?.where?.id) {
      throw new Error('update requires a where.id condition');
    }
    
    // Ensure we're working with a plain object
    const updateData = { ...args.data } as Record<string, unknown>;
    updateData.updatedAt = new Date().toISOString();
    
    const updateClause = formatUpdateClause(updateData);
    const result = await prisma.$queryRawUnsafe<T[]>(
      `UPDATE "${tableName}" SET ${updateClause} WHERE id = '${args.where.id}' RETURNING *`
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Failed to update record');
    }
    
    return result[0] as T;
  },
  
  delete: async (args: { where: { id: string } }) => {
    if (!args?.where?.id) {
      throw new Error('delete requires a where.id condition');
    }
    const result = await prisma.$queryRawUnsafe<T[]>(
      `DELETE FROM "${tableName}" WHERE id = '${args.where.id}' RETURNING *`
    );
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Failed to delete record');
    }
    return result[0] as T;
  },
  
  count: async (args: { where?: any } = {}) => {
    const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) FROM "${tableName}" ${whereClause}`
    );
    if (!Array.isArray(result) || result.length === 0) {
      return 0;
    }
    const count = result[0]?.count;
    return count !== undefined ? Number(count) : 0;
  },
  
  deleteMany: async (args: { where?: any } = {}) => {
    const whereClause = args?.where ? `WHERE ${formatWhereClause(args.where)}` : '';
    const count = await prisma.$executeRawUnsafe(
      `DELETE FROM "${tableName}" ${whereClause}`
    );
    // Ensure count is a number
    const countNum = typeof count === 'number' ? count : 0;
    return { count: countNum };
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
});

// Extend the Prisma client with our custom models
export function extendPrismaClient(prisma: PrismaClient): ExtendedPrismaClient {
  const extendedClient = prisma as unknown as ExtendedPrismaClient;

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
  
  // Add course-related models
  extendedClient.course = {
    ...createModel(extendedClient, 'Course'),
    count: (args?: any) => createModel(extendedClient, 'Course').count(args)
  };
  
  // Add enrollment model
  extendedClient.enrollment = {
    ...createModel(extendedClient, 'Enrollment'),
    findFirst: (args: any) => createModel(extendedClient, 'Enrollment').findFirst(args)
  };
  
  // Add activity log model
  extendedClient.activityLog = {
    create: async (args: any) => {
      const insertClause = formatInsertClause(args.data);
      const [result] = await extendedClient.$queryRawUnsafe(
        `INSERT INTO "ActivityLog" ${insertClause} RETURNING *`
      );
      return result;
    }
  };

  return extendedClient;
}
