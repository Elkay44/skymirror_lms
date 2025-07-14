import { Assignment, CreateAssignmentRequest, UpdateAssignmentRequest } from '@/types/assignment';

// Get all assignments for a course
export async function getAssignments(courseId: string): Promise<Assignment[]> {
  const response = await fetch(`/api/courses/${courseId}/assignments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch assignments');
  }

  return await response.json();
}

// Get a single assignment by ID
export async function getAssignment(courseId: string, assignmentId: string): Promise<Assignment> {
  const response = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch assignment');
  }

  return await response.json();
}

// Get assignments for a specific module
export async function getModuleAssignments(courseId: string, moduleId: string): Promise<Assignment[]> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/assignments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch module assignments');
  }

  return await response.json();
}

// Create a new assignment
export async function createAssignment(courseId: string, moduleId: string, data: CreateAssignmentRequest): Promise<Assignment> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create assignment');
  }

  return await response.json();
}

// Update an assignment
export async function updateAssignment(courseId: string, assignmentId: string, data: UpdateAssignmentRequest): Promise<Assignment> {
  const response = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update assignment');
  }

  return await response.json();
}

// Delete an assignment
export async function deleteAssignment(courseId: string, assignmentId: string): Promise<void> {
  const response = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete assignment');
  }
}
