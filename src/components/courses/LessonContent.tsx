"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import VideoPlayer from './VideoPlayer';
import CourseNotes from './CourseNotes';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: string;
  completed: boolean;
  order: number;
  moduleId: string;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface LessonContentProps {
  courseId: string;
  lessonId: string;
  onComplete?: () => void;
}

export default function LessonContent({ courseId, lessonId, onComplete }: LessonContentProps) {
  const { data: session } = useSession();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'notes'>('content');
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch lesson data
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch specific lesson data
        const lessonResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
        if (!lessonResponse.ok) {
          throw new Error('Failed to fetch lesson');
        }
        
        const lessonData = await lessonResponse.json();
        setLesson(lessonData);
        
        // Fetch course data to determine next/prev lessons
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course details');
        }
        
        const courseData = await courseResponse.json();
        
        // Find current lesson's position in the course
        const allLessons: Lesson[] = [];
        courseData.modules.forEach((module: Module) => {
          module.lessons.forEach((moduleLesson: Lesson) => {
            allLessons.push(moduleLesson);
          });
        });
        
        // Sort lessons by module position and then lesson position
        allLessons.sort((a, b) => {
          const moduleA = courseData.modules.find((m: Module) => m.id === a.moduleId);
          const moduleB = courseData.modules.find((m: Module) => m.id === b.moduleId);
          
          if (moduleA && moduleB) {
            if (moduleA.order !== moduleB.order) {
              return moduleA.order - moduleB.order;
            }
            return a.order - b.order;
          }
          return 0;
        });
        
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        
        if (currentIndex > 0) {
          setPrevLesson(allLessons[currentIndex - 1]);
        } else {
          setPrevLesson(null);
        }
        
        if (currentIndex < allLessons.length - 1) {
          setNextLesson(allLessons[currentIndex + 1]);
        } else {
          setNextLesson(null);
        }
      } catch (err) {
        console.error('Error fetching lesson data:', err);
        setError('Failed to load the lesson. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user) {
      fetchLessonData();
    }
  }, [courseId, lessonId, session]);

  // Handle marking lesson as complete
  const handleMarkComplete = async () => {
    if (!session?.user) return;
    
    try {
      setIsCompleting(true);
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark lesson as complete');
      }
      
      // Update local state
      setLesson(prev => prev ? { ...prev, completed: true } : null);
      
      // Notify parent component if callback provided
      if (onComplete) {
        onComplete();
      }
      
      toast.success('Lesson marked as complete!');
    } catch (err) {
      console.error('Error marking lesson as complete:', err);
      toast.error('Failed to mark lesson as complete');
    } finally {
      setIsCompleting(false);
    }
  };

  // Handle video progress update
  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress);
    
    // Auto-mark as complete when video reaches 90%
    if (progress >= 90 && lesson && !lesson.completed) {
      handleMarkComplete();
    }
  };

  // Handle video completion
  const handleVideoComplete = () => {
    if (lesson && !lesson.completed) {
      handleMarkComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link href={`/courses/${courseId}`} className="text-sm font-medium text-red-700 hover:text-red-600">
                Go back to course
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Lesson not found.</p>
            <div className="mt-4">
              <Link href={`/courses/${courseId}`} className="text-sm font-medium text-yellow-700 hover:text-yellow-600">
                Go back to course
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Lesson Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
      
      {/* Video Player (if video exists) */}
      {lesson.videoUrl && (
        <div className="mb-6">
          <VideoPlayer
            videoUrl={lesson.videoUrl}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
            className="rounded-xl overflow-hidden shadow-lg"
          />
        </div>
      )}
      
      {/* Mobile Tabs */}
      {isMobile && (
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 px-4 text-center text-sm font-medium ${activeTab === 'content' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('content')}
          >
            Lesson Content
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center text-sm font-medium ${activeTab === 'notes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('notes')}
          >
            My Notes
          </button>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Lesson Content */}
        <div className={`${isMobile && activeTab !== 'content' ? 'hidden' : 'block'} md:flex-1`}>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="prose prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />
            
            {/* Lesson Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              {prevLesson ? (
                <Link
                  href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous Lesson
                </Link>
              ) : (
                <div>{/* Empty div to maintain flex spacing */}</div>
              )}
              
              {lesson && !lesson.completed ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={isCompleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Completing...
                    </>
                  ) : (
                    <>Mark as Complete</>
                  )}
                </button>
              ) : (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg className="-ml-1 mr-1.5 h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Completed
                </span>
              )}
              
              {nextLesson ? (
                <Link
                  href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next Lesson
                  <svg className="ml-2 -mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Complete Course
                  <svg className="ml-2 -mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Notes Section */}
        <div className={`${isMobile && activeTab !== 'notes' ? 'hidden' : 'block'} md:w-1/3`}>
          <CourseNotes
            lessonId={lessonId}
            courseId={courseId}
            currentVideoTime={lesson?.videoUrl ? videoProgress : 0}
          />
        </div>
      </div>
    </div>
  );
}
