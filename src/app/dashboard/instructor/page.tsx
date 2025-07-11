"use client";

import React from 'react';
import { useState, useEffect, type ReactElement } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart as ReChartPieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  BookOpen, Video, MessageSquare, Clock, Users, FileText, User,
  Calendar, FileCheck, Award, MessageSquare as MessageSquareText, User as UserIcon,
  ArrowRight, Star, CheckCircle, ChevronRight, ChevronDown, MoreHorizontal, Check, Zap, TrendingUp, DollarSign, Plus,
  BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon,
  Book as BookIcon, BookOpen as BookOpenText, BookMarked, BookKey, BookPlus, BookCheck, BookX, BookMinus
} from 'lucide-react';
import Image from 'next/image';

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
  isLoading?: boolean;
  recentCourses: Course[];
  recentActivity: Activity[];
  upcomingSessions: Session[];
  projectPerformance: Project[];
  overallStats: {
    totalStudents: number;
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    archivedCourses: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: number;
    monthlyRevenue?: number;
    monthlyEnrollments?: number;
    monthlyReviews?: number;
    monthlySessions?: number;
  };
  projectSubmissions: Project[];
  earningsData: Array<{
    month: string;
    amount: number;
  }>;
  projectAnalytics: Array<{
    name: string;
    value: number;
  }>;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5,
      ease: 'easeOut',
    }, 
  },
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper function to format dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0.1 },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 },
  },
};

