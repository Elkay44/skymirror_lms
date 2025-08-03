"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Play, 
  Clock, 
  BookOpen,
  Save,
  X
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isPublished?: boolean;
  isPreview?: boolean;
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    title: string;
    courseId: string;
  };
  nextLesson?: string;
  previousLesson?: string;
  canEdit: boolean;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { courseId, moduleId, lessonId } = params;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    duration: 0,
    videoUrl: ''
  });

  useEffect(() => {
    fetchLesson();
  }, [courseId, moduleId, lessonId]);

  const fetchLesson = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Lesson not found');
        } else {
          setError('Failed to load lesson');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setLesson(data.data);
        setEditForm({
          title: data.data.title,
          description: data.data.description || '',
          duration: data.data.duration || 0,
          videoUrl: data.data.videoUrl || ''
        });
      } else {
        setError(data.error || 'Failed to load lesson');
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setError('Failed to load lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (lesson) {
      setEditForm({
        title: lesson.title,
        description: lesson.description || '',
        duration: lesson.duration || 0,
        videoUrl: lesson.videoUrl || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update lesson');
      }

      const data = await response.json();
      if (data.success) {
        await fetchLesson(); // Refresh lesson data
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update lesson');
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      setError('Failed to update lesson');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete lesson');
      }

      const data = await response.json();
      if (data.success) {
        // Redirect back to modules page
        router.push(`/dashboard/instructor/courses/${courseId}/modules`);
      } else {
        setError(data.error || 'Failed to delete lesson');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setError('Failed to delete lesson');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error || 'Lesson not found'}</div>
          <Link 
            href={`/dashboard/instructor/courses/${courseId}/modules`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Modules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/dashboard/instructor/courses/${courseId}/modules`}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Modules
              </Link>
              <div className="text-gray-300 dark:text-gray-600">|</div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Lesson' : lesson.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lesson.module.title}
                </p>
              </div>
            </div>

            {lesson.canEdit && (
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={editForm.duration}
                          onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Video URL
                        </label>
                        <input
                          type="url"
                          value={editForm.videoUrl}
                          onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {lesson.title}
                      </h2>
                      {lesson.description && (
                        <p className="text-gray-600 dark:text-gray-300">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    {lesson.videoUrl && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Video Content
                        </h3>
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">
                              Video: {lesson.videoUrl}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Lesson Content
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-600 dark:text-gray-300">
                          {lesson.content || 'No content available yet. Edit this lesson to add content.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lesson Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Lesson Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {lesson.duration ? `${lesson.duration} minutes` : 'Duration not set'}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Order: {lesson.order}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Navigation
              </h3>
              <div className="space-y-2">
                {lesson.previousLesson && (
                  <Link
                    href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.previousLesson}`}
                    className="block w-full px-3 py-2 text-left text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    ← Previous Lesson
                  </Link>
                )}
                {lesson.nextLesson && (
                  <Link
                    href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.nextLesson}`}
                    className="block w-full px-3 py-2 text-left text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    Next Lesson →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
