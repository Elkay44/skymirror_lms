'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Immediately redirect to the login page when the component mounts
    router.replace('/login');
  }, [router]);
  
  // Return a minimal loading state that will only briefly appear
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5 h-5 border-t-2 border-gray-500 rounded-full animate-spin"></div>
    </div>
  );
}
