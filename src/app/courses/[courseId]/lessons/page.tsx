"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Play,
  CheckCircle,
  Lock,
  Eye
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
  module: {
    id: string;
    title: string;
  };
  progress?: {
    completed: boolean;
    completedAt?: string;
    timeSpent?: number;
  };
  isAccessible?: boolean;
}

export default function StudentLessonsPage() {
  const params = useParams();
  const { courseId } = params;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/lessons`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }

      const data = await response.json();
      if (data.success) {
        setLessons(data.data.lessons || []);
        setCourse(data.data.course);
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

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Duration not set';
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

  const getStatusBadge = (lesson: Lesson) => {
    if (lesson.progress?.completed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      );
    }

    if (!lesson.isAccessible) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          <Lock className="h-3 w-3 mr-1" />
          Locked
        </span>
      );
    }

    if (lesson.isPreview) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Eye className="h-3 w-3 mr-1" />
          Preview
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Not Started
      </span>
    );
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
            href={`/courses/${courseId}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Course
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
                href={`/courses/${courseId}`}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Course
              </Link>
              <div className="text-gray-300 dark:text-gray-600">|</div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Lessons
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {course?.title || 'Course'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No lessons available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your instructor hasn't published any lessons yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lessons
              .filter(lesson => lesson.isPublished || lesson.isPreview)
              .sort((a, b) => a.order - b.order)
              .map((lesson) => (
                <div
                  key={lesson.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                    !lesson.isAccessible ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {lesson.order}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {lesson.title}
                          </h3>
                          {getStatusBadge(lesson)}
                        </div>

                        {lesson.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            <span>Module: {lesson.module.title}</span>
                          </div>

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

                          {lesson.progress?.completed && lesson.progress.completedAt && (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                              <span className="text-green-600 dark:text-green-400">
                                Completed {formatDate(lesson.progress.completedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {lesson.isAccessible || lesson.isPreview ? (
                        <Link
                          href={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {lesson.progress?.completed ? 'Review' : 'Start'}
                        </Link>
                      ) : (
                        <div className="flex items-center px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                          <Lock className="h-4 w-4 mr-2" />
                          Locked
                        </div>
                      )}
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
