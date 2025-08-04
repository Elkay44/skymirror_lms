"use client";

import { useState, useEffect } from 'react';
import { CourseFilters, CourseFiltersType } from '@/components/courses/CourseFilters';
import { CourseCard } from '@/components/courses/CourseCard';
import { Course } from '@/types/course.types';

import { toast } from 'sonner';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState<CourseFiltersType>({
    search: '',
    category: 'all',
    level: 'all',
    duration: 'all',
    sort: 'newest'
  });
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Courses' },
    { id: 'programming', name: 'Programming' },
    { id: 'design', name: 'Design' },
    { id: 'business', name: 'Business' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'data-science', name: 'Data Science' },
    { id: 'personal-development', name: 'Personal Development' }
  ];

  const levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ];

  const durations = [
    { id: 'all', name: 'All Durations' },
    { id: 'short', name: 'Less than 5 hours' },
    { id: 'medium', name: '5-10 hours' },
    { id: 'long', name: 'More than 10 hours' }
  ];

  const sortOptions = [
    { id: 'newest', name: 'Newest' },
    { id: 'popular', name: 'Most Popular' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'price', name: 'Price: Low to High' },
    { id: 'price-desc', name: 'Price: High to Low' }
  ];

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const apiUrl = new URL('/api/courses', window.location.origin);
      apiUrl.searchParams.append('status', 'PUBLISHED');
      apiUrl.searchParams.append('sortBy', 'createdAt');
      apiUrl.searchParams.append('sortOrder', 'desc');
      apiUrl.searchParams.append('limit', '10');
      apiUrl.searchParams.append('page', '1');
      apiUrl.searchParams.append('withEnrollmentStats', 'true');

      console.log('Fetching courses from:', apiUrl.toString());

      const response = await fetch(apiUrl.toString());
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        // Try to get error text first
        const errorText = await response.text().catch(() => '');
        console.error('Raw error response:', errorText);
        
        try {
          const errorData = errorText ? JSON.parse(errorText) : {};
          console.error('Parsed error data:', errorData);
          throw new Error(`HTTP ${response.status}: ${errorData.message || 'Failed to fetch courses'}`);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch courses'}`);
        }
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      const coursesArray = Array.isArray(data) ? data : data.courses || data.data || [];
      console.log('Parsed courses:', coursesArray);

      setCourses(coursesArray.map((course: any) => ({
        id: course.id || '',
        slug: course.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `course-${Date.now()}`,
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
      })));
    } catch (error) {
      console.error('Courses fetch error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: CourseFiltersType) => {
    setFilters(newFilters);
    fetchCourses();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      level: 'all',
      duration: 'all',
      sort: 'newest'
    });
    fetchCourses();
  };

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll in course');
      }

      toast.success('Successfully enrolled in course');
      
      // Redirect to course dashboard after successful enrollment
      window.location.href = `/dashboard/student/courses/${courseId}`;
      
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll in course');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Courses</h1>
              <p className="text-gray-600 text-lg">Explore our collection of courses and find the perfect one for you</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={resetFilters}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
              <button 
                onClick={fetchCourses}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
            <CourseFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
              categories={categories}
              levels={levels}
              durations={durations}
              sortOptions={sortOptions}
              className="mb-4"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Enhanced skeleton loading UI */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">No courses were found matching your criteria.</p>
            <div className="mt-6">
              <button 
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnroll={enrollCourse}
                  className="p-6"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