const getSessionStatusColor = (status: string) => {
  switch (status) {
    case 'UPCOMING':
      return 'bg-blue-100 text-blue-800';
    case 'LIVE':
      return 'bg-green-100 text-green-800';
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const fallbackData: DashboardData = {
  instructorName: "John Doe",
  recentCourses: [
    {
      id: "1",
      title: "Introduction to React",
      imageUrl: "/images/react-course.jpg",
      averageRating: 4.8,
      enrollmentCount: 45,
      completionRate: 82,
      status: "PUBLISHED",
      isPublished: true,
      revenue: 4500,
      updatedAt: "2023-06-14T10:00:00Z",
    },
    {
      id: "2",
      title: "Advanced TypeScript",
      imageUrl: "/images/typescript-course.jpg",
      averageRating: 4.9,
      enrollmentCount: 32,
      completionRate: 88,
      status: "PUBLISHED",
      isPublished: true,
      revenue: 3800,
      updatedAt: "2023-06-13T15:30:00Z",
    },
  ],
  recentActivity: [
    {
      id: "1",
      studentName: "Jane Smith",
      studentImage: "/images/avatar1.jpg",
      activityType: "ENROLLMENT",
      courseTitle: "Introduction to React",
      courseId: "1",
      timestamp: "2023-06-14T12:30:00Z",
    },
    {
      id: "2",
      studentName: "Mike Johnson",
      studentImage: "/images/avatar2.jpg",
      activityType: "COMPLETION",
      courseTitle: "Advanced TypeScript",
      courseId: "2",
      timestamp: "2023-06-14T09:15:00Z",
    },
  ],
  upcomingSessions: [
    {
      id: "1",
      title: "React Hooks Deep Dive",
      course: "Introduction to React",
      courseId: "1",
      courseTitle: "Introduction to React",
      date: "2023-06-15",
      time: "14:00",
      duration: "1 hour",
      participants: 12,
      startTime: "2023-06-15T14:00:00Z",
      endTime: "2023-06-15T15:00:00Z",
      meetingLink: "https://meet.example.com/abc123",
      status: "UPCOMING",
      attendees: 12,
      maxAttendees: 30,
      sessionType: "LIVE",
    },
    {
      id: "2",
      title: "TypeScript Generics Workshop",
      course: "Advanced TypeScript",
      courseId: "2",
      courseTitle: "Advanced TypeScript",
      date: "2023-06-16",
      time: "16:00",
      duration: "1.5 hours",
      participants: 8,
      startTime: "2023-06-16T16:00:00Z",
      endTime: "2023-06-16T17:30:00Z",
      meetingLink: "https://meet.example.com/def456",
      status: "UPCOMING",
      attendees: 8,
      maxAttendees: 15,
      sessionType: "WORKSHOP",
    },
  ],
  projectPerformance: [
    {
      id: "1",
      title: "Todo App",
      courseId: "1",
      courseTitle: "Introduction to React",
      submissions: 15,
      pendingReview: 2,
      averageScore: 85,
      dueDate: "2023-06-20T23:59:59Z",
      status: "SUBMITTED",
    },
    {
      id: "2",
      title: "API Integration",
      courseId: "2",
      courseTitle: "Advanced TypeScript",
      submissions: 10,
      pendingReview: 1,
      averageScore: 92,
      dueDate: "2023-06-25T23:59:59Z",
      status: "SUBMITTED",
    },
  ],
  projectSubmissions: [],
  earningsData: [
    { month: 'Jan', amount: 4000 },
    { month: 'Feb', amount: 3000 },
    { month: 'Mar', amount: 5000 },
    { month: 'Apr', amount: 2780 },
    { month: 'May', amount: 1890 },
    { month: 'Jun', amount: 2390 },
  ],
  projectAnalytics: [
    { name: 'In Progress', value: 12 },
    { name: 'Submitted', value: 19 },
    { name: 'Reviewed', value: 3 },
    { name: 'Approved', value: 5 }
  ],
  overallStats: {
    totalStudents: 120,
    totalCourses: 10,
    publishedCourses: 5,
    draftCourses: 3,
    archivedCourses: 2,
    totalRevenue: 12500,
    averageRating: 4.7,
    completionRate: 82,
  },
};

export default function InstructorDashboard(): JSX.Element {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // This redirects to signin if not authenticated
      // and is handled by next-auth automatically
    },
  });

  // Default dashboard data - will be overridden by API call
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    instructorName: session?.user?.name || 'Instructor',
    overallStats: {
      totalStudents: 0,
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      archivedCourses: 0,
      totalRevenue: 0,
      averageRating: 0,
      completionRate: 0,
    },
    recentCourses: [],
    recentActivity: [],
    upcomingSessions: [],
    projectPerformance: [],
    projectSubmissions: [],
    earningsData: [
      // Add sample data to prevent chart errors
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
    ],
    projectAnalytics: [
      // Add sample data to prevent chart errors
      { name: 'In Progress', value: 0 },
      { name: 'Submitted', value: 0 },
      { name: 'Reviewed', value: 0 },
      { name: 'Approved', value: 0 },
    ],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch dashboard data from API
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Mock data for development since API endpoint might not be implemented yet
        // Remove this and uncomment the fetch call when the API is ready
        setTimeout(() => {
          setDashboardData(prevData => ({
            ...prevData,
            instructorName: "John Doe",
            recentCourses: [
              {
                id: "1",
                title: "Introduction to React",
                imageUrl: "/images/react-course.jpg",
                averageRating: 4.8,
                enrollmentCount: 45,
                completionRate: 82,
                status: "PUBLISHED",
                isPublished: true,
                revenue: 4500,
                updatedAt: "2023-06-14T10:00:00Z",
              },
              {
                id: "2",
                title: "Advanced TypeScript",
                imageUrl: "/images/typescript-course.jpg",
                averageRating: 4.9,
                enrollmentCount: 32,
                completionRate: 88,
                status: "PUBLISHED",
                isPublished: true,
                revenue: 3800,
                updatedAt: "2023-06-13T15:30:00Z",
              },
            ],
            recentActivity: [
              {
                id: "1",
                studentName: "Jane Smith",
                studentImage: "/images/avatar1.jpg",
                activityType: "ENROLLMENT",
                courseTitle: "Introduction to React",
                courseId: "1",
                timestamp: "2023-06-14T12:30:00Z",
              },
              {
                id: "2",
                studentName: "Mike Johnson",
                studentImage: "/images/avatar2.jpg",
                activityType: "COMPLETION",
                courseTitle: "Advanced TypeScript",
                courseId: "2",
                timestamp: "2023-06-14T09:15:00Z",
              },
            ],
            upcomingSessions: [
              {
                id: "1",
                title: "React Hooks Deep Dive",
                course: "Introduction to React",
                courseId: "1",
                courseTitle: "Introduction to React",
                date: "2023-06-15",
                time: "14:00",
                duration: "1 hour",
                participants: 12,
                startTime: "2023-06-15T14:00:00Z",
                endTime: "2023-06-15T15:00:00Z",
                meetingLink: "https://meet.example.com/abc123",
                status: "UPCOMING",
                attendees: 12,
                maxAttendees: 30,
                sessionType: "LIVE",
              },
              {
                id: "2",
                title: "TypeScript Generics Workshop",
                course: "Advanced TypeScript",
                courseId: "2",
                courseTitle: "Advanced TypeScript",
                date: "2023-06-16",
                time: "16:00",
                duration: "1.5 hours",
                participants: 8,
                startTime: "2023-06-16T16:00:00Z",
                endTime: "2023-06-16T17:30:00Z",
                meetingLink: "https://meet.example.com/def456",
                status: "UPCOMING",
                attendees: 8,
                maxAttendees: 15,
                sessionType: "WORKSHOP",
              },
            ],
            projectPerformance: [
              {
                id: "1",
                title: "Todo App",
                courseId: "1",
                courseTitle: "Introduction to React",
                submissions: 15,
                pendingReview: 2,
                averageScore: 85,
                dueDate: "2023-06-20T23:59:59Z",
                status: "SUBMITTED",
              },
              {
                id: "2",
                title: "API Integration",
                courseId: "2",
                courseTitle: "Advanced TypeScript",
                submissions: 10,
                pendingReview: 1,
                averageScore: 92,
                dueDate: "2023-06-25T23:59:59Z",
                status: "SUBMITTED",
              },
            ],
            projectSubmissions: [],
            earningsData: [
              { month: 'Jan', amount: 4000 },
              { month: 'Feb', amount: 3000 },
              { month: 'Mar', amount: 5000 },
              { month: 'Apr', amount: 2780 },
              { month: 'May', amount: 1890 },
              { month: 'Jun', amount: 2390 },
            ],
            projectAnalytics: [
              { name: 'In Progress', value: 12 },
              { name: 'Submitted', value: 19 },
              { name: 'Reviewed', value: 3 },
              { name: 'Approved', value: 5 },
            ],
            overallStats: {
              totalStudents: 120,
              totalCourses: 10,
              publishedCourses: 5,
              draftCourses: 3,
              archivedCourses: 2,
              totalRevenue: 12500,
              averageRating: 4.7,
              completionRate: 82,
            },
          }));
          setIsLoading(false);
        }, 1000);

        // Uncomment when API is ready
        /*
        const response = await fetch('/api/instructor/dashboard');
        
        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
        */
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err?.message || 'Failed to load dashboard data. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-red-600 border-red-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Destructure dashboard data with defaults
  const {
    recentCourses = [],
    recentActivity = [],
    upcomingSessions = [],
    projectPerformance = [],
    overallStats = {
      totalStudents: 120,
      totalCourses: 10,
      publishedCourses: 5,
      draftCourses: 3,
      archivedCourses: 2,
      totalRevenue: 12500,
      averageRating: 4.7,
      completionRate: 82,
    },
    projectSubmissions = [],
    earningsData = [],
    projectAnalytics = { labels: [], data: [] },
  } = dashboardData;

  // Helper function to safely format revenue
  const formatRevenue = (amount?: number): string => {
    if (amount === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Safely access course revenue with fallback
  const getCourseRevenue = (course: Course): number => {
    return course.revenue ?? 0;
  };

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
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {dashboardData.instructorName}</h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your courses today</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-screen-xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Students</p>
                  <h3 className="text-2xl font-bold text-gray-900">{dashboardData.overallStats.totalStudents || 0}</h3>
                  <p className="text-sm text-gray-500 mt-1">Across all courses</p>
                </div>
                <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center">
                <span className="text-sm font-medium text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  8.2%
                </span>
                <span className="text-xs text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          </motion.div>

          {/* Total Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">All Courses</p>
                  <h3 className="text-2xl font-bold text-gray-900">{dashboardData.overallStats.totalCourses || 0}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {dashboardData.overallStats.publishedCourses || 0} Published
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                      {dashboardData.overallStats.draftCourses || 0} Drafts
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                      {dashboardData.overallStats.archivedCourses || 0} Archived
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center">
                <span className="text-sm font-medium text-green-600 flex items-center">
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
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">${dashboardData.overallStats.totalRevenue?.toLocaleString() || '0'}</h3>
                  <p className="text-sm text-gray-500 mt-1">All time earnings</p>
                </div>
                <div className="p-2 rounded-full bg-green-50 text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center">
                <span className="text-sm font-medium text-green-600 flex items-center">
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
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Average Rating</p>
                  <h3 className="text-2xl font-bold text-gray-900">{dashboardData.overallStats.averageRating?.toFixed(1) || '0.0'}</h3>
                  <p className="text-sm text-gray-500 mt-1">From all courses</p>
                </div>
                <div className="p-2 rounded-full bg-yellow-50 text-yellow-600">
                  <Star className="h-6 w-6 fill-current" />
                </div>
              </div>
              <div className="mt-3 flex items-center">
                <span className="text-sm font-medium text-green-600 flex items-center">
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
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Earnings Summary */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Earnings Summary</h2>
              <div className="relative">
                <select 
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  defaultValue="month"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                {dashboardData.earningsData ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dashboardData.earningsData}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip 
                        formatter={(value) => [`$${value}`, 'Revenue']}
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      />
                      <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
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
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-700 font-medium ml-2">Revenue</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">${dashboardData.overallStats?.monthlyRevenue?.toLocaleString() || '0'}</h3>
                  <p className="text-sm text-blue-700 mt-1">+16.8% vs. last month</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-md">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm text-green-700 font-medium ml-2">Enrollments</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{dashboardData.overallStats?.monthlyEnrollments || 0}</h3>
                  <p className="text-sm text-green-700 mt-1">+8.3% vs. last month</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-md">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-sm text-purple-700 font-medium ml-2">Reviews</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{dashboardData.overallStats?.monthlyReviews || 0}</h3>
                  <p className="text-sm text-purple-700 mt-1">+12.4% vs. last month</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-100 rounded-md">
                      <Video className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-sm text-amber-700 font-medium ml-2">Sessions</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{dashboardData.overallStats?.monthlySessions || 0}</h3>
                  <p className="text-sm text-amber-700 mt-1">+4.6% vs. last month</p>
                </div>
              </div>
            </div>
          </motion.div>
          {/* Recent Courses - Only shown when there are courses */}
          {dashboardData.recentCourses.length > 0 && (
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
                <Link 
                  href="/dashboard/instructor/courses" 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {dashboardData.recentCourses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center py-4 first:pt-0 last:pb-0">
                    <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
                      <BookOpenText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate">{course.title}</h3>
                      <div className="flex items-center mt-1">
                        <Users className="h-3.5 w-3.5 text-gray-400 mr-1" />
                        <p className="text-sm text-gray-500">{course.enrollmentCount || 0} students</p>
                        {course.averageRating && (
                          <>
                            <span className="mx-2 text-gray-300">•</span>
                            <div className="flex items-center">
                              <Star className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm text-gray-500">{course.averageRating}</span>
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
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <Link 
                  href="/dashboard/instructor/activity" 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className="mr-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        {renderActivityIcon(activity.activityType)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.description || `Activity on ${activity.courseTitle}`}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Right Column (1/3 width) */}
        <div className="space-y-6 lg:space-y-8">
          {/* Project Analytics */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Project Analytics</h2>
              <PieChartIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            {dashboardData.projectAnalytics && dashboardData.projectAnalytics.length > 0 ? (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <ReChartPieChart>
                    <Pie
                      data={dashboardData.projectAnalytics}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {dashboardData.projectAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </ReChartPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <PieChartIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-gray-500">No analytics data available</p>
              </div>
            )}
            
            {/* Legend */}
            <div className="space-y-2">
              {dashboardData.projectAnalytics && dashboardData.projectAnalytics.length > 0 ? (
                dashboardData.projectAnalytics.map((item, index) => (
                  <div key={`legend-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="h-3 w-3 rounded-sm mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center">No data to display</p>
              )}
            </div>
          </motion.div>
          {/* Upcoming Sessions - Only shown when there are sessions */}
          {dashboardData.upcomingSessions.length > 0 ? (
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
                <Link 
                  href="/dashboard/instructor/sessions" 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {dashboardData.upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        {renderSessionIcon(session.sessionType)}
                      </div>
                      <h3 className="font-medium text-gray-900 truncate flex-1">{session.title}</h3>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
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
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Video className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900">No upcoming sessions</h3>
              <p className="mt-1 text-sm text-gray-500">Schedule a session to get started</p>
              <Link
                href="/dashboard/instructor/sessions/schedule"
                className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
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
