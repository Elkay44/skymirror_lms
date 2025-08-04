"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstructorRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard/instructor/courses');
  }, [router]);
  
  return (
    <div className="flex justify-center items-center min-h-[50vh] min-w-0">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2 break-words">Redirecting...</h2>
        <p className="text-gray-600">Taking you to instructor dashboard</p>
        <div className="mt-4 w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
