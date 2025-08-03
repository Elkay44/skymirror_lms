"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import toast from 'react-hot-toast';
import LessonContent from '@/components/courses/LessonContent';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: string;
  completed: boolean;
  position: number;
  moduleId: string;
}

interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

export default function LessonPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const { courseId, lessonId } = useParams() as { courseId: string; lessonId: string };
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/courses/${courseId}/lessons/${lessonId}`);
      return;
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course data for breadcrumbs and title
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course');
        }
        
        const courseData = await courseResponse.json();
        setCourse(courseData);
        
        // Calculate overall course progress
        let totalLessons = 0;
        let completedLessons = 0;
        
        courseData.modules.forEach((module: Module) => {
          module.lessons.forEach((moduleLesson: Lesson) => {
            totalLessons++;
            if (moduleLesson.completed) {
              completedLessons++;
            }
          });
        });
        
        setProgress(Math.round((completedLessons / totalLessons) * 100));
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchCourseData();
    }
  }, [courseId, lessonId, router, status]);

  // Handle lesson completion callback
  const handleLessonComplete = () => {
    // Recalculate progress
    if (course) {
      let totalLessons = 0;
      let completedLessons = 0;
      
      course.modules.forEach(module => {
        module.lessons.forEach(moduleLesson => {
          totalLessons++;
          // Count this lesson as completed
          if (moduleLesson.id === lessonId || moduleLesson.completed) {
            completedLessons++;
          }
        });
      });
      
      setProgress(Math.round((completedLessons / totalLessons) * 100));
    }
  };

  if (loading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Course header with progress */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              {/* Breadcrumbs */}
              <nav className="flex mb-2" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <svg className="flex-shrink-0 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </li>
                  <li>
                    <Link
                      href="/courses"
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      Courses
                    </Link>
                  </li>
                  <li>
                    <svg className="flex-shrink-0 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </li>
                  <li>
                    <Link
                      href={`/courses/${courseId}`}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium truncate max-w-xs"
                    >
                      {course?.title || 'Course'}
                    </Link>
                  </li>
                </ol>
              </nav>
              
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {course?.title || 'Loading course...'}
              </h1>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <div className="w-40 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{progress}% Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Use our new LessonContent component */}
        <LessonContent
          courseId={courseId}
          lessonId={lessonId}
          onComplete={handleLessonComplete}
        />
      </div>
    </div>
  );
}
