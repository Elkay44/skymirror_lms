/**
 * API utilities for consistent error handling and response formatting
 * across all API routes in the Academy LMS application
 */

import { NextResponse } from 'next/server';

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a success response with standard format
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

/**
 * Create an error response with standard format
 */
export function createErrorResponse(error: string, status: number = 500): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status }
  );
}

/**
 * Standard unauthorized response
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse<null>> {
  return createErrorResponse(message, 401);
}

/**
 * Standard not found response
 */
export function createNotFoundResponse(message: string = 'Resource not found'): NextResponse<ApiResponse<null>> {
  return createErrorResponse(message, 404);
}

/**
 * Standard bad request response
 */
export function createBadRequestResponse(message: string = 'Bad request'): NextResponse<ApiResponse<null>> {
  return createErrorResponse(message, 400);
}

/**
 * Standard authentication validation
 * @returns true if authenticated, false otherwise
 */
export function validateAuthentication(session: any): boolean {
  return !!session?.user;
}

/**
 * Standard role validation
 * @returns true if user has required role, false otherwise
 */
export function validateRole(session: any, requiredRole: string): boolean {
  return !!session?.user?.role && session.user.role === requiredRole;
}
