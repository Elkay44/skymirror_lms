"use client";

import StudentProjectDetail from './StudentProjectDetail';

interface ClientWrapperProps {
  projectId: string;
}

export default function ClientWrapper({ projectId }: ClientWrapperProps) {
  return <StudentProjectDetail projectId={projectId} />;
}
