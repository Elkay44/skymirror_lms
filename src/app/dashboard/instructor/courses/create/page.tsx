'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CourseFormProvider } from '@/context/CourseFormContext';
import { CourseForm } from '@/components/course/CourseForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';


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


