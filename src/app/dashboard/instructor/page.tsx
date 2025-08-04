"use client";

import React from 'react';
import { useState, useEffect, type ReactElement } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as ReChartPieChart, Pie, Cell
} from 'recharts';
import { 
  BookOpen, Video, MessageSquare, Clock, Users, FileText, User,
  Calendar, Star, ChevronDown, Check, Zap, TrendingUp, DollarSign,
  PieChart as PieChartIcon
} from 'lucide-react';


// Type definitions
interface BaseCourse {
  id: string;
  title: string;
  imageUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublished: boolean;
  revenue?: number;
  updatedAt?: string;
  enrollmentCount?: number;
  completionRate?: number;
  averageRating?: number;
}

interface Course extends BaseCourse {
  students?: string[];
  courseId?: string;
  meetingLink?: string;
}

interface Activity {
  id: string;
  studentName: string;
  activityType: 'ENROLLMENT' | 'COMPLETION' | 'REVIEW' | 'QUESTION' | 'SUBMISSION';
  courseId: string;
  courseTitle: string;
  message?: string;
  timestamp: string;
  studentImage?: string;
  description?: string;
}

interface Session {
  id: string;
  title: string;
  course: string;
  courseId?: string;
  courseTitle?: string;
  date: string;
  time: string;
  duration: string;
  sessionType: 'LIVE' | 'RECORDED' | 'QNA' | 'WORKSHOP';
  status: 'UPCOMING' | 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED';
  participants: number;
  meetingLink?: string;
  recordingLink?: string;
  startTime?: string;
  endTime?: string;
  attendees?: number;
  maxAttendees?: number;
  type?: string;
}

interface Project {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  submissions: number;
  pendingReview: number;
  averageScore: number;
  dueDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED';
  isActive?: boolean;
  projectId?: string;
  projectTitle?: string;
  submissionsCount?: number;
  approvalRate?: number;
  averageFeedbackTime?: number;
}

interface DashboardData {
  instructorName: string;
  recentCourses: Course[];
  recentActivity: Activity[];
  upcomingSessions: Session[];
  projectPerformance: Project[];
  overallStats: {
    totalStudents: number;
    totalCourses: number;
    totalRevenue: number;
    newEnrollments: number;
    completionRate: number;
    averageRating: number;
  };
  earningsData?: Array<{
    month: string;
    amount: number;
  }>;
  projectAnalytics?: {
    labels: string[];
    data: number[];
  };
}

// Animation variants






// Helper function to format dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};





