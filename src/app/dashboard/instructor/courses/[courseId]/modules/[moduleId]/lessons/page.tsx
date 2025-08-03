"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  Clock, 
  Play,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  GripVertical
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
}

export default function LessonsListPage() {
  const params = useParams();
  const { courseId, moduleId } = params;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<any>(null);

  useEffect(() => {
    fetchLessons();
  }, [courseId, moduleId]);

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }

      const data = await response.json();
      if (data.success) {
        setLessons(data.data.lessons || []);
        setModule(data.data.module);
      } else {
        setError(data.error || 'Failed to load lessons');
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setError('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
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
        await fetchLessons(); // Refresh list
      } else {
        setError(data.error || 'Failed to delete lesson');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setError('Failed to delete lesson');
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'No duration set';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
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
                  Lessons
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {module?.title || 'Module'}
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lesson/create`}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Lesson
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No lessons yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first lesson for this module.
            </p>
            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lesson/create`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Lesson
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lessons
              .sort((a, b) => a.order - b.order)
              .map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {lesson.order}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link
                            href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
                            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            {lesson.title}
                          </Link>
                          
                          {lesson.isPublished ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              Draft
                            </span>
                          )}

                          {lesson.isPreview && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </span>
                          )}
                        </div>

                        {lesson.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatDuration(lesson.duration)}</span>
                          </div>

                          {lesson.videoUrl && (
                            <div className="flex items-center">
                              <Play className="h-4 w-4 mr-1" />
                              <span>Has video</span>
                            </div>
                          )}

                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            <span>Updated {formatDate(lesson.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Edit lesson"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete lesson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
