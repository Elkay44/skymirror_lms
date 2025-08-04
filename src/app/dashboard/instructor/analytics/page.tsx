'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Area,
  ComposedChart
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Users,
  CheckCircle,
  Star,
  FileText,
  BookOpen
} from 'lucide-react';
import type { TooltipProps } from 'recharts';

// Types for analytics data
interface CourseStats {
  id: string;
  title: string;
  completionRate: number;
  enrollmentCount: number;
  assignmentCount: number;
  lastUpdated: string;
}

interface AnalyticsData {
  timeSeries: {
    date: string;
    students: number;
    completion: number;
    engagement: number;
    assignments: number;
  }[];
  heatmap: {
    day: string;
    hour: number;
    value: number;
  }[];
  metrics: {
    totalStudents: number;
    courseCompletion: number;
    averageEngagement: number;
    assignmentsSubmitted: number;
    courses: CourseStats[];
  };
}

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload }: TooltipProps<any, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow overflow-hidden flex-shrink-0">
            {payload?.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium break-words">{item.name}:</span>
                <span>{item.value}</span>
              </div>
            ))}
      </div>
    );
  }
  return null;
};



export default function InstructorAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, get the session
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch session');
        }
        
        const sessionData = await sessionResponse.json();
        
        if (!sessionData?.user) {
          throw new Error('No active session found. Please log in again.');
        }
        
        console.log('Session data:', {
          userId: sessionData.user.id,
          userRole: sessionData.user.role,
          expires: sessionData.expires
        });
        
        // Then fetch the analytics data with credentials
        const response = await fetch('/api/instructor/analytics', {
          credentials: 'include', // Important for sending cookies
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            if (errorData.details) {
              errorMessage += ` (${errorData.details})`;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
          
          // If unauthorized, redirect to login
          if (response.status === 401) {
            window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
            return;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Validate the response data structure
        if (!data.metrics || !Array.isArray(data.timeSeries)) {
          console.error('Invalid analytics data format:', data);
          throw new Error('Received invalid data format from server');
        }
        
        console.log('Analytics data received:', {
          coursesCount: data.metrics?.courses?.length || 0,
          timeSeriesLength: data.timeSeries?.length || 0
        });
        
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error in fetchAnalyticsData:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'An unknown error occurred while fetching analytics data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 lg:space-y-6 p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex min-w-0">
            <div className="flex-shrink-0 min-w-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 break-words">
                Error loading analytics data
              </h3>
              <div className="mt-2 text-sm text-red-700 break-words">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 break-words min-w-0"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <CardTitle className="text-sm font-medium break-words">Total Students</CardTitle>
                <CardDescription className="text-2xl font-bold break-words">
                  {analyticsData.metrics.totalStudents.toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-4 h-4" />
                <span className="text-sm text-green-500 break-words">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <CardTitle className="text-sm font-medium break-words">Course Completion</CardTitle>
                <CardDescription className="text-2xl font-bold break-words">
                  {analyticsData.metrics.courseCompletion.toLocaleString()}%
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm text-green-500 break-words">+3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <CardTitle className="text-sm font-medium break-words">Average Engagement</CardTitle>
                <CardDescription className="text-2xl font-bold break-words">
                  {analyticsData.metrics.averageEngagement.toLocaleString()}%
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Star className="w-4 h-4" />
                <span className="text-sm text-green-500 break-words">+5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <CardTitle className="text-sm font-medium break-words">Assignments Submitted</CardTitle>
                <CardDescription className="text-2xl font-bold break-words">
                  {analyticsData.metrics.assignmentsSubmitted.toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4" />
                <span className="text-sm text-green-500 break-words">+8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Course Performance Chart */}
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Student progress and engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analyticsData.timeSeries}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                  />
                  <Bar dataKey="students" barSize={20} fill="#413ea0" />
                  <Line 
                    type="monotone" 
                    dataKey="completion" 
                    stroke="#ff7300" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Student Engagement Heatmap */}
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Student Engagement Heatmap</CardTitle>
            <CardDescription>Student activity patterns throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={140} data={analyticsData.heatmap}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="day" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Engagement"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Statistics */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 min-w-0">
            <div>
              <CardTitle>Course Statistics</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                Track performance and engagement across your courses
              </p>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto min-w-0">
              <Label htmlFor="course-filter" className="whitespace-nowrap">Filter by Course</Label>
              <Select>
                <SelectTrigger id="course-filter" className="w-full md:w-[200px]">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {analyticsData?.metrics?.courses?.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analyticsData?.metrics?.courses?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.metrics.courses.map((course: any) => (
                <Card key={course.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between min-w-0">
                      <h3 className="font-medium text-sm truncate break-words">{course.title}</h3>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm break-words min-w-0">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium break-words">{course.completionRate || 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${course.completionRate || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 text-sm break-words">
                      <div className="flex items-center space-x-1 min-w-0">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{course.enrollmentCount || 0} students</span>
                      </div>
                      <div className="flex items-center space-x-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{course.assignmentCount || 0} assignments</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center min-w-0">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1 break-words">No published courses found</h3>
              <p className="text-muted-foreground text-sm max-w-md break-words">
                You don't have any published courses yet. Publish your courses to see analytics and track student progress.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
