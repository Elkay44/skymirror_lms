'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
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
  AreaChart,
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { format, subDays, isWithinInterval } from 'date-fns';
import { 
  Users,
  CheckCircle,
  Star,
  FileText,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
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
      <div className="bg-white p-2 rounded shadow">
            {payload?.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium">{item.name}:</span>
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
        const response = await fetch('/api/instructor/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="space-y-6">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {analyticsData.metrics.totalStudents.toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm text-green-500">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {analyticsData.metrics.courseCompletion.toLocaleString()}%
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm text-green-500">+3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Average Engagement</CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {analyticsData.metrics.averageEngagement.toLocaleString()}%
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span className="text-sm text-green-500">+5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Assignments Submitted</CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {analyticsData.metrics.assignmentsSubmitted.toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm text-green-500">+8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Course Statistics</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track performance and engagement across your courses
              </p>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.metrics.courses.map((course: any) => (
                <Card key={course.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{course.title}</h3>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{course.completionRate || 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${course.completionRate || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{course.enrollmentCount || 0} students</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{course.assignmentCount || 0} assignments</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No courses found</h3>
              <p className="text-muted-foreground text-sm max-w-md mb-4">
                You haven't created any courses yet. Get started by creating your first course.
              </p>
              <Link
                href="/instructor/courses/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Course
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
