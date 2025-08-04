"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateLesson } from '@/lib/api/lessons';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Save,
  X,
  PlayCircle,
  FileText
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
    content: '',
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
          content: data.data.content || '',
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4 break-words">{error || 'Lesson not found'}</div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => router.push(`/dashboard/instructor/courses/${lesson.module.courseId}/modules/${lesson.module.id}`)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3 break-words min-w-0"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to {lesson.module.title}
            </button>
            
            <div className="flex items-center justify-between min-w-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 break-words">{lesson.title}</h1>
                {lesson.description && (
                  <p className="text-gray-600 mt-1">{lesson.description}</p>
                )}
              </div>
              
              {lesson.canEdit && (
                <div className="flex gap-2 min-w-0">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`inline-flex items-center px-3 py-2 rounded text-sm font-medium ${
                      isEditing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 rounded text-sm font-medium hover:bg-red-100 break-words min-w-0"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 min-w-0 overflow-hidden">
            {isEditing ? (
              /* Edit Form */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between min-w-0">
                    <h2 className="text-lg font-medium text-gray-900 break-words">Edit Lesson</h2>
                    <div className="flex gap-2 min-w-0">
                      <button
                        onClick={async () => {
                          try {
                            await updateLesson(courseId as string, moduleId as string, lessonId as string, editForm);
                            setIsEditing(false);
                            // Refresh the lesson data
                            await fetchLesson();
                          } catch (error) {
                            console.error('Failed to update lesson:', error);
                            setError('Failed to save lesson. Please try again.');
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 break-words min-w-0"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            title: lesson?.title || '',
                            description: lesson?.description || '',
                            content: lesson?.content || '',
                            duration: lesson?.duration || 0,
                            videoUrl: lesson?.videoUrl || ''
                          });
                        }}
                        className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 break-words min-w-0"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 break-words">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter lesson title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 break-words">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={editForm.duration}
                        onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 break-words">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Brief description of the lesson"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 break-words">
                      Video URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={editForm.videoUrl}
                      onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 break-words">
                      Content
                    </label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={20}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm leading-relaxed overflow-hidden break-words"
                      placeholder="Enter the lesson content here..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-4 lg:space-y-6">
                {/* Video Section */}
                {lesson?.videoUrl && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 break-words">Video</h3>
                    </div>
                    <div className="p-4 lg:p-6">
                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center border border-gray-300 min-w-0">
                        <div className="text-center max-w-full px-4">
                          <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2 break-words">Video URL:</p>
                          <div className="max-w-full overflow-hidden">
                            <a 
                              href={lesson.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm break-words inline-block max-w-full"
                              title={lesson.videoUrl}
                            >
                              {lesson.videoUrl.length > 60 ? `${lesson.videoUrl.substring(0, 60)}...` : lesson.videoUrl}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 break-words">Content</h3>
                  </div>
                  <div className="p-4 lg:p-6">
                    {lesson?.content ? (
                      <div className="w-full overflow-hidden">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm break-words overflow-wrap-anywhere max-w-full">
                            {lesson.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm mb-3 break-words">No content available yet.</p>
                        {lesson?.canEdit && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 break-words min-w-0"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Add Content
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Simple Sidebar */}
          <div className="space-y-4 min-w-0">
            {/* Lesson Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
              <h3 className="text-sm font-medium text-gray-900 mb-3 break-words">Lesson Info</h3>
              <div className="space-y-2 text-sm text-gray-600 break-words">
                <div className="break-words">Duration: {lesson?.duration ? `${lesson.duration} min` : 'Not set'}</div>
                <div className="break-words">Position: #{lesson?.order}</div>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span>Status:</span>
                  {lesson?.isPublished ? (
                    <span className="text-green-600 font-medium break-words">Published</span>
                  ) : (
                    <span className="text-amber-600 font-medium break-words">Draft</span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
              <h3 className="text-sm font-medium text-gray-900 mb-3 break-words">Navigation</h3>
              <div className="space-y-2">
                {lesson?.previousLesson ? (
                  <Link
                    href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.previousLesson}`}
                    className="block text-sm text-blue-600 hover:text-blue-800 break-words"
                  >
                    ← Previous Lesson
                  </Link>
                ) : (
                  <span className="block text-sm text-gray-400 break-words">← Previous Lesson</span>
                )}
                
                {lesson?.nextLesson ? (
                  <Link
                    href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.nextLesson}`}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
              <h3 className="text-sm font-medium text-gray-900 mb-3 break-words">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`}
                  className="block text-sm text-blue-600 hover:text-blue-800 break-words"
                >
                  Back to Module
                </Link>
                <Link
                  href={`/dashboard/instructor/courses/${courseId}`}
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
