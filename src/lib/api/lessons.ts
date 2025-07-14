import { Lesson, CreateLessonRequest, UpdateLessonRequest } from '@/types/lesson';

// Get all lessons for a course
export async function getLessons(courseId: string): Promise<Lesson[]> {
  const response = await fetch(`/api/courses/${courseId}/lessons`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch lessons');
  }

  return await response.json();
}

// Get a single lesson by ID
export async function getLesson(courseId: string, lessonId: string): Promise<Lesson> {
  const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch lesson');
  }

  return await response.json();
}

// Get lessons for a specific module
export async function getModuleLessons(courseId: string, moduleId: string): Promise<Lesson[]> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch module lessons');
  }

  return await response.json();
}

// Create a new lesson
export async function createLesson(courseId: string, moduleId: string, data: CreateLessonRequest): Promise<Lesson> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create lesson');
  }

  return await response.json();
}

// Update a lesson
export async function updateLesson(courseId: string, lessonId: string, data: UpdateLessonRequest): Promise<Lesson> {
  const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update lesson');
  }

  return await response.json();
}

// Delete a lesson
export async function deleteLesson(courseId: string, lessonId: string): Promise<void> {
  const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete lesson');
  }
}
