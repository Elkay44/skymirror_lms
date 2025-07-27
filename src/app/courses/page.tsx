"use client";

import { useState, useEffect } from 'react';
import CourseFilters from '@/components/courses/CourseFilters';
import { CourseCard } from '@/components/courses/CourseCard';
import { Course } from '@/types/course.types';
import { useSession, getSession } from 'next-auth/react';
import { toast } from 'sonner';

interface CourseFiltersType {
  search: string;
  category: string;
  level: string;
  duration: string;
  sort: string;
}

export default function CoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CourseFiltersType>({
    search: '',
    category: 'all',
    level: 'all',
    duration: 'all',
    sort: 'newest'
  });

  // Mock categories - in production, these would come from an API
  const categories = [
    { id: 'all', name: 'All Courses' },
    { id: 'programming', name: 'Programming' },
    { id: 'design', name: 'Design' },
    { id: 'business', name: 'Business' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'data-science', name: 'Data Science' },
    { id: 'personal-development', name: 'Personal Development' }
  ];

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Reset courses in case of retry
      setCourses([]);
      
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      
      // Explicitly request only published courses
      const apiUrl = new URL('/api/courses', window.location.origin);
      apiUrl.searchParams.append('t', timestamp.toString());
      apiUrl.searchParams.append('status', 'PUBLISHED');
      
      console.log('Fetching courses from:', apiUrl.toString());
      
      let response: Response;
      let result: any;
      
      try {
        console.log('Initiating fetch request...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Add request headers
        const headers: HeadersInit = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Type': 'application/json',
        };
        
        // Add auth token if available
        try {
          const session = await getSession();
          if (session?.user) {
            // If using a custom session type with accessToken
            const customSession = session as any;
            if (customSession.accessToken) {
              headers['Authorization'] = `Bearer ${customSession.accessToken}`;
            }
          }
        } catch (sessionError) {
          console.warn('Failed to get session:', sessionError);
          // Continue without auth token
        }
        
        console.log('Making request with headers:', headers);
        
        response = await fetch(apiUrl.toString(), {
          signal: controller.signal,
          headers,
          credentials: 'same-origin',
        }).finally(() => clearTimeout(timeoutId));

        console.log('Request completed. Status:', response.status, response.statusText);
        
        // Log response headers for debugging
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        console.log('Response headers:', responseHeaders);
        
        // Get response text first to handle both JSON and non-JSON responses
        const responseText = await response.text();
        console.log('Raw response text:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
        
        // Try to parse as JSON
        try {
          result = responseText ? JSON.parse(responseText) : null;
          console.log('Parsed response:', result);
        } catch (parseError) {
          console.error('Failed to parse response as JSON. Response:', responseText.substring(0, 500));
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }
        
        if (!response.ok) {
          const errorMessage = result?.message || 
                            result?.error?.message || 
                            result?.error ||
                            response.statusText ||
                            `Request failed with status ${response.status}`;
          
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            url: apiUrl.toString(),
            error: errorMessage,
            response: result
          });
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        const fetchError = error as Error;
        console.error('Fetch error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
          type: typeof error
        });
        throw error;
      }
      
      // Handle different response formats
      let coursesArray: any[] = [];
      
      if (Array.isArray(result)) {
        // If the API returns an array directly
        coursesArray = result;
      } else if (result && Array.isArray(result.courses)) {
        // If the API returns an object with a courses array
        coursesArray = result.courses;
      } else if (result && result.data && Array.isArray(result.data)) {
        // If the API returns an object with a data array
        coursesArray = result.data;
      }
      
      // Transform the course data to match the expected Course type
      const transformedCourses = coursesArray.map((course: any) => ({
        id: course.id || '',
        slug: course.slug || course.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `course-${Date.now()}`,
        imageUrl: course.imageUrl || '/course-placeholder.jpg',
        createdAt: course.createdAt || new Date().toISOString(),
        updatedAt: course.updatedAt || new Date().toISOString(),
        instructor: {
          id: course.instructor?.id || '1',
          name: course.instructor?.name || 'Unknown Instructor',
          avatarUrl: course.instructor?.image || undefined,
          title: course.instructor?.title || 'Instructor'
        },
        rating: course.rating || 0,
        reviewCount: course.reviewCount || 0,
        studentCount: course.studentCount || 0,
        lessonCount: course.lessonCount || 0,
        duration: course.duration || 0,
        isEnrolled: course.isEnrolled || false,
        isFavorite: course.isFavorite || false,
        isNew: course.isNew || false,
        isBestSeller: course.isBestSeller || false,
        progress: course.progress || 0,
        modules: course.modules || [],
        projects: course.projects || [],
        grades: course.grades || [],
        promoVideo: course.promoVideo || '',
        title: course.title || 'Untitled Course',
        shortDescription: course.shortDescription || 
                         (course.description ? course.description.substring(0, 100) + '...' : ''),
        description: course.description || '',
        category: course.category || 'uncategorized',
        level: (course.level || 'beginner').toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        language: course.language || 'English',
        price: course.price || 0,
        isFree: course.isFree || false,
        hasDiscount: course.hasDiscount || false,
        discountedPrice: course.discountedPrice || 0,
        requirements: course.requirements || [],
        learningOutcomes: course.learningOutcomes || [],
        targetAudience: course.targetAudience || [],
        isPublished: course.isPublished || false,
        isPrivate: course.isPrivate || false
      }));
      
      setCourses(transformedCourses);
    } catch (error) {
      console.error('Courses fetch error:', error);
      
      let errorMessage = 'Failed to load courses';
      
      try {
        // Try to extract a meaningful error message
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          // Try to stringify the error object for better debugging
          const errorObj = error as Record<string, any>;
          if (errorObj.message) {
            errorMessage = String(errorObj.message);
          } else if (errorObj.error) {
            errorMessage = String(errorObj.error);
          } else {
            // If we can't find a message, stringify the whole object
            try {
              errorMessage = JSON.stringify(errorObj, null, 2);
            } catch (e) {
              errorMessage = 'Unknown error occurred';
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing error:', parseError);
        errorMessage = 'An unknown error occurred while processing the error';
      }
      
      console.error('Error details:', { error });
      toast.error(`Error: ${errorMessage}`);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const enrollCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/enrollment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }

      const refreshResponse = await fetch('/api/courses');
      const refreshData = await refreshResponse.json();
      setCourses(refreshData?.courses || []);
      toast.success('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll in the course. Please try again.');
    }
  };

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 text-gray-300 mb-4">
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
      <p className="text-gray-500 mb-6">We couldn't find any courses matching your criteria. Check back later or try different filters.</p>
      <button
        onClick={() => {
          // Reset filters
          setFilters({
            search: '',
            category: 'all',
            level: 'all',
            duration: 'all',
            sort: 'newest'
          });
          fetchCourses();
        }}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
      >
        Reset Filters
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {/* Skeleton loading UI */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse p-4 rounded-lg bg-gray-50">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
          <CourseFilters
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
          />
        </div>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses
              .filter((course: Course) => {
                const matchesSearch =
                  course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                  course.description.toLowerCase().includes(filters.search.toLowerCase());
                const matchesCategory =
                  filters.category === 'all' || course.category === filters.category;
                const matchesLevel =
                  filters.level === 'all' || course.level === filters.level;
                
                return matchesSearch && matchesCategory && matchesLevel;
              })
              .sort((a: Course, b: Course) => {
                if (filters.sort === 'newest') {
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                return 0;
              })
              .map((course: Course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  variant="default"
                  showInstructor={true}
                  showProgress={false}
                  onEnroll={enrollCourse}
                  className="w-full"
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
