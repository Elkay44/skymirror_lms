import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Add your admin layout structure here */}
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  );
}
