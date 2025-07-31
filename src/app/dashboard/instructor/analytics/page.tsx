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
  FileText
} from 'lucide-react';
import type { TooltipProps } from 'recharts';

// Types for analytics data
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
          <div className="flex items-center justify-between">
            <CardTitle>Course Statistics</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="course-filter">Filter by Course</Label>
              <Select>
                <SelectTrigger id="course-filter">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="course1">Course 1</SelectItem>
                  <SelectItem value="course2">Course 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData?.timeSeries?.map((course, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Course {i + 1}</h3>
                    <p className="text-xs text-muted-foreground">
                      {course.completion}% Completion
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{course.students} students</Badge>
                    <Badge variant="outline">{course.assignments} assignments</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
