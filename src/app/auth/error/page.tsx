"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Error messages for different authentication error types
const errorMessages: Record<string, string> = {
  default: "An error occurred during authentication.",
  configuration: "There's a problem with the authentication configuration. Please contact support.",
  accessdenied: "You don't have permission to access this resource.",
  verification: "The verification link has expired or has already been used.",
  existingaccount: "An account already exists with a different provider.",
  signin: "There was a problem signing in. Please try again.",
  oauthsignin: "There was a problem with the OAuth provider. Please try again.",
  oauthcallback: "There was a problem with the OAuth callback. Please try again.",
  oauthcreateaccount: "There was a problem creating your account. Please try again.",
  emailcreateaccount: "There was a problem creating your account. Please try again.",
  callback: "There was a problem with the authentication callback. Please try again.",
  oauthaccountnotlinked: "To confirm your identity, sign in with the same account you used originally."
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('default');
  const [errorDescription, setErrorDescription] = useState<string>('');

  useEffect(() => {
    // Get the error type from the URL search parameters
    const errorParam = searchParams?.get('error')?.toLowerCase() || 'default';
    setError(errorParam);

    // Check if there's a custom error message
    const errorDescriptionParam = searchParams?.get('error_description');
    if (errorDescriptionParam) {
      setErrorDescription(errorDescriptionParam);
    }
  }, [searchParams]);

  // Get the appropriate error message
  const errorMessage = errorDescription || errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link href="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Return to Login
          </Link>
          <Link href="/" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

// Export the main component with Suspense boundary
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
