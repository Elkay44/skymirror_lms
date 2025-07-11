"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Profile Entry Point - Redirects to role-specific profiles
 */
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Only proceed if session is loaded
    if (status === 'loading') return;
    
    // Handle unauthenticated users
    if (!session) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }
    
    // Get user role and normalize for case-insensitive comparison
    const userRole = (session?.user?.role || 'STUDENT').toUpperCase();
    console.log('Redirecting based on role:', userRole);
    
    // Simple mapping of roles to profile paths with proper typing
    const profilePaths: Record<string, string> = {
      'STUDENT': '/dashboard/profile/student',
      'INSTRUCTOR': '/dashboard/profile/instructor',
      'MENTOR': '/dashboard/profile/mentor'
    };
    
    // Redirect to the appropriate profile page or default to student
    const redirectPath = profilePaths[userRole] || '/dashboard/profile/student';
    console.log('Redirecting to:', redirectPath);
    router.push(redirectPath);
  }, [session, status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading your profile...</h2>
        <p className="mt-2 text-gray-500">Please wait while we personalize your experience</p>
      </div>
    </div>
  );
}
