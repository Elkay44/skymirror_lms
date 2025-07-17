"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, XCircle } from 'lucide-react';
import StudentCourseDashboard from '@/components/dashboard/StudentCourseDashboard';
import type { Course, Module, Lesson } from '@/types/course';

interface ApiCourse {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  instructor: {
    id: string;
    name: string;
    image?: string;
  };
  enrolledStudents?: Array<{
    id: string;
    name?: string;
    email?: string;
  }>;
  modules: Array<{
    id: string;
    title: string;
    description?: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      description?: string;
      duration: number;
      videoUrl?: string;
      completed: boolean;
      order: number;
      content?: string;
    }>;
  }>;
  progress?: number;
  isEnrolled: boolean;
  enrollmentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

const CourseDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;

  const { data: session, status } = useSession<true>() as {
    data: {
      user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        accessToken?: string;
      };
      expires: string;
    } | null;
    status: 'authenticated' | 'loading' | 'unauthenticated';
  };

  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [enrolled, setEnrolled] = useState<boolean>(false);

  const transformCourseData = useCallback((apiCourse: ApiCourse): Course => {
    return {
      ...apiCourse,
      instructor: apiCourse.instructor?.name || 'Unknown Instructor',
      thumbnailUrl: apiCourse.imageUrl,
      level: apiCourse.level || 'beginner',
      category: apiCourse.category || 'general',
      createdAt: new Date(apiCourse.createdAt || new Date()).toISOString(),
      updatedAt: new Date(apiCourse.updatedAt || new Date()).toISOString(),
      modules: apiCourse.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          completed: false,
          duration: typeof lesson.duration === 'string' 
            ? parseInt(lesson.duration) || 0 
            : lesson.duration || 0
        }))
      }))
    };
  }, []);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: session?.user?.accessToken ? {
          'Authorization': `Bearer ${session.user.accessToken}`
        } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const data = await response.json();
      setCourse(data);
      setEnrolled(data.isEnrolled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [courseId, session?.user?.accessToken]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      // Optionally redirect to login or show a message
      return;
    }
    
    fetchCourse();
  }, [status, fetchCourse]);

  const handleBackToCourses = () => {
    router.push('/dashboard');
  };

  const handleEnroll = async () => {
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }

      await response.json();
      setEnrolled(true);
      setCourse(prev => prev ? { ...prev, isEnrolled: true } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while enrolling');
    } finally {
      setEnrolling(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <div className="mt-4 space-x-3">
            <button
              onClick={fetchCourse}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retry
            </button>
            <button
              onClick={handleBackToCourses}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Course not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested course could not be found.</p>
          <div className="mt-6">
            <button
              onClick={handleBackToCourses}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const transformedCourse = transformCourseData(course);
  const { title, description, imageUrl, instructor, modules } = course;
  const totalLessons = modules.reduce((total, module) => total + (module.lessons?.length || 0), 0);
  const totalDuration = modules.reduce((total, module) => {
    return total + module.lessons.reduce((sum, lesson) => {
      const duration = typeof lesson.duration === 'string' ? parseInt(lesson.duration) || 0 : lesson.duration || 0;
      return sum + duration;
    }, 0);
  }, 0);

  if (enrolled && transformedCourse) {
    // Use the student dashboard component directly since the route doesn't exist yet
    return <StudentCourseDashboard courses={[transformedCourse]} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBackToCourses}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Courses
        </button>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-1 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
              <p className="text-gray-600 mb-6">{description}</p>
              
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={instructor.image || '/default-avatar.png'}
                    alt={instructor.name}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Instructor</p>
                  <p className="text-sm text-gray-500">{instructor.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center">
                  <span>{Math.round(totalDuration / 60)} min</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full md:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              </div>
            </div>

            <div className="md:w-1/3 bg-gray-50 p-6">
              <img
                className="w-full h-auto rounded-lg"
                src={imageUrl || '/course-placeholder.jpg'}
                alt={title}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Course Content
            </h2>
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
                    {module.description && (
                      <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                    )}
                  </div>
                  <div className="divide-y divide-gray-200">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            {lesson.order}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                            {lesson.duration && (
                              <p className="text-sm text-gray-500">
                                {Math.round(Number(lesson.duration) / 60)} min
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
