"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, XCircle, BookOpen, Clock, Users } from 'lucide-react';

import StudentCourseDashboard from '@/components/dashboard/StudentCourseDashboard';
import { addDays } from 'date-fns';

// Define the DashboardCourse interface to match the expected type in StudentCourseDashboard
interface DashboardCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnailUrl: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  isPublished: boolean;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  isEnrolled: boolean;
  enrollmentStatus: string;
  enrolledStudents: Array<{
    id: string;
    name?: string;
    email?: string;
  }>;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    progress: number;
    isLocked: boolean;
    duration: number;
    resources: Array<{ id: string; title: string; url: string; type: string }>;
    lessons: Array<{
      id: string;
      title: string;
      description: string;
      completed: boolean;
      duration: string;
      type?: string;
      order: number;
      videoUrl: string;
      content: string;
    }>;
    firstLessonId: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    status: string;
    progress: number;
    dueDate?: Date;
    grade?: number;
    tags: string[];
    resources: Array<{ title: string; url: string }>;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: Date;
    moduleTitle?: string;
    grade?: number;
  }>;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
}

interface ApiCourse {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  duration?: number | string;
  level?: 'beginner' | 'intermediate' | 'advanced' | string;
  category?: string;
  instructor: {
    id: string;
    name: string;
    image?: string;
  } | string;
  enrolledStudents?: Array<{
    id: string;
    name?: string;
    email?: string;
  }>;
  modules?: Array<{
    id?: string;
    title?: string;
    description?: string;
    order?: number;
    lessons?: Array<{
      id?: string;
      title?: string;
      description?: string;
      duration?: number | string;
      completed?: boolean;
      order?: number;
      videoUrl?: string;
      content?: string;
    }>;
  }>;
  progress?: number;
  isEnrolled?: boolean;
  enrollmentStatus?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const CourseDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;
  
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const transformCourseData = useCallback((apiCourse: ApiCourse): DashboardCourse => {
    const now = new Date();
    
    // Helper to safely parse date
    const parseDate = (date: string | Date | undefined): Date => {
      if (!date) return now;
      return date instanceof Date ? date : new Date(date);
    };
    
    // Helper to parse duration to number
    const parseDuration = (duration: string | number | undefined): number => {
      if (typeof duration === 'number') return duration;
      if (typeof duration === 'string') {
        const num = parseInt(duration, 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };
    
    // Helper to format duration for display (HH:MM:SS)
    const formatDuration = (totalSeconds: number): string => {
      if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
    
    // Transform the course data to match the DashboardCourse type
    const transformedCourse: DashboardCourse = {
      id: apiCourse.id || `course-${Math.random().toString(36).substr(2, 9)}`,
      title: apiCourse.title || 'Untitled Course',
      description: apiCourse.description || '',
      instructor: typeof apiCourse.instructor === 'string' 
        ? apiCourse.instructor 
        : apiCourse.instructor?.name || 'Unknown Instructor',
      thumbnailUrl: apiCourse.thumbnailUrl || apiCourse.imageUrl || '',
      duration: parseDuration(apiCourse.duration),
      level: ['beginner', 'intermediate', 'advanced'].includes(apiCourse.level as string) 
        ? apiCourse.level as 'beginner' | 'intermediate' | 'advanced' 
        : 'beginner',
      category: apiCourse.category || 'Uncategorized',
      isPublished: true,
      progress: Math.min(100, Math.max(0, apiCourse.progress || 0)),
      createdAt: parseDate(apiCourse.createdAt),
      updatedAt: parseDate(apiCourse.updatedAt),
      isEnrolled: apiCourse.isEnrolled || false,
      enrollmentStatus: apiCourse.enrollmentStatus || 'not_enrolled',
      enrolledStudents: Array.isArray(apiCourse.enrolledStudents) 
        ? apiCourse.enrolledStudents 
        : [],
      modules: (apiCourse.modules || []).map(module => {
        const lessons = Array.isArray(module.lessons) ? module.lessons : [];
        const moduleDuration = lessons.reduce((sum, lesson) => {
          return sum + parseDuration(lesson.duration);
        }, 0);
        
        const firstLessonId = lessons.length > 0 
          ? (lessons[0].id || `lesson-${Math.random().toString(36).substr(2, 9)}`)
          : '';
        
        return {
          id: module.id || `module-${Math.random().toString(36).substr(2, 9)}`,
          title: module.title || 'Untitled Module',
          description: module.description || '',
          order: module.order || 0,
          progress: 0,
          isLocked: false,
          duration: moduleDuration,
          resources: [],
          lessons: lessons.map(lesson => ({
            id: lesson.id || `lesson-${Math.random().toString(36).substr(2, 9)}`,
            title: lesson.title || 'Untitled Lesson',
            description: lesson.description || '',
            completed: lesson.completed || false,
            duration: formatDuration(parseDuration(lesson.duration)),
            type: 'video',
            order: lesson.order || 0,
            videoUrl: lesson.videoUrl || '',
            content: lesson.content || ''
          })),
          firstLessonId
        };
      }),
      projects: [],
      activities: [],
      startDate: parseDate(apiCourse.startDate || now),
      endDate: parseDate(apiCourse.endDate || addDays(now, 30)),
      imageUrl: apiCourse.imageUrl
    };
    
    return transformedCourse;
  }, []);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      
      const data = await response.json();
      setCourse(data);
      
      // Check if user is enrolled
      if (session?.user?.id) {
        const enrollmentResponse = await fetch(`/api/courses/${courseId}/enrollment`);
        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json();
          setEnrolled(enrollmentData.isEnrolled || false);
        }
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to load course. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [courseId, session]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleBackToCourses = () => {
    router.push('/courses');
  };

  const handleEnroll = async () => {
    if (!courseId || !session?.user?.id) {
      router.push('/auth/signin');
      return;
    }
    
    setEnrolling(true);
    
    try {
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll in course');
      }
      
      setEnrolled(true);
      // Refresh course data to reflect enrollment
      fetchCourse();
    } catch (err) {
      console.error('Error enrolling in course:', err);
      setError(err instanceof Error ? err.message : 'Failed to enroll in course. Please try again.');
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchCourse}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleBackToCourses}
          className="mt-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Courses
        </button>
      </div>
    );
  }

