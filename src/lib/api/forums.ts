import { ForumTopic, ForumPost, CreateForumTopicRequest, CreateForumPostRequest } from '@/types/forum';

// Get all topics for a module forum
export async function getModuleTopics(courseId: string, moduleId: string): Promise<ForumTopic[]> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forums`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch forum topics');
  }

  const result = await response.json();
  return result.data || [];
}

// Get a single forum topic with posts
export async function getTopic(courseId: string, topicId: string): Promise<ForumTopic> {
  const response = await fetch(`/api/courses/${courseId}/forum/topics/${topicId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch forum topic');
  }

  return await response.json();
}

// Create a new forum topic
export async function createTopic(courseId: string, moduleId: string, data: CreateForumTopicRequest): Promise<ForumTopic> {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/forum/topics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create forum topic');
  }

  return await response.json();
}

// Create a new forum post (reply)
export async function createPost(courseId: string, topicId: string, data: CreateForumPostRequest): Promise<ForumPost> {
  const response = await fetch(`/api/courses/${courseId}/forum/topics/${topicId}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create forum post');
  }

  return await response.json();
}
