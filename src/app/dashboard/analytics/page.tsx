"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Clock, Award, BookOpen, BarChart2, Activity, Calendar } from 'lucide-react';

interface CourseStats {
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  lastActivityAt: string;
}

interface QuizPerformance {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseTitle: string;
  score: number;
  isPassed: boolean;
  completedAt: string;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformance[]>([]);
  const [totalMinutesSpent, setTotalMinutesSpent] = useState(0);
  const [streak, setStreak] = useState<StreakInfo>({ currentStreak: 0, longestStreak: 0, lastActiveDate: null });
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/analytics/user');
        
        if (response.ok) {
          const data = await response.json();
          setCourseStats(data.courseStats || []);
          setQuizPerformance(data.quizPerformance || []);
          setTotalMinutesSpent(data.totalMinutesSpent || 0);
          setStreak(data.currentStreak || { currentStreak: 0, longestStreak: 0, lastActiveDate: null });
        } else {
          console.error('Failed to fetch analytics');
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchAnalytics();
    }
  }, [session]);
  
  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  // Calculate overall completion rate
  const overallCompletionRate = courseStats.length > 0
    ? Math.round(
        courseStats.reduce((sum, course) => sum + course.completionPercentage, 0) / courseStats.length
      )
    : 0;
  
  // Calculate quiz performance
  const totalQuizzes = quizPerformance.length;
  const passedQuizzes = quizPerformance.filter(q => q.isPassed).length;
  const averageQuizScore = totalQuizzes > 0
    ? Math.round(quizPerformance.reduce((sum, q) => sum + q.score, 0) / totalQuizzes)
    : 0;
  
  // Format time spent
  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${remainingMinutes}m`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Learning Analytics</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Time Spent Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Time Spent</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {formatTimeSpent(totalMinutesSpent)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Course Completion Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Course Completion</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {overallCompletionRate}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quiz Performance Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <BarChart2 className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Quiz Performance</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {averageQuizScore}% avg
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Streak Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <Activity className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Learning Streak</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {streak.currentStreak} days
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Course Progress Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Course Progress</h2>
          
          {courseStats.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500">You are not enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {courseStats.map((course) => (
                  <li key={course.courseId}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {course.courseTitle}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {course.completionPercentage}% complete
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <BookOpen className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {course.completedLessons} / {course.totalLessons} lessons
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>
                            Last activity: {formatDate(course.lastActivityAt)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full" 
                          style={{ width: `${course.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Quiz Performance Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Quiz Results</h2>
          
          {quizPerformance.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500">You haven't taken any quizzes yet.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {quizPerformance.slice(0, 5).map((quiz) => (
                  <li key={quiz.attemptId}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {quiz.quizTitle}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${quiz.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {quiz.isPassed ? 'Passed' : 'Failed'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <Award className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            Score: {quiz.score}%
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>
                            Completed: {formatDate(quiz.completedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Study Streak Section */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Learning Streak</h2>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="inline-flex rounded-full bg-indigo-100 p-3 mb-4">
                <Activity className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="mt-3 text-xl font-medium text-indigo-600">
                {streak.currentStreak} day{streak.currentStreak !== 1 ? 's' : ''} streak
              </div>
              
              <p className="mt-2 text-sm text-gray-500">
                Keep learning every day to build your streak!
              </p>
              
              {streak.longestStreak > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  Your longest streak: <span className="font-medium">{streak.longestStreak} days</span>
                </p>
              )}
              
              {streak.lastActiveDate && (
                <p className="mt-2 text-xs text-gray-400">
                  Last active: {formatDate(streak.lastActiveDate)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
