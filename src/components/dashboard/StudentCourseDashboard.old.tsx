"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

export default function StudentCourseDashboard() {
  const router = useRouter();

  // This component is deprecated - use the main StudentCourseDashboard instead
  // All mock data has been removed - this file should be deleted
  
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4 break-words">This component is deprecated</h1>
            <p className="text-gray-600 mb-4">Please use the main StudentCourseDashboard component instead.</p>
            <Button onClick={() => router.push('/dashboard/student/courses')}>
              Go to Courses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );


}
