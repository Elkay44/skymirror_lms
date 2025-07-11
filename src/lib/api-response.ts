import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
    timestamp: string;
    requestId?: string;
    filters?: Record<string, any>;
  };
}

/**
 * Creates a successful API response
 */
export function successResponse<T = any>(
  data: T,
  message?: string,
  meta?: Partial<ApiResponse<T>['meta']>
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
  
  if (message) {
    response.message = message;
  }
  
  return NextResponse.json(response);
}

/**
 * Creates a success response with pagination
 */
export function paginatedResponse<T = any>(
  data: T,
  page: number,
  limit: number,
  total: number,
  message?: string,
  filters?: Record<string, any>
): NextResponse {
  const totalPages = Math.ceil(total / limit);
  
  return successResponse(data, message, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    },
    filters
  });
}

/**
 * Creates an error API response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code: code || `ERR_${status}`,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const CommonErrors = {
  unauthorized: (message: string = 'Authentication required') => 
    errorResponse(message, 401, 'ERR_UNAUTHORIZED'),
  
  forbidden: (message: string = 'You do not have permission to access this resource') => 
    errorResponse(message, 403, 'ERR_FORBIDDEN'),
  
  notFound: (message: string = 'Resource not found') => 
    errorResponse(message, 404, 'ERR_NOT_FOUND'),
  
  validation: (message: string = 'Validation failed', details?: any) => 
    errorResponse(message, 400, 'ERR_VALIDATION', details),
  
  badRequest: (message: string = 'Bad request', details?: any) => 
    errorResponse(message, 400, 'ERR_BAD_REQUEST', details),
  
  serverError: (message: string = 'Internal server error', details?: any) => 
    errorResponse(message, 500, 'ERR_SERVER_ERROR', details),
  
  serviceUnavailable: (message: string = 'Service temporarily unavailable') => 
    errorResponse(message, 503, 'ERR_SERVICE_UNAVAILABLE')
};

/**
 * Utility function to handle errors in API routes
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string = 'An unexpected error occurred'
): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error: unknown) {
    console.error(`[API_ERROR]`, error);
    
    // Type guard for ZodError
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError' && 'errors' in error) {
      return CommonErrors.validation('Validation failed', (error as { errors: any }).errors);
    }
    
    // Type guard for Prisma errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'PrismaClientKnownRequestError' && 'code' in error) {
      // Handle specific Prisma errors
      const prismaError = error as { code: string };
      switch (prismaError.code) {
        case 'P2002':
          return CommonErrors.badRequest('A record with this value already exists');
        case 'P2025':
          return CommonErrors.notFound('Record not found');
        default:
          return CommonErrors.serverError(errorMessage);
      }
    }
    
    return CommonErrors.serverError(errorMessage);
  }
}
