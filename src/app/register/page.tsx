import { Suspense } from 'react';
import RegisterForm from './register-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Skeleton className="h-12 w-12 mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto mt-6" />
          <Skeleton className="h-4 w-64 mx-auto mt-2" />
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
