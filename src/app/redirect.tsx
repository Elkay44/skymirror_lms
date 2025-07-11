"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RedirectProps {
  to: string;
}

export default function Redirect({ to }: RedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.push(to);
  }, [router, to]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Redirecting to {to}...</p>
      </div>
    </div>
  );
}
