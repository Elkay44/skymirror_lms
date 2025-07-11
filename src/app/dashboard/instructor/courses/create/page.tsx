'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CourseFormProvider } from '@/context/CourseFormContext';
import { CourseForm } from '@/components/course/CourseForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreateCoursePage() {
  const router = useRouter();

  const handleSuccess = (courseId: string) => {
    toast.success('Course created successfully!');
    router.push(`/dashboard/instructor/courses/${courseId}`);
  };

  const handleError = (error: Error) => {
    console.error('Course creation error:', error);
    toast.error('Failed to create course. Please try again.');
  };

  return (
    <ErrorBoundary>
      <CourseFormProvider onSuccess={handleSuccess} onError={handleError}>
        <div className="container mx-auto py-8 px-4">
          <CourseForm />
        </div>
      </CourseFormProvider>
    </ErrorBoundary>
  );
}

// Skeleton loading component for better UX
function CourseFormSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-12 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex justify-end space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
