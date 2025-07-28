import { Metadata } from 'next';
import { Suspense } from 'react';
import MessagesPageClient from './MessagesPageClient';

export const metadata: Metadata = {
  title: 'Messages | SkyMirror Academy',
  description: 'View and send messages',
};

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse space-y-4 w-full max-w-4xl p-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <MessagesPageClient />
    </Suspense>
  );
}
