"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

// Define schema for onboarding form
const onboardingSchema = z.object({
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'MENTOR'], {
    required_error: 'Please select a role',
  }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(50),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'MENTOR'>('STUDENT');

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: 'STUDENT',
      name: session?.user?.name || '',
      agreeToTerms: false,
    },
  });

  // Update form when session changes
  useEffect(() => {
    if (session?.user?.name) {
      setValue('name', session.user.name);
    }
  }, [session, setValue]);

  // Update role value when selection changes
  useEffect(() => {
    setValue('role', selectedRole);
  }, [selectedRole, setValue]);

  // Handle authentication state and redirects
  useEffect(() => {
    if (status === 'authenticated') {
      // Check if the user has the needsOnboarding flag
      if ((session?.user as any)?.needsOnboarding) {
        console.log('User needs to complete onboarding');
        // We're already on the onboarding page, so no redirect needed
        return;
      }
      
      // User already has a role, redirect to dashboard
      if (session?.user?.role) {
        const roleBasedRedirect = {
          'STUDENT': '/dashboard/student',
          'INSTRUCTOR': '/dashboard/instructor',
          'MENTOR': '/dashboard/mentor'
        }[session.user.role] || '/';
        
        console.log(`User has role ${session.user.role}, redirecting to ${roleBasedRedirect}`);
        router.push(roleBasedRedirect);
      }
    } else if (status === 'unauthenticated') {
      // User is not authenticated, redirect to login
      router.push('/login');
    }
  }, [session, status, router]);

  // Handle form submission
  const onSubmit = async (data: OnboardingFormValues) => {
    setIsLoading(true);
    
    try {
      console.log('Submitting onboarding data:', data);
      
      // Update user profile with selected role
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          role: data.role,
        }),
      });

      const result = await response.json();
      console.log('Onboarding API response:', result);

      if (!response.ok) {
        toast.error(result.error || 'Failed to update profile');
      } else {
        // Update the session with the new role and other properties
        await update({ 
          role: data.role,
          // Clear the needsOnboarding flag
          needsOnboarding: false
        });
        
        toast.success('Profile updated successfully!');
        
        // Force a session refresh to ensure we have updated data
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        console.log('Role set during onboarding:', data.role);
        
        // Redirect based on role
        const roleBasedRedirect = {
          'STUDENT': '/dashboard/student',
          'INSTRUCTOR': '/dashboard/instructor',
          'MENTOR': '/dashboard/mentor'
        }[data.role] || '/';
        
        console.log(`Redirecting to ${roleBasedRedirect}`);
        router.push(roleBasedRedirect);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If not authenticated, redirect to login
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // While checking auth status, show loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const roleLabels = {
    'STUDENT': 'Student',
    'INSTRUCTOR': 'Instructor',
    'MENTOR': 'Mentor'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Complete your profile</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let's set up your account so you can get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select your role
              </label>
              <div className="flex border border-gray-300 rounded-md p-1">
                {(['STUDENT', 'INSTRUCTOR', 'MENTOR'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`
                      flex-1 py-2 text-sm font-medium rounded-md transition-all
                      ${selectedRole === role 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-gray-700 hover:text-indigo-700'}
                    `}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('role')} />
              {errors.role && (
                <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                <p className="mb-1 font-medium text-gray-700">Role descriptions:</p>
                <ul className="space-y-1 list-disc pl-5">
                  <li><span className="font-medium">Student</span>: Enroll in courses, submit assignments, and earn certificates</li>
                  <li><span className="font-medium">Instructor</span>: Create and manage courses, grade assignments, and issue certificates</li>
                  <li><span className="font-medium">Mentor</span>: Provide guidance and support to students</li>
                </ul>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  {...register('agreeToTerms')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                    terms and conditions
                  </Link>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
                )}
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Complete Setup'}
              </button>
            </div>
            
            {/* Cancel option */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel and sign out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
