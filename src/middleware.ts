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
  '/dashboard/mentors',
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
  
  // Debug logging for incoming request
  console.log('Middleware - Processing request for path:', pathname);
  console.log('Middleware - Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Always allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }
  
  // Get the session token
  const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                      req.cookies.get('__Secure-next-auth.session-token')?.value;
  
  console.log('Middleware - Session token found:', !!sessionToken);
  
  // Allow requests without session token if they're not protected routes
  if (!sessionToken) {
    console.log('Middleware - No session token but allowing access for non-protected routes');
    return NextResponse.next();
  }
  
  try {
    // Decode the JWT to get user role
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not defined');
      return NextResponse.redirect(new URL('/login', req.url)); // Secure fallback - redirect to login if secret missing
    }
    
    console.log('Middleware - Decoding JWT token');
    const decodedData = await decode({ token: sessionToken, secret }) || {};
    const userRole = decodedData.role as string || 'STUDENT';
    
    // Log JWT decoding result
    console.log('Middleware - Successfully decoded JWT:', { 
      hasRole: !!decodedData.role, 
      userRole,
      decodedKeys: Object.keys(decodedData)
    });
    
    // Allow access to student routes for all roles
    if (studentRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }
    
    // Check route access based on role
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'ADMIN') {
        console.log('Middleware - Unauthorized access to admin route');
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
    
    if (instructorRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
        console.log('Middleware - Unauthorized access to instructor route');
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
    
    if (mentorRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'MENTOR' && userRole !== 'ADMIN') {
        console.log('Middleware - Unauthorized access to mentor route');
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
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
    '/mentors/:path*',
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

// Add debug logging for middleware configuration
console.log('Middleware configured with matchers:', config.matcher);

console.log('Middleware configured with matchers:', config.matcher);
