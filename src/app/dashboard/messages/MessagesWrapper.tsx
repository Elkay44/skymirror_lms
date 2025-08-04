'use client';

import dynamic from 'next/dynamic';

const MessagesClient = dynamic(
  () => import('./MessagesClient'),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center min-h-screen min-w-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }
);

export default function MessagesWrapper() {
  return <MessagesClient />;
}
