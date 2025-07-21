import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import dynamic from 'next/dynamic';

// Dynamically import client-side components with named exports
const Sidebar = dynamic(
  () => import('@/components/admin/Sidebar').then((mod) => mod.Sidebar),
  { ssr: true }
);

const MainNav = dynamic(
  () => import('@/components/admin/MainNav').then((mod) => mod.MainNav),
  { ssr: true }
);

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated or not an admin
  if (!session) {
    redirect('/login?callbackUrl=/admin/dashboard');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <MainNav />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
