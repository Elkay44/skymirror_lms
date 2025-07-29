"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CourseFilters, CourseFiltersType } from '@/components/courses/CourseFilters';

export default function CoursesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    level: searchParams.get('level') || 'all',
    duration: searchParams.get('duration') || 'all',
    sort: searchParams.get('sort') || 'newest',
  });

  const handleFilterChange = (newFilters: CourseFiltersType) => {
    const params = new URLSearchParams();
    params.set('page', '1');
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== 'all' && value !== '') {
        params.set(key, value as string);
      }
    });

    router.push(`/courses?${params.toString()}`);
  };

  return (
    <CourseFilters
      filters={filters}
      onFilterChange={handleFilterChange}
      onResetFilters={() => {
        const params = new URLSearchParams();
        params.set('page', '1');
        router.push(`/courses?${params.toString()}`);
      }}
      categories={[
        { id: 'all', name: 'All Courses' },
        { id: 'programming', name: 'Programming' },
        { id: 'design', name: 'Design' },
        { id: 'business', name: 'Business' },
        { id: 'marketing', name: 'Marketing' },
        { id: 'data-science', name: 'Data Science' },
        { id: 'personal-development', name: 'Personal Development' }
      ]}
      levels={[
        { id: 'all', name: 'All Levels' },
        { id: 'beginner', name: 'Beginner' },
        { id: 'intermediate', name: 'Intermediate' },
        { id: 'advanced', name: 'Advanced' }
      ]}
      durations={[
        { id: 'all', name: 'All Durations' },
        { id: 'short', name: 'Less than 1 hour' },
        { id: 'medium', name: '1-4 hours' },
        { id: 'long', name: 'More than 4 hours' }
      ]}
      sortOptions={[
        { id: 'newest', name: 'Newest' },
        { id: 'oldest', name: 'Oldest' },
        { id: 'title', name: 'Title' }
      ]}
    />
  );
}
