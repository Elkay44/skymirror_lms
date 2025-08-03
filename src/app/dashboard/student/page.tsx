"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, FileText, CheckCircle, Star } from 'lucide-react';
import { StudentDashboardData } from '@/types/student-dashboard';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check if we have a session and user data
    if (!session) {
      console.log('No session found, waiting for session to be established');
      return;
    }

    // Only fetch data if we have a valid user ID
    if (session?.user?.id) {
      fetchData();
    }
  }, [session, router]); // Depend on full session object for updates

  // Cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        console.log('No user ID found, waiting for session to be established');
        return null;
      }

      setIsLoading(true);
      console.log('Fetching dashboard data for user:', session?.user?.id);
      
      // Add retry logic with exponential backoff
      const fetchWithRetry = async (url: string, maxRetries: number = 3) => {
        let retryCount = 0;
        while (retryCount < maxRetries) {
          try {
            const response = await fetch(url, {
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              return response;
            }
            
            const errorData = await response.json();
            console.error('Dashboard API error:', {
              status: response.status,
              error: errorData.error,
              retryCount: retryCount + 1,
              maxRetries
            });
            
            // Handle 401 errors gracefully
            if (response.status === 401) {
              console.error('Session expired, retrying...');
              // Don't redirect immediately, let's retry first
              return null;
            }
            
            // Only retry on network errors or 5xx errors
            if (response.status >= 500 || !response.ok) {
              retryCount++;
              if (retryCount === maxRetries) {
                throw new Error('Max retries exceeded');
              }
              // Exponential backoff
              await new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, retryCount) * 1000)
              );
              continue;
            }
            
            throw new Error(errorData.error || `HTTP ${response.status}`);
          } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
              throw error;
            }
            // Exponential backoff
            await new Promise(resolve => 
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
          }
        }
        return null;
      };

      const apiResponse = await fetchWithRetry('/api/student/dashboard');
      if (!apiResponse) {
        throw new Error('Failed to fetch dashboard data after multiple retries');
      }

      const data = await apiResponse.json();
      console.log('Received dashboard data:', data);

      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid dashboard data received');
      }

      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Handle specific error cases
      if (error instanceof Error) {
        console.error('Dashboard error:', error);
        toast.error('Failed to load dashboard. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, router]); // Only depend on user ID and router

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session?.user?.id) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Not Authenticated</h2>
        <p className="text-gray-600">Please log in to access your dashboard.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">
          Go to Login
        </Button>
      </div>
    </div>;
  }

  if (!dashboardData) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Data Not Available</h2>
        <p className="text-gray-600">Please try refreshing the page or contact support if the issue persists.</p>
        <Button onClick={fetchData} className="mt-4">
          Refresh Data
        </Button>
      </div>
    </div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Section with User Welcome */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {dashboardData.instructorName}!</h1>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Courses Section */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Courses</h2>
            {dashboardData.recentCourses && dashboardData.recentCourses.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {course.imageUrl && (
                          <img 
                            src={course.imageUrl} 
                            alt={course.title} 
                            className="w-full h-full object-cover rounded-lg" 
                            width={64} 
                            height={64}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{course.title}</h3>
                        <p className="text-sm text-gray-600">Status: {course.status}</p>
                        <p className="text-sm text-gray-600">Enrollment: {course.enrollmentCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">No recent course activity</p>
              </div>
            )}
          </section>

          {/* Recent Activity Section */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            {(dashboardData.recentActivity || []).length > 0 ? (
              <div className="space-y-4">
                {(dashboardData.recentActivity || []).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-sm font-semibold">{activity.courseTitle}</h3>
                      <p className="text-sm text-gray-600">Activity: {activity.type}</p>
                      <p className="text-sm text-gray-600">{activity.message}</p>
                    </div>
                    <p className="text-sm text-gray-600">{activity.timestamp}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">No recent activity</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Total Students</h3>
                  <p className="text-2xl font-bold">{dashboardData.overallStats.activeStudents}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Total Courses</h3>
                  <p className="text-2xl font-bold">{dashboardData.overallStats.totalCertificates}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Completion Rate</h3>
                  <p className="text-2xl font-bold">{dashboardData.overallStats.currentStreak} days</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Average Rating</h3>
                  <p className="text-2xl font-bold">{dashboardData.overallStats.totalStudyHours} hours</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
            {(dashboardData.upcomingSessions || []).length > 0 ? (
              <div className="space-y-4">
                {(dashboardData.upcomingSessions || []).map((session) => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{session.title}</h3>
                      <p className="text-sm text-gray-600">{session.mentorName}</p>
                      <p className="text-sm text-gray-600">{new Date(session.scheduledAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-gray-600">{session.attendees}/{session.maxAttendees}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No upcoming sessions scheduled</p>
            )}
          </section>

          {/* Daily Tip */}
          <section className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center mb-3">
              <h2 className="text-xl font-semibold">Daily Tip</h2>
            </div>
            <p className="mb-4">"Consistency is key to mastery. Try to study for at least 25 minutes each day rather than cramming hours in a single session."</p>
            <div className="text-sm">
              <Link href="/tips" className="text-white underline hover:no-underline">Get more learning tips</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}