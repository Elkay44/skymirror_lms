"use server";

import { Course } from '@/types/course.types';
import { prisma } from '@/lib/prisma';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseFilters } from '@/components/courses/CourseFilters';

interface CoursesPageProps {
  searchParams?: {
    page?: string;
    search?: string;
    category?: string;
    level?: string;
    duration?: string;
    sort?: string;
  };
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  // Parse search parameters with default values
  const page = parseInt(searchParams?.page || '1') || 1;
  const search = searchParams?.search || '';
  const category = searchParams?.category || 'all';
  const level = searchParams?.level || 'all';
  const duration = searchParams?.duration || 'all';
  const sort = searchParams?.sort || 'newest';

  // Convert sort to backend format
  const sortField = sort === 'newest' ? 'createdAt' : 'title';
  const sortOrder = sort === 'newest' ? 'desc' : 'asc';

  // Build filters for prisma query
  const filters: any = {
    status: 'PUBLISHED',
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(category !== 'all' && { category: category }),
    ...(level !== 'all' && { difficulty: level.toUpperCase() }),
  };

  // Fetch courses with pagination
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: filters,
      orderBy: {
        [sortField]: sortOrder as 'asc' | 'desc',
      },
      take: 10,
      skip: (page - 1) * 10,
      include: {
        instructor: true,
        category: true,
      },
    }),
    prisma.course.count({ where: filters }),
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(total / 10);

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Courses' },
    { id: 'programming', name: 'Programming' },
    { id: 'design', name: 'Design' },
    { id: 'business', name: 'Business' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'data-science', name: 'Data Science' },
    { id: 'personal-development', name: 'Personal Development' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Courses</h1>
        <CourseFilters
          filters={{
            search,
            category,
            level,
            duration,
            sort,
          }}
          onFilterChange={() => {}}
          onResetFilters={() => {
            const url = new URL(window.location.origin + '/courses');
            url.searchParams.set('page', '1');
            window.location.href = url.toString();
          }}
          categories={categories}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {total > 10 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center justify-center gap-2">
            {page > 1 && (
              <a
                href={`/courses?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Previous
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <a
                key={pageNum}
                href={`/courses?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={`px-4 py-2 ${
                  pageNum === page
                    ? 'bg-blue-500 text-white rounded'
                    : 'bg-gray-100 hover:bg-gray-200 rounded'
                }`}
              >
                {pageNum}
              </a>
            ))}
            {page < totalPages && (
              <a
                href={`/courses?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Next
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
