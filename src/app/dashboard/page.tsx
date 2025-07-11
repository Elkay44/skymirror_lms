"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Smart Dashboard Entry Point
 * 
 * This component detects the user's role and redirects them to the appropriate
 * role-specific dashboard (student, instructor, or mentor).
 */
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      // Not authenticated, redirect to login
      console.log('No session found, redirecting to login');
      router.push('/login');
      return;
    }
    
    // Check user role and redirect to the appropriate dashboard
    const userRole = session?.user?.role;
    console.log('Dashboard router detected role:', userRole);
    
    if (!userRole) {
      console.log('No role found in session, redirecting to onboarding');
      router.push('/onboarding');
      return;
    }
    
    switch (userRole) {
      case 'STUDENT':
        console.log('Redirecting to student dashboard');
        router.push('/dashboard/student');
        break;
      case 'INSTRUCTOR':
        console.log('Redirecting to instructor dashboard');
        router.push('/dashboard/instructor');
        break;
      case 'MENTOR':
        console.log('Redirecting to mentor dashboard');
        router.push('/dashboard/mentor');
        break;
      default:
        // Default to student dashboard if role is unrecognized
        console.log('Unknown role, defaulting to student dashboard');
        router.push('/dashboard/student');
    }
  }, [session, status, router]);
  
  // Show loading spinner while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading your dashboard...</h2>
        <p className="mt-2 text-gray-500">Please wait while we personalize your experience</p>
      </div>
    </div>
  );
}
