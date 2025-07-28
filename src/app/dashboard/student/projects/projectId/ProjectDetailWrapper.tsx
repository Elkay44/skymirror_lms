'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the ProjectDetail component with SSR disabled
const ProjectDetail = dynamic(() => import('./ProjectDetail'), {
  ssr: false,
  loading: () => <div>Loading project details...</div>
});

function ProjectDetailWrapper() {
  return (
    <Suspense fallback={<div>Loading project details...</div>}>
      <ProjectDetail />
    </Suspense>
  );
}

export default ProjectDetailWrapper;
