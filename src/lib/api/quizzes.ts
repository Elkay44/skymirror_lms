import { Quiz, CreateQuizRequest, UpdateQuizRequest } from '@/types/quiz';

// Get all quizzes for a course
export async function getQuizzes(courseId: string): Promise<Quiz[]> {
  const response = await fetch(`/api/courses/${courseId}/quizzes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quizzes');
  }

  return await response.json();
}

// Get a single quiz by ID
export async function getQuiz(courseId: string, quizId: string): Promise<Quiz> {
  const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quiz');
  }

  return await response.json();
}

// Get quizzes for a specific module
export async function getModuleQuizzes(courseId: string, moduleId: string): Promise<Quiz[]> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/quizzes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch module quizzes');
  }

  return await response.json();
}

// Create a new quiz
export async function createQuiz(courseId: string, moduleId: string, data: CreateQuizRequest): Promise<Quiz> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create quiz');
  }

  return await response.json();
}

// Update a quiz
export async function updateQuiz(courseId: string, quizId: string, data: UpdateQuizRequest): Promise<Quiz> {
  const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update quiz');
  }

  return await response.json();
}

// Delete a quiz
export async function deleteQuiz(courseId: string, quizId: string): Promise<void> {
  const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete quiz');
  }
}
