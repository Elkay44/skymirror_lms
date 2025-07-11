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
    
    // Extract and normalize user role
    const role = session?.user?.role || '';
    const normalizedRole = role.toUpperCase();
    
    console.log('User session:', { 
      name: session?.user?.name,
      email: session?.user?.email,
      role: normalizedRole,
      id: session?.user?.id
    });
    
    // Direct routing based on role
    if (normalizedRole === 'STUDENT') {
      router.push('/profile/student');
    } else if (normalizedRole === 'INSTRUCTOR') {
      router.push('/profile/instructor');
    } else if (normalizedRole === 'MENTOR') {
      router.push('/profile/mentor');
    } else {
      // Default fallback for unknown roles
      console.warn('Unknown user role:', normalizedRole, 'defaulting to student profile');
      router.push('/profile/student');
    }
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
