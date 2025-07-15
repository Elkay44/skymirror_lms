"use client";

import { useState, useEffect } from 'react';
import CourseFilters from '@/components/courses/CourseFilters';
import { CourseCard } from '@/components/courses/CourseCard';
import { Course } from '@/types/course.types';
import { useSession } from 'next-auth/react';
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
      const response = await fetch('/api/courses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      
      // Handle pagination and ensure we always have an array of courses
      const coursesArray = Array.isArray(data.courses) ? data.courses : [];
      setCourses(coursesArray);
      setLoading(false);
    } catch (error) {
      console.error('Courses fetch error:', error);
      toast.error('Failed to fetch courses');
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
      setCourses(refreshData || []);
      toast.success('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll in the course. Please try again.');
    }
  };

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
      </div>
    </div>
  );
}