export default function InstructorDashboard(): JSX.Element {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      // This redirects to signin if not authenticated
      // and is handled by next-auth automatically
    },
  });

  // Default dashboard data - will be overridden by API call
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    instructorName: session?.user?.name || 'Instructor',
    recentCourses: [],
    recentActivity: [],
    upcomingSessions: [],
    projectPerformance: [],
    overallStats: {
      totalStudents: 0,
      totalCourses: 0,
      totalRevenue: 0,
      newEnrollments: 0,
      completionRate: 0,
      averageRating: 0,
    },
    earningsData: [
      // Add sample data to prevent chart errors
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
    ],
    projectAnalytics: {
      labels: ['In Progress', 'Submitted', 'Reviewed', 'Approved'],
      data: [0, 0, 0, 0]
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/instructor/dashboard');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch dashboard data');
        }
        
        // Validate response data
        if (!data.instructorName || !Array.isArray(data.recentCourses)) {
          throw new Error('Invalid dashboard data format');
        }
        
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.user?.id]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 min-w-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 min-w-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-red-600 border-red-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }





  // Helper function to render activity icon
  const renderActivityIcon = (type: Activity['activityType']): ReactElement => {
    const className = "h-4 w-4";
    switch (type) {
      case 'ENROLLMENT':
        return <User className={`${className} text-purple-500`} />;
      case 'COMPLETION':
        return <Check className={`${className} text-green-500`} />;
      case 'REVIEW':
        return <Star className={`${className} text-yellow-500`} />;
      case 'QUESTION':
        return <MessageSquare className={`${className} text-blue-500`} />;
      case 'SUBMISSION':
        return <FileText className={`${className} text-indigo-500`} />;
      default:
        return <Zap className={`${className} text-gray-500`} />;
    }
  };

  // Function to render session icon based on type
  const renderSessionIcon = (type: Session['sessionType'] = 'LIVE'): ReactElement => {
    const className = "h-4 w-4";
    switch (type) {
      case 'LIVE':
        return <Video className={`${className} text-red-500`} />;
      case 'RECORDED':
        return <Video className={`${className} text-blue-500`} />;
      case 'QNA':
        return <MessageSquare className={`${className} text-green-500`} />;
      default:
        return <Clock className={`${className} text-gray-500`} />;
    }
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Main return statement
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 lg:p-10">
      {/* Hero Section with Welcome and Stats */}
      <div className="max-w-screen-xl mx-auto mb-8">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center min-w-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 break-words">Welcome, {dashboardData.instructorName}</h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your courses today</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-4 lg:gap-6 mb-8">
          {/* Total Students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 transition-all duration-300 hover:shadow-md min-w-0 overflow-hidden">
              <div className="flex justify-between items-start min-w-0">
                <div className="min-w-0 flex-1 mr-3 min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-1 break-words">Total Students</p>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 break-words">{dashboardData.overallStats.totalStudents || 0}</h3>
                  <p className="text-sm text-gray-500 mt-1 break-words">Across all courses</p>
                </div>
                <div className="p-2 rounded-full bg-blue-50 text-blue-600 flex-shrink-0 min-w-0 flex-shrink-0">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center flex-wrap gap-1 min-w-0">
                <span className="text-sm font-medium text-green-600 flex items-center break-words min-w-0">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0 min-w-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  8.2%
                </span>
                <span className="text-xs text-gray-500 break-words">from last month</span>
              </div>
            </div>
          </motion.div>

          {/* Total Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 transition-all duration-300 hover:shadow-md min-w-0 overflow-hidden">
              <div className="flex justify-between items-start min-w-0">
                <div className="min-w-0 flex-1 mr-3 min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-1 break-words">All Courses</p>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 break-words">{dashboardData.overallStats.totalCourses || 0}</h3>
                  <div className="mt-1 flex flex-wrap gap-1 lg:gap-2 text-xs min-w-0">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full break-words">
                      {dashboardData.recentCourses.filter(course => course.status === 'PUBLISHED').length} Published
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full break-words">
                      {dashboardData.recentCourses.filter(course => course.status === 'DRAFT').length} Drafts
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full break-words">
                      {dashboardData.recentCourses.filter(course => course.status === 'ARCHIVED').length} Archived
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 flex-shrink-0 min-w-0 flex-shrink-0">
                  <BookOpen className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center min-w-0">
                <span className="text-sm font-medium text-green-600 flex items-center break-words min-w-0">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Updated
                </span>
                <span className="text-xs text-gray-500 ml-2">course statistics</span>
              </div>
            </div>
          </motion.div>

          {/* Total Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md overflow-hidden">
              <div className="flex justify-between items-start min-w-0">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 break-words">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900 break-words">${dashboardData.overallStats.totalRevenue?.toLocaleString() || '0'}</h3>
                  <p className="text-sm text-gray-500 mt-1 break-words">All time earnings</p>
                </div>
                <div className="p-2 rounded-full bg-green-50 text-green-600 flex-shrink-0">
                  <DollarSign className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center min-w-0">
                <span className="text-sm font-medium text-green-600 flex items-center break-words min-w-0">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  12.4%
                </span>
                <span className="text-xs text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          </motion.div>

          {/* Average Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md overflow-hidden">
              <div className="flex justify-between items-start min-w-0">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 break-words">Average Rating</p>
                  <h3 className="text-2xl font-bold text-gray-900 break-words">{dashboardData.overallStats.averageRating?.toFixed(1) || '0.0'}</h3>
                  <p className="text-sm text-gray-500 mt-1 break-words">From all courses</p>
                </div>
                <div className="p-2 rounded-full bg-yellow-50 text-yellow-600 flex-shrink-0">
                  <Star className="h-6 w-6 fill-current" />
                </div>
              </div>
              <div className="mt-3 flex items-center min-w-0">
                <span className="text-sm font-medium text-green-600 flex items-center break-words min-w-0">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  2.1%
                </span>
                <span className="text-xs text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 lg:gap-6 lg:gap-8">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6 lg:space-y-6 lg:space-y-8">
          {/* Earnings Summary */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 break-words">Earnings Summary</h2>
              <div className="relative">
                <select 
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 break-words"
                  defaultValue="month"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 min-w-0">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Chart */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center min-w-0">
                {dashboardData.earningsData?.length ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dashboardData.earningsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip
                        formatter={(value) => [`$${value}`, 'Revenue']}
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500">
                    <BarChart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No earnings data available</p>
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center min-w-0">
                    <div className="p-2 bg-blue-100 rounded-md flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-700 font-medium ml-2 break-words">Revenue</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 break-words">${dashboardData.overallStats.totalRevenue?.toLocaleString() || '0'}</h3>
                  <p className="text-sm text-blue-700 mt-1 break-words">+16.8% vs. last month</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center min-w-0">
                    <div className="p-2 bg-green-100 rounded-md flex-shrink-0">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm text-green-700 font-medium ml-2 break-words">New Enrollments</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 break-words">{dashboardData.overallStats.newEnrollments || 0}</h3>
                  <p className="text-sm text-green-700 mt-1 break-words">+8.3% vs. last month</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center min-w-0">
                    <div className="p-2 bg-purple-100 rounded-md flex-shrink-0">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-sm text-purple-700 font-medium ml-2 break-words">Average Rating</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 break-words">{dashboardData.overallStats.averageRating || 0}</h3>
                  <p className="text-sm text-purple-700 mt-1 break-words">+12.4% vs. last month</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center min-w-0">
                    <div className="p-2 bg-amber-100 rounded-md flex-shrink-0">
                      <Video className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-sm text-amber-700 font-medium ml-2 break-words">Completion Rate</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 break-words">{dashboardData.overallStats.completionRate || 0}%</h3>
                  <p className="text-sm text-amber-700 mt-1 break-words">+4.6% vs. last month</p>
                </div>
              </div>
            </div>
          </motion.div>
          {/* Recent Courses - Only shown when there are courses */}
          {dashboardData.recentCourses.length > 0 && (
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 break-words">Recent Courses</h2>
                <Link 
                  href="/dashboard/instructor/courses" 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 break-words"
                >
                  View all
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {dashboardData.recentCourses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center py-4 first:pt-0 last:pb-0 min-w-0">
                    <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 min-w-0">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate break-words">{course.title}</h3>
                      <div className="flex items-center mt-1 min-w-0">
                        <Users className="h-3.5 w-3.5 text-gray-400 mr-1" />
                        <p className="text-sm text-gray-500 break-words">{course.enrollmentCount || 0} students</p>
                        {course.averageRating && (
                          <>
                            <span className="mx-2 text-gray-300">•</span>
                            <div className="flex items-center min-w-0">
                              <Star className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm text-gray-500 break-words">{course.averageRating}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Activity - Only shown when there is activity */}
          {dashboardData.recentActivity.length > 0 && (
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 break-words">Recent Activity</h2>
                <Link 
                  href="/dashboard/instructor/activity" 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 break-words"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-start p-3 bg-gray-50 rounded-lg min-w-0">
                    <div className="mr-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center min-w-0">
                        {renderActivityIcon(activity.activityType)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 break-words">{activity.description || `Activity on ${activity.courseTitle}`}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Right Column (1/3 width) */}
        <div className="space-y-4 lg:space-y-6 lg:space-y-6 lg:space-y-8">
          {/* Project Analytics */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 break-words">Project Analytics</h2>
              <PieChartIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            {dashboardData.projectAnalytics?.labels?.length ? (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <ReChartPieChart>
                    <Pie
                      data={dashboardData.projectAnalytics?.data?.map((value, index) => ({
                        name: dashboardData.projectAnalytics?.labels?.[index] || 'Unknown',
                        value
                      })) || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {dashboardData.projectAnalytics?.data?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )) || []}
                    </Pie>
                    <Tooltip />
                  </ReChartPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 min-w-0">
                <PieChartIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-gray-500 break-words">No analytics data available</p>
              </div>
            )}
            
            {/* Legend */}
            <div className="space-y-2">
              {dashboardData.projectAnalytics?.labels?.length ? (
                dashboardData.projectAnalytics?.labels?.map((label, index) => (
                  <div key={`legend-${index}`} className="flex items-center justify-between min-w-0">
                    <div className="flex items-center min-w-0">
                      <div 
                        className="h-3 w-3 rounded-sm mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm text-gray-600 break-words">{label}</span>
                    </div>
                    <span className="text-sm font-medium break-words">{dashboardData.projectAnalytics?.data?.[index] || 0}</span>
                  </div>
                )) || []
              ) : (
                <p className="text-sm text-gray-500 text-center break-words">No data to display</p>
              )}
            </div>
          </motion.div>
          {/* Upcoming Sessions - Only shown when there are sessions */}
          {dashboardData.upcomingSessions.length > 0 ? (
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 break-words">Upcoming Sessions</h2>
                <Link 
                  href="/dashboard/instructor/sessions" 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 break-words"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {dashboardData.upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center mb-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 min-w-0">
                        {renderSessionIcon(session.sessionType)}
                      </div>
                      <h3 className="font-medium text-gray-900 truncate flex-1 break-words min-w-0">{session.title}</h3>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 min-w-0">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{session.date}</span>
                      <span className="mx-1.5">•</span>
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>{session.time}</span>
                      {session.attendees !== undefined && (
                        <>
                          <span className="mx-1.5">•</span>
                          <Users className="h-3.5 w-3.5 mr-1" />
                          <span>{session.attendees}/{session.maxAttendees || '-'}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Video className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 break-words">No upcoming sessions</h3>
              <p className="mt-1 text-sm text-gray-500 break-words">Schedule a session to get started</p>
              <Link
                href="/dashboard/instructor/sessions/schedule"
                className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 break-words min-w-0"
              >
                Schedule Session
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