  // If no course data is available
  if (!course) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
          <p className="mt-2 text-gray-600">The requested course could not be found.</p>
          <button
            onClick={handleBackToCourses}
            className="mt-4 flex items-center justify-center mx-auto text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // If user is enrolled, show the dashboard
  if (enrolled) {
    const dashboardCourse = transformCourseData(course);
    return <StudentCourseDashboard courses={[dashboardCourse]} />;
  }

  // Calculate course statistics
  const totalModules = course.modules?.length || 0;
  const totalLessons = course.modules?.reduce(
    (sum, module) => sum + (module.lessons?.length || 0),
    0
  ) || 0;
  const totalDuration = course.modules?.reduce((total, module) => {
    const moduleDuration = module.lessons?.reduce((sum, lesson) => {
      const duration = typeof lesson.duration === 'string' 
        ? parseInt(lesson.duration, 10) || 0 
        : lesson.duration || 0;
      return sum + duration;
    }, 0) || 0;
    return total + moduleDuration;
  }, 0) || 0;

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get instructor info
  const instructor = typeof course.instructor === 'string' 
    ? course.instructor 
    : course.instructor?.name || 'Unknown Instructor';
  
  const instructorImage = typeof course.instructor === 'object' 
    ? course.instructor?.image 
    : undefined;

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
              {/* Course header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600">{course.description}</p>
              </div>
              
              {/* Instructor info */}
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  {instructorImage ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={instructorImage}
                      alt={instructor}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-medium">
                        {instructor.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Instructor</p>
                  <p className="text-sm text-gray-900">{instructor}</p>
                </div>
              </div>

              {/* Course stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Modules</p>
                  <p className="text-2xl font-bold">{totalModules}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Lessons</p>
                  <p className="text-2xl font-bold">{totalLessons}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
                </div>
              </div>

              {/* Course content */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Content</h2>
                <div className="space-y-4">
                  {course.modules?.map((module, moduleIndex) => (
                    <div key={module.id || `module-${moduleIndex}`} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">{module.title || 'Untitled Module'}</h3>
                        {module.description && (
                          <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                        )}
                      </div>
                      <div className="divide-y divide-gray-200">
                        {module.lessons?.map((lesson, lessonIndex) => (
                          <div key={lesson.id || `lesson-${lessonIndex}`} className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                {lessonIndex + 1}
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">{lesson.title || 'Untitled Lesson'}</p>
                                {lesson.duration && (
                                  <p className="text-sm text-gray-500">
                                    {formatDuration(
                                      typeof lesson.duration === 'string' 
                                        ? parseInt(lesson.duration, 10) 
                                        : lesson.duration || 0
                                    )}
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

              {/* Enroll button */}
              <div className="mt-8">
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full md:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              </div>
            </div>

            {/* Course image */}
            <div className="md:w-1/3 bg-gray-50 p-6">
              <img
                className="w-full h-auto rounded-lg"
                src={course.imageUrl || '/course-placeholder.jpg'}
                alt={course.title}
              />
              
              {/* Course details sidebar */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{totalLessons} lessons</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{formatDuration(totalDuration)}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {course.enrolledStudents?.length || 0} students enrolled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
