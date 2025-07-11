"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

// Enhanced type definitions to better match API responses
interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: string;
  order: number;
  moduleId: string;
  completed: boolean;
  completedAt?: string;
  videoUrl?: string;
  content?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  instructor: {
    id: string;
    name: string;
    image?: string;
  };
  modules: Module[];
  isEnrolled: boolean;
  enrollmentStatus?: string;
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const { data: session } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use SWR for data fetching with caching and revalidation
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Add cache-control headers for better browser caching
        const response = await fetch(`/api/courses/${courseId}`, {
          headers: {
            'Cache-Control': 'max-age=60',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch course: ${response.status}`);
        }
        
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('Failed to load the course. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleMarkComplete = async (lessonId: string) => {
    try {
      // Show loading state during the API call
      setIsSubmitting(true);
      
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId }),
      });

      if (response.ok) {
        // Fixed bug: was comparing lesson.id with itself (lesson.id === lesson.id)
        setCourse(prev => {
          if (!prev) return null;
          
          // Create new course object with updated lessons
          return {
            ...prev,
            modules: prev.modules.map(module => ({
              ...module,
              lessons: module.lessons.map(lesson => 
                lesson.id === lessonId ? { ...lesson, completed: true } : lesson
              )
            }))
          };
        });
        
        // Update completion percentage after marking a lesson complete
        updateCompletionPercentage();
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);

  // Calculate completion percentage based on completed lessons across all modules
  const updateCompletionPercentage = () => {
    if (course) {
      let totalLessons = 0;
      let completedLessons = 0;
      
      course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          totalLessons++;
          if (lesson.completed) {
            completedLessons++;
          }
        });
      });
      
      const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      setCompletionPercentage(percentage);
    }
  };
  
  // Update list of all lessons when course data changes
  useEffect(() => {
    if (course) {
      // Flatten all lessons from all modules into a single array
      const lessons: Lesson[] = [];
      course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          lessons.push(lesson);
        });
      });
      setAllLessons(lessons);
      updateCompletionPercentage();
    }
  }, [course]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-2 text-lg font-medium text-gray-900">{error ? 'Error Loading Course' : 'Course not found'}</h2>
          <p className="mt-1 text-gray-500">{error || 'The course you\'re looking for doesn\'t exist or you don\'t have access to it.'}</p>
          <div className="mt-6">
            <Link href="/courses" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Course Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {course.title}
              </h1>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {allLessons.length} Lessons
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {completionPercentage}% Complete
                </div>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link 
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm font-medium ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <svg 
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${activeTab === 'overview' ? 'text-indigo-500' : 'text-gray-400'}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Overview
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm font-medium ${activeTab === 'content' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <svg 
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${activeTab === 'content' ? 'text-indigo-500' : 'text-gray-400'}`}
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Content
              </button>
              <button
                onClick={() => setActiveTab('discussion')}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center text-sm font-medium ${activeTab === 'discussion' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <svg 
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${activeTab === 'discussion' ? 'text-indigo-500' : 'text-gray-400'}`}
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Discussion
              </button>
            </nav>

            {/* Progress Card */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Your Progress</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Track your course completion progress.</p>
                </div>
                <div className="mt-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                          Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          {completionPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                      <div
                        style={{ width: `${completionPercentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-6 lg:mt-0 lg:col-span-9">
            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Course Overview</h2>
                  <p className="text-gray-600 mb-6">{course.description}</p>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-base font-medium text-gray-900 mb-3">What You'll Learn</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">Understand key course concepts</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">Apply practical skills in real-world scenarios</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">Complete hands-on exercises and projects</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">Earn a completion certificate</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'content' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Course Content</h2>
                  
                  {course.modules.map((module) => (
                    <div key={module.id} className="mb-6">
                      <h3 className="text-md font-medium text-gray-800 mb-3">{module.title}</h3>
                      {module.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-4">
                            {lesson.completed ? (
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-medium">{lesson.order}</span>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-base font-medium text-gray-900">{lesson.title}</h3>
                            <p className="text-sm text-gray-500">{lesson.duration}</p>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-shrink-0">
                          <button
                            onClick={() => handleMarkComplete(lesson.id)}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                              lesson.completed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            {lesson.completed ? (
                              <>
                                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Completed
                              </>
                            ) : (
                              <>
                                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Lesson
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'discussion' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Discussion</h2>
                <p className="text-gray-600 mb-8">Engage with your instructor and fellow learners to get the most out of your course.</p>
                
                {/* Sample discussion form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start a discussion</h3>
                  <textarea
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Ask a question or share your thoughts..."
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Post
                    </button>
                  </div>
                </div>
                
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No discussions yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Be the first to start a discussion about this course.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
