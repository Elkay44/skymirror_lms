'use client';

import dynamic from 'next/dynamic';

// Import MessagesWrapper with SSR disabled
const MessagesWrapper = dynamic(
  () => import('./MessagesWrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen min-w-0">
        <div className="animate-pulse space-y-4 w-full max-w-4xl p-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
);

export default function MessagesPageClient() {
  return <MessagesWrapper />;
}
