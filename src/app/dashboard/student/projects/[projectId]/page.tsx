import { Metadata } from 'next';
import { Suspense } from 'react';
import ClientWrapper from './ClientWrapper';

export const metadata: Metadata = {
  title: 'Project Details | SkyMirror Academy',
  description: 'View and submit your project assignment',
};

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <ClientWrapper projectId={resolvedParams.projectId} />
    </Suspense>
  );
}
