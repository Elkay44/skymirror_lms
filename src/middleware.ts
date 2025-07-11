import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';

/**
 * SkyMirror Academy LMS Role-Based Access Control System
 * -------------------------------------------------------
 * Implementing a comprehensive privilege system to support our mission
 * of revolutionizing practical knowledge through immersive, hands-on learning
 * experiences. Each role has specific access rights aligned with their 
 * responsibilities in the learning ecosystem.
 */

// Admin routes - Full system access for platform management
const adminRoutes = [
  '/admin',
  '/api/admin',
  '/analytics/global',
  '/system/settings',
  '/user/management',
];

// Instructor routes - Course creation and management
const instructorRoutes = [
  '/dashboard/instructor',
  '/instructor',
  '/api/instructor',
  '/courses/create',
  '/courses/edit',
  '/courses/manage',
  '/analytics/courses',
  '/students/progress',
  '/assessments/create',
  '/assessments/review',
  '/live-sessions/manage',
  '/course-materials/upload',
];

// Mentor routes - Student guidance and personalized support
const mentorRoutes = [
  '/dashboard/mentor',
  '/mentor',
  '/api/mentor',
  '/mentorships/manage',
  '/students/mentees',
  '/career-paths/manage',
  '/student-progress/track',
  '/mentoring-sessions/schedule',
  '/feedback/provide',
  '/learning-plans/create',
];

// Student-specific routes - Learning and skill development
const studentRoutes = [
  '/dashboard/student', 
  '/courses/enrolled',
  '/learning-path',
  '/assessments/take',
  '/progress/view',
  '/certificates',
  '/mentorships/my',
  '/forums/participate',
  '/practice-labs',
  '/projects/my',
  '/peers/connect',
];

// Routes that are accessible without authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth/register',
  '/api/auth/[...nextauth]',
  '/auth/error',
  '/courses',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/forgot-password',
];

// Enhanced middleware with comprehensive role-based access control
export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Always allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }
  
  // Get the session token
  const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                      req.cookies.get('__Secure-next-auth.session-token')?.value;
  
  // If no session token, redirect to login
  if (!sessionToken) {
    const url = new URL(`/login?callbackUrl=${encodeURIComponent(req.url)}`, req.url);
    return NextResponse.redirect(url);
  }
  
  try {
    // Decode the JWT to get user role
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not defined');
      return NextResponse.redirect(new URL('/login', req.url)); // Secure fallback - redirect to login if secret missing
    }
    
    const decoded = await decode({ token: sessionToken, secret });
    const userRole = decoded?.role as string || 'STUDENT';
    
    // Check role-based permissions with role hierarchy
    // ADMIN has access to everything
    // INSTRUCTOR has access to instructor and student routes
    // MENTOR has access to mentor and student routes
    // STUDENT has access to only student routes
    
    // Admin routes check
    if (adminRoutes.some(route => pathname.startsWith(route)) && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // Instructor routes check
    if (instructorRoutes.some(route => pathname.startsWith(route)) && 
        !['INSTRUCTOR', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // Mentor routes check
    if (mentorRoutes.some(route => pathname.startsWith(route)) && 
        !['MENTOR', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // Student routes check - most roles can access student content
    if (studentRoutes.some(route => pathname.startsWith(route)) && 
        !['STUDENT', 'INSTRUCTOR', 'MENTOR', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // Add user role to request headers for use in API routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-role', userRole);
    
    // Continue with modified request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  } catch (error) {
    console.error('Error decoding JWT:', error);
    // If token decoding fails, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }
};

// Configure matcher for specific protected routes only
// This reduces middleware overhead and prevents HTTP 431 errors
export const config = {
  matcher: [
    // Protected routes that need auth checks
    '/dashboard/:path*',
    '/profile/:path*',
    '/courses/my/:path*',
    '/courses/enrolled/:path*',
    '/courses/create/:path*',
    '/courses/edit/:path*',
    '/courses/manage/:path*',
    '/admin/:path*',
    '/instructor/:path*',
    '/mentor/:path*',
    '/mentorships/:path*',
    '/learning-path/:path*',
    '/assessments/:path*',
    '/analytics/:path*',
    '/system/:path*',
    '/user/:path*',
    '/students/:path*',
    '/live-sessions/:path*',
    '/course-materials/:path*',
    '/career-paths/:path*',
    '/mentoring-sessions/:path*',
    '/feedback/:path*',
    '/learning-plans/:path*',
    '/progress/:path*',
    '/certificates/:path*',
    '/forums/:path*',
    '/practice-labs/:path*',
    '/projects/:path*',
    '/peers/:path*',
  ],
};
