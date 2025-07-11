"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { CourseCard } from '@/components/courses/CourseCard';
import CourseFilters, { CourseFilters as CourseFiltersType } from '@/components/courses/CourseFilters';

import { Course } from '@/types/course.types';

export default function CoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const data = await response.json();
        // Map API data to our Course interface
        const formattedCourses = (data.data || []).map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description || 'No description available',
          imageUrl: course.imageUrl || null,
          category: course.category || 'General',
          level: course.level || 'Beginner',
          duration: course.duration || 'Self-paced',
          lessonCount: course.lessonCount || 0,
          enrolled: course.enrolled || false,
          progress: course.progress || 0,
          instructor: course.instructor || {
            name: 'Academy Instructor',
            image: null
          }
        }));
        setCourses(formattedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    if (!session) {
      window.location.href = `/login?callbackUrl=/courses/${courseId}`;
      return;
    }
    
    try {
      setIsEnrolling(true);
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        setCourses(prev => 
          prev.map(course => 
            course.id === courseId ? { ...course, enrolled: true } : course
          )
        );
        // Redirect to course detail page after successful enrollment
        window.location.href = `/courses/${courseId}`;
      } else {
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        console.error('Enroll API error:', { status: response.status, data });
        throw new Error((data && data.error) || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      // In a production app, show a toast notification here
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleFilterChange = (newFilters: CourseFiltersType) => {
    setFilters(newFilters);
  };
  
  // Apply filters to courses
  const filteredCourses = courses.filter(course => {
    // Search filter
    const matchesSearch = 
      filters.search === '' || 
      course.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      course.description.toLowerCase().includes(filters.search.toLowerCase());
    
    // Category filter
    const matchesCategory = 
      filters.category === 'all' || 
      course.category === filters.category;
    
    // Level filter
    const matchesLevel = 
      filters.level === 'all' || 
      course.level === filters.level;
    
    // Duration filter
    const matchesDuration = filters.duration === 'all';
    // In a real app, we would implement proper duration filtering based on actual course duration
    
    return matchesSearch && matchesCategory && matchesLevel && matchesDuration;
  });

  // Sort the filtered courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (filters.sort) {
      case 'popular':
        // In a real app, this would sort by enrollment count
        return b.lessonCount - a.lessonCount;
      case 'rating':
        // In a real app, this would sort by actual rating
        return (b.progress || 0) - (a.progress || 0);
      case 'newest':
      default:
        // In a real app, this would sort by creation date
        return b.id.localeCompare(a.id);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Explore Courses</h1>
          <p className="mt-2 text-lg text-gray-600">Discover new skills, advance your career</p>
        </div>
        
        <div className="flex space-x-2">
          {session && (
            <Link
              href="/courses/enrolled"
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="mr-2 h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Courses
            </Link>
          )}
          
          <Link
            href="/courses/latest"
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="mr-2 h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            New Releases
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <CourseFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
      />
      
      {/* Course grid */}
      {sortedCourses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No courses found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
          <button 
            onClick={() => handleFilterChange({
              search: '',
              category: 'all',
              level: 'all',
              duration: 'all',
              sort: 'newest'
            })}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
            />
          ))}
        </div>
      )}
      
      {/* Pagination - For when you have many courses */}
      {sortedCourses.length > 0 && (
        <div className="mt-8 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <a
              href="#"
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="#"
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              1
            </a>
            <a
              href="#"
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-indigo-50 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
            >
              2
            </a>
            <a
              href="#"
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              3
            </a>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              ...
            </span>
            <a
              href="#"
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              8
            </a>
            <a
              href="#"
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              9
            </a>
            <a
              href="#"
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              10
            </a>
            <a
              href="#"
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
