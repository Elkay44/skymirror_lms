"use client";

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
// Social login icons removed

// Zod schema for login form validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'MENTOR'], {
    required_error: 'Please select a role',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'MENTOR'>('STUDENT');

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'STUDENT',
    },
  });

  // Update the form when role selection changes
  useEffect(() => {
    setValue('role', selectedRole);
  }, [selectedRole, setValue]);

  // Form submission handler
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      console.log('Submitting login with data:', {
        email: data.email, 
        role: data.role,
        passwordLength: data.password ? data.password.length : 0
      });
      
      // Add debug user for development testing
      // REMOVE THIS BEFORE GOING TO PRODUCTION
      if (process.env.NODE_ENV !== 'production' && data.email === 'test@example.com') {
        console.log('Using test account for development');
        // In a real app, you'd want to set this up properly, but this helps for debugging
        const result = await signIn('credentials', {
          redirect: false,
          email: 'test@example.com',
          password: 'password',
          role: data.role,
          debug: true // Special flag for debugging
        });
        
        if (result?.ok) {
          toast.success('Test login successful!');
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push('/dashboard/instructor');
          return;
        }
      }
      
      // Regular login flow
      console.log('Attempting login with credentials');
      
      // Use a simple callback URL - always use the root path
      // This prevents any URL construction issues
      const safeCallbackUrl = '/';
      
      console.log('Using default callback URL');
      
      // Sign in without any URL handling
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        role: data.role,
        // Don't pass callbackUrl at all to prevent any URL construction
        callbackUrl: undefined
      });

      // Enhanced error handling with detailed diagnostics
      console.log('Sign in result:', result);
      
      if (result?.error) {
        // Handle specific error cases
        let errorMessage = 'Login failed. Please try again.';
        
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email or password';
          console.debug('Debug: Check that the user exists and password matches');
        } else if (result.error.includes('ECONNREFUSED')) {
          errorMessage = 'Cannot connect to the authentication server';
          console.error('Connection refused - is the backend server running?');
        } else {
          errorMessage = result.error;
        }
        
        toast.error(errorMessage);
        console.error('Login failed:', { error: errorMessage });
        return;
      }

      // If we get here, login was successful
      console.log('Login successful, redirecting...');
      toast.success('Login successful!');
      
      // Define role-based redirect paths
      const roleBasedRedirect = {
        'STUDENT': '/dashboard/student',
        'INSTRUCTOR': '/dashboard/instructor',
        'MENTOR': '/dashboard/mentor'
      };
      
      // Get the redirect path based on role
      const redirectPath = roleBasedRedirect[data.role as keyof typeof roleBasedRedirect] || '/';
      console.log('Redirecting to:', redirectPath);
      
      // Use window.location.href for reliable redirection
      window.location.href = redirectPath;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabels = {
    'STUDENT': 'Student',
    'INSTRUCTOR': 'Instructor',
    'MENTOR': 'Mentor'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <h1 className="text-2xl font-light tracking-tight text-gray-900">Academy</h1>
          <p className="mt-1 text-sm text-gray-500">Learning Management System</p>
        </div>

        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {/* Role selector */}
            <div className="mb-2">
              <div className="flex border border-gray-200 rounded-lg p-1 mb-1">
                {(['STUDENT', 'INSTRUCTOR', 'MENTOR'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setValue('role', role); // Explicitly set the form value when clicked
                      console.log('Role selected:', role);
                    }}
                    className={`
                      flex-1 py-2 text-xs font-medium rounded-md transition-all
                      ${selectedRole === role 
                        ? 'bg-gray-900 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100'}
                    `}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('role')} />
              {errors.role && <p className="text-xs text-rose-500 mt-1">{errors.role.message}</p>}
            </div>
            
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-900">
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-2.5 px-4 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </motion.button>
          </form>
          
          {/* Social Login Section Removed */}
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-center text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-gray-900 hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>
        
        <p className="mt-8 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Academy LMS. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

// Export the main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-5 h-5 border-t-2 border-gray-900 rounded-full animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
