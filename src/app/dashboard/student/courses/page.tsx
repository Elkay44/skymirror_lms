"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StudentCourseDashboard from '@/components/dashboard/StudentCourseDashboard';
import { Course, Module, Lesson as ApiLesson } from '@/types/course';
import type { DashboardCourse, DashboardModule, DashboardLesson } from '@/components/dashboard/StudentCourseDashboard';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen } from 'lucide-react';

export default function StudentCoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/courses', {
          credentials: 'include',
          cache: 'no-store',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch enrolled courses');
        }
        
        const data = await response.json();
        
        // Transform API course data to match dashboard's expected format
        const transformedCourses = (data.courses || []).map((course: any) => {
          // Create a properly typed DashboardCourse object
          const transformedCourse: DashboardCourse = {
            ...course,
            startDate: course.startDate ? new Date(course.startDate) : undefined,
            endDate: course.endDate ? new Date(course.endDate) : undefined,
            modules: (course.modules || []).map((mod: any): DashboardModule => ({
              ...mod,
              progress: mod.progress || 0,
              order: mod.order || 0,
              lessons: (mod.lessons || []).map((lesson: any): DashboardLesson => ({
                ...lesson,
                completed: false,
                duration: lesson.duration?.toString() || '0',
                type: lesson.type || 'video',
                order: lesson.order || 0
              }))
            })),
            projects: course.projects || [],
            activities: course.activities || []
          };
          return transformedCourse;
        });
        
        setCourses(transformedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load your courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchEnrolledCourses();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">No Courses Enrolled</h2>
          <p className="text-muted-foreground">
            You haven't enrolled in any courses yet. Browse our courses to get started!
          </p>
          <Button onClick={() => router.push('/courses')} className="mt-4">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">
            View and manage your enrolled courses
          </p>
        </div>
        <Button onClick={() => router.push('/courses')}>
          <BookOpen className="mr-2 h-4 w-4" />
          Browse More Courses
        </Button>
      </div>
      
      <StudentCourseDashboard courses={courses} />
    </div>
  );
}
