import { Project } from '@/types/module';

// Get all projects for a course
export async function getProjects(courseId: string): Promise<Project[]> {
  const response = await fetch(`/api/courses/${courseId}/projects`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch projects');
  }

  const data = await response.json();
  return data.data;
}

// Get a single project by ID
export async function getProject(courseId: string, projectId: string): Promise<Project> {
  const response = await fetch(`/api/courses/${courseId}/projects/${projectId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch project');
  }

  const data = await response.json();
  return data.data;
}

// Get projects for a specific module
export async function getModuleProjects(courseId: string, moduleId: string): Promise<Project[]> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/projects`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch module projects');
  }

  const data = await response.json();
  return data.data;
}
