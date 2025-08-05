"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isPublished: boolean;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    title: string;
    courseId: string;
  };
  nextLesson?: string;
  previousLesson?: string;
}

export default function StudentLessonPage() {
  const params = useParams();
  const { courseId, moduleId, lessonId } = params;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

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
        // Check if lesson is completed by the student
        checkLessonCompletion();
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

  const checkLessonCompletion = async () => {
    try {
      const response = await fetch(`/api/students/${lessonId}/progress`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setIsCompleted(data.completed);
      }
    } catch (error) {
      console.error('Error checking lesson completion:', error);
    }
  };

  const markAsComplete = async () => {
    try {
      const response = await fetch(`/api/students/${lessonId}/progress`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
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
          <div className="text-red-500 text-lg mb-4 break-words">{error || 'Lesson not found'}</div>
          <Link 
            href={`/dashboard/student/courses/${courseId}/modules/${moduleId}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Module
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link 
                href={`/dashboard/student/courses/${courseId}/modules/${moduleId}`}
                className="inline-flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Module
              </Link>
              <div className="flex items-center gap-4">
                <button
                  onClick={markAsComplete}
                  className={`px-4 py-2 rounded-lg ${
                    isCompleted 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isCompleted ? 'Completed' : 'Mark as Complete'}
                </button>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Title and Description */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 break-words">{lesson.title}</h1>
                {lesson.description && (
                  <p className="text-gray-600 text-sm break-words">{lesson.description}</p>
                )}
              </div>

              {/* Video Content */}
              {lesson.videoUrl && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <iframe
                    src={lesson.videoUrl}
                    className="w-full aspect-video"
                    title="Lesson Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Text Content */}
              {lesson.content && (
                <div className="prose max-w-none break-words" dangerouslySetInnerHTML={{ __html: lesson.content }} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4">
            {/* Lesson Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 break-words">Lesson Info</h3>
              <div className="space-y-2 text-sm text-gray-600 break-words">
                <div>Duration: {lesson.duration ? `${lesson.duration} min` : 'Not set'}</div>
                <div>Position: #{lesson.order}</div>
                <div>Status: {lesson.isPublished ? 'Published' : 'Draft'}</div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 break-words">Navigation</h3>
              <div className="space-y-2">
                {lesson.previousLesson ? (
                  <Link
                    href={`/dashboard/student/courses/${courseId}/modules/${moduleId}/lessons/${lesson.previousLesson}`}
                    className="block text-sm text-blue-600 hover:text-blue-800 break-words"
                  >
                    ← Previous Lesson
                  </Link>
                ) : (
                  <span className="block text-sm text-gray-400 break-words">← Previous Lesson</span>
                )}
                
                {lesson.nextLesson ? (
                  <Link
                    href={`/dashboard/student/courses/${courseId}/modules/${moduleId}/lessons/${lesson.nextLesson}`}
                    className="block text-sm text-blue-600 hover:text-blue-800 break-words"
                  >
                    Next Lesson →
                  </Link>
                ) : (
                  <span className="block text-sm text-gray-400 break-words">Next Lesson →</span>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 break-words">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/student/courses/${courseId}/modules/${moduleId}`}
                  className="block text-sm text-blue-600 hover:text-blue-800 break-words"
                >
                  Back to Module
                </Link>
                <Link
                  href={`/dashboard/student/courses/${courseId}`}
                  className="block text-sm text-blue-600 hover:text-blue-800 break-words"
                >
                  Course Overview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
