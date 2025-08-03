"use client";

import { useState, useEffect } from 'react';

import {
  BarChart2,
  Users,
  TrendingUp,
  BookOpen,
  Award,
  BarChart,
  PieChart,
  Calendar,
  User,
  Download,
  Filter
} from 'lucide-react';

interface MenteeAnalyticsData {
  totalMentees: number;
  activeMentees: number;
  menteeProgress: {
    completing: number;
    onTrack: number;
    needsAttention: number;
    inactive: number;
  };
  averageSessionsPerMentee: number;
  totalSessionsCompleted: number;
  upcomingSessions: number;
  courseCompletionRate: number;
  topSkills: {
    skill: string;
    count: number;
  }[];
  menteeActivityByDay: {
    day: string;
    count: number;
  }[];
  mostPopularCourses: {
    course: string;
    enrolledMentees: number;
  }[];
  menteesByCareerPath: {
    path: string;
    count: number;
  }[];
  menteePerformanceData: {
    menteeId: string;
    menteeName: string;
    menteeAvatar?: string;
    coursesCompleted: number;
    activeCourses: number;
    lastActive: string;
    averageGrade: string;
    totalSessions: number;
    progress: number;
  }[];
}

export default function MenteeAnalyticsPage() {

  const [analyticsData, setAnalyticsData] = useState<MenteeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<string>('MONTH');
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // In a real implementation, this would be an API call with the timeframe parameter
        // const response = await fetch(`/api/mentor/analytics?timeframe=${timeframe}`);
        // const data = await response.json();
        
        // Mock analytics data
        const mockData: MenteeAnalyticsData = {
          totalMentees: 12,
          activeMentees: 9,
          menteeProgress: {
            completing: 3,
            onTrack: 5,
            needsAttention: 2,
            inactive: 2
          },
          averageSessionsPerMentee: 3.5,
          totalSessionsCompleted: 42,
          upcomingSessions: 8,
          courseCompletionRate: 78,
          topSkills: [
            { skill: 'JavaScript', count: 8 },
            { skill: 'React', count: 7 },
            { skill: 'Python', count: 6 },
            { skill: 'Data Analysis', count: 5 },
            { skill: 'AWS', count: 4 }
          ],
          menteeActivityByDay: [
            { day: 'Monday', count: 32 },
            { day: 'Tuesday', count: 45 },
            { day: 'Wednesday', count: 58 },
            { day: 'Thursday', count: 40 },
            { day: 'Friday', count: 35 },
            { day: 'Saturday', count: 20 },
            { day: 'Sunday', count: 12 }
          ],
          mostPopularCourses: [
            { course: 'Web Development Fundamentals', enrolledMentees: 7 },
            { course: 'JavaScript Mastery', enrolledMentees: 6 },
            { course: 'Python for Data Science', enrolledMentees: 5 },
            { course: 'React Framework', enrolledMentees: 5 },
            { course: 'Cloud Computing Essentials', enrolledMentees: 4 }
          ],
          menteesByCareerPath: [
            { path: 'Frontend Developer', count: 5 },
            { path: 'Data Scientist', count: 3 },
            { path: 'Full Stack Developer', count: 2 },
            { path: 'Cloud Architect', count: 1 },
            { path: 'Other', count: 1 }
          ],
          menteePerformanceData: [
            {
              menteeId: 'mentee_1',
              menteeName: 'Alex Johnson',
              menteeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              coursesCompleted: 3,
              activeCourses: 2,
              lastActive: '2025-05-24T14:30:00Z',
              averageGrade: 'A-',
              totalSessions: 6,
              progress: 85
            },
            {
              menteeId: 'mentee_2',
              menteeName: 'Sophia Lee',
              menteeAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              coursesCompleted: 2,
              activeCourses: 3,
              lastActive: '2025-05-25T10:15:00Z',
              averageGrade: 'B+',
              totalSessions: 5,
              progress: 72
            },
            {
              menteeId: 'mentee_3',
              menteeName: 'Michael Chen',
              menteeAvatar: 'https://randomuser.me/api/portraits/men/67.jpg',
              coursesCompleted: 4,
              activeCourses: 1,
              lastActive: '2025-05-23T16:45:00Z',
              averageGrade: 'A',
              totalSessions: 8,
              progress: 92
            },
            {
              menteeId: 'mentee_4',
              menteeName: 'Emma Wilson',
              menteeAvatar: 'https://randomuser.me/api/portraits/women/22.jpg',
              coursesCompleted: 1,
              activeCourses: 3,
              lastActive: '2025-05-20T11:30:00Z',
              averageGrade: 'B',
              totalSessions: 4,
              progress: 45
            },
            {
              menteeId: 'mentee_5',
              menteeName: 'James Rodriguez',
              menteeAvatar: 'https://randomuser.me/api/portraits/men/45.jpg',
              coursesCompleted: 0,
              activeCourses: 2,
              lastActive: '2025-05-15T09:20:00Z',
              averageGrade: 'C+',
              totalSessions: 2,
              progress: 25
            }
          ]
        };
        
        setAnalyticsData(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [timeframe]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Get progress color class
  const getProgressColorClass = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (!analyticsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <BarChart2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Analytics Not Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            We couldn't load the analytics data at this time. Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart2 className="mr-2 h-6 w-6 text-teal-600" />
            Mentee Analytics
          </h1>
          <p className="mt-1 text-gray-600">
            Track your mentees' progress and identify areas for improvement
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
            <button
              onClick={() => setTimeframe('WEEK')}
              className={`px-3 py-1.5 text-sm font-medium ${timeframe === 'WEEK' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeframe('MONTH')}
              className={`px-3 py-1.5 text-sm font-medium ${timeframe === 'MONTH' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeframe('YEAR')}
              className={`px-3 py-1.5 text-sm font-medium ${timeframe === 'YEAR' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
            >
              Year
            </button>
          </div>
          
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
            <Download className="-ml-0.5 mr-1.5 h-4 w-4" />
            Export
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{analyticsData.totalMentees}</h3>
              <p className="text-sm text-gray-500">Total Mentees</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">{analyticsData.activeMentees} active</span>
              <span className="text-sm text-gray-500 ml-1">({Math.round((analyticsData.activeMentees / analyticsData.totalMentees) * 100)}%)</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-green-600 font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Active
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{analyticsData.courseCompletionRate}%</h3>
              <p className="text-sm text-gray-500">Course Completion Rate</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-teal-500 rounded-full" 
              style={{ width: `${analyticsData.courseCompletionRate}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{analyticsData.totalSessionsCompleted}</h3>
              <p className="text-sm text-gray-500">Sessions Completed</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">{analyticsData.averageSessionsPerMentee} avg per mentee</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-teal-600 font-medium">{analyticsData.upcomingSessions} upcoming</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{analyticsData.menteeProgress.onTrack + analyticsData.menteeProgress.completing}</h3>
              <p className="text-sm text-gray-500">On Track or Better</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="flex-1">
              <div className="flex h-2 overflow-hidden bg-gray-200 rounded-full">
                <div className="h-2 bg-green-500" style={{ width: `${(analyticsData.menteeProgress.completing / analyticsData.totalMentees) * 100}%` }}></div>
                <div className="h-2 bg-blue-500" style={{ width: `${(analyticsData.menteeProgress.onTrack / analyticsData.totalMentees) * 100}%` }}></div>
                <div className="h-2 bg-yellow-500" style={{ width: `${(analyticsData.menteeProgress.needsAttention / analyticsData.totalMentees) * 100}%` }}></div>
                <div className="h-2 bg-red-500" style={{ width: `${(analyticsData.menteeProgress.inactive / analyticsData.totalMentees) * 100}%` }}></div>
              </div>
            </div>
            <div className="ml-3 flex items-center">
              <span className="text-sm text-gray-700 font-medium">
                {Math.round(((analyticsData.menteeProgress.onTrack + analyticsData.menteeProgress.completing) / analyticsData.totalMentees) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-teal-600" />
              Weekly Mentee Activity
            </h2>
          </div>
          <div className="p-6">
            {/* In a real application, this would be a chart component */}
            <div className="h-64 flex items-end justify-between space-x-2">
              {analyticsData.menteeActivityByDay.map((day) => {
                const heightPercentage = (day.count / Math.max(...analyticsData.menteeActivityByDay.map(d => d.count))) * 100;
                return (
                  <div key={day.day} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-teal-500 rounded-t-md" 
                      style={{ height: `${heightPercentage}%` }}
                    ></div>
                    <div className="mt-2 text-xs text-gray-500">{day.day.substring(0, 3)}</div>
                    <div className="text-xs font-medium text-gray-700">{day.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-teal-600" />
              Mentees by Career Path
            </h2>
          </div>
          <div className="p-6">
            {/* In a real application, this would be a pie chart component */}
            <div className="space-y-4">
              {analyticsData.menteesByCareerPath.map((path) => (
                <div key={path.path}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{path.path}</span>
                    <span className="text-sm font-medium text-gray-900">{path.count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-teal-500 rounded-full" 
                      style={{ width: `${(path.count / analyticsData.totalMentees) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mentee Performance Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="mr-2 h-5 w-5 text-teal-600" />
            Mentee Performance
          </h2>
          
          <div className="relative inline-block">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-1.5" />
              <select className="focus:ring-teal-500 focus:border-teal-500 shadow-sm sm:text-sm border-gray-300 rounded-md">
                <option>All Mentees</option>
                <option>Active Mentees</option>
                <option>Needs Attention</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mentee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Grade
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.menteePerformanceData.map((mentee) => (
                <tr key={mentee.menteeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {mentee.menteeAvatar ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={mentee.menteeAvatar}
                            alt={mentee.menteeName}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                            {mentee.menteeName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {mentee.menteeName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mentee.coursesCompleted} completed</div>
                    <div className="text-sm text-gray-500">{mentee.activeCourses} active</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(mentee.lastActive)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {mentee.averageGrade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mentee.totalSessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2 w-24">
                        <div 
                          className={`h-2 ${getProgressColorClass(mentee.progress)} rounded-full`} 
                          style={{ width: `${mentee.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {mentee.progress}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Popular Courses */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-teal-600" />
            Most Popular Courses Among Mentees
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analyticsData.mostPopularCourses.map((course) => (
              <div key={course.course}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{course.course}</span>
                  <span className="text-sm font-medium text-gray-900">{course.enrolledMentees} mentees</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-teal-500 rounded-full" 
                    style={{ width: `${(course.enrolledMentees / analyticsData.totalMentees) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
