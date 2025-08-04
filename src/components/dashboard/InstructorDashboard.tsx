"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Users, DollarSign, BookOpen, Star, Plus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseCard } from '../courses/CourseCard';
import { Course } from '@/types/course.types';

interface DashboardStats {
  totalStudents: number;
  totalRevenue: number;
  totalCourses: number;
  averageRating: number;
}

export default function InstructorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalRevenue: 0,
    totalCourses: 0,
    averageRating: 0
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstructorData = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch instructor courses
        const coursesResponse = await fetch('/api/instructor/courses', {
          credentials: 'include',
        });
        
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData.courses || []);
          
          // Calculate stats from courses data
          const totalCourses = coursesData.courses?.length || 0;
          const totalStudents = coursesData.courses?.reduce((sum: number, course: any) => 
            sum + (course.totalStudents || 0), 0) || 0;
          const totalRevenue = coursesData.courses?.reduce((sum: number, course: any) => 
            sum + ((course.price || 0) * (course.totalStudents || 0)), 0) || 0;
          const averageRating = totalCourses > 0 ? 
            coursesData.courses?.reduce((sum: number, course: any) => 
              sum + (course.averageRating || 0), 0) / totalCourses : 0;
          
          setDashboardStats({
            totalStudents,
            totalRevenue,
            totalCourses,
            averageRating: Math.round(averageRating * 10) / 10
          });
        }
      } catch (err) {
        console.error('Error fetching instructor data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] min-w-0">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
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

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between min-w-0">
        <h1 className="text-2xl font-bold break-words">Instructor Dashboard</h1>
        <Button onClick={() => router.push('/dashboard/instructor/courses/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0">
            <CardTitle className="text-sm font-medium break-words">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{dashboardStats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0">
            <CardTitle className="text-sm font-medium break-words">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">${dashboardStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0">
            <CardTitle className="text-sm font-medium break-words">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{dashboardStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Published courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0">
            <CardTitle className="text-sm font-medium break-words">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{dashboardStats.averageRating || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Course ratings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center min-w-0">
                  <LineChart className="h-8 w-8 text-muted-foreground" />
                  <span className="text-muted-foreground ml-2">Revenue chart will appear here</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center min-w-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none break-words">{course.title}</p>
                        <p className="text-sm text-muted-foreground break-words">
                          {course.studentCount || 0} students
                        </p>
                      </div>
                      <div className="ml-auto font-medium break-words">
                        {course.rating ? `${course.rating}★` : 'No rating'}
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground break-words">No courses yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground break-words">Activity tracking coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            <div 
              className="border-2 border-dashed rounded-lg flex items-center justify-center min-h-[300px] hover:border-primary transition-colors cursor-pointer min-w-0"
              onClick={() => router.push('/dashboard/instructor/courses/create')}
            >
              <div className="text-center p-6">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium break-words">Create New Course</h3>
                <p className="text-sm text-muted-foreground mt-1 break-words">Start building your next course</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Student management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
