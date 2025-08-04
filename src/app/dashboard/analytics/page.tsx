"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Clock, Award, BookOpen, BarChart2, Calendar, TrendingUp, Zap } from 'lucide-react';

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
        <div className="flex justify-center items-center h-64 min-w-0">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 min-w-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 break-words">Learning Analytics</h1>
            <p className="text-gray-500 mt-1">Track your learning progress and performance</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words min-w-0">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Insights
            </div>
          </div>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {/* Time Spent Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <p className="text-sm font-medium text-indigo-700 break-words">Time Invested</p>
                <h3 className="text-2xl font-bold text-indigo-900 mt-1 break-words">{formatTimeSpent(totalMinutesSpent)}</h3>
                <p className="text-xs text-indigo-500 mt-1">Learning journey</p>
              </div>
              <div className="bg-white bg-opacity-50 p-3 rounded-full overflow-hidden">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full" 
                  style={{ width: `${Math.min(100, (totalMinutesSpent / 1000) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Course Completion Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <p className="text-sm font-medium text-green-700 break-words">Course Progress</p>
                <h3 className="text-2xl font-bold text-green-900 mt-1 break-words">{overallCompletionRate}%</h3>
                <p className="text-xs text-green-500 mt-1">Overall completion</p>
              </div>
              <div className="relative w-12 h-12 bg-white bg-opacity-50 rounded-full flex items-center justify-center min-w-0 overflow-hidden">
                <svg className="w-12 h-12" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray={`${overallCompletionRate}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <BookOpen className="absolute h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          
          {/* Quiz Performance Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <p className="text-sm font-medium text-amber-700 break-words">Quiz Mastery</p>
                <h3 className="text-2xl font-bold text-amber-900 mt-1 break-words">{averageQuizScore}%</h3>
                <p className="text-xs text-amber-500 mt-1">Average score</p>
              </div>
              <div className="bg-white bg-opacity-50 p-3 rounded-full overflow-hidden">
                <BarChart2 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center min-w-0">
              <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden mr-2 min-w-0">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${averageQuizScore}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-amber-700 break-words">{passedQuizzes}/{totalQuizzes}</span>
            </div>
          </div>
          
          {/* Streak Card */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <p className="text-sm font-medium text-rose-700 break-words">Learning Streak</p>
                <h3 className="text-2xl font-bold text-rose-900 mt-1 break-words">{streak.currentStreak} days</h3>
                <p className="text-xs text-rose-500 mt-1">
                  {streak.currentStreak > 0 ? '🔥 Keep it up!' : 'Start your streak today!'}
                </p>
              </div>
              <div className="bg-white bg-opacity-50 p-3 rounded-full overflow-hidden">
                <Zap className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            {streak.longestStreak > 0 && (
              <div className="mt-3 text-xs text-rose-600">
                🏆 Best: {streak.longestStreak} days
              </div>
            )}
          </div>
        </div>
        
        {/* Course Progress Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 break-words">Your Learning Journey</h2>
            <div className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer break-words min-w-0">
              <span>View all courses</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          {courseStats.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100 overflow-hidden">
              <div className="mx-auto h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 min-w-0">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">No courses yet</h3>
              <p className="text-gray-500 mb-4">Enroll in courses to track your progress here</p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words min-w-0">
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="grid gap-4 lg:gap-6 md:grid-cols-2">
              {courseStats.map((course) => (
                <div key={course.courseId} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-300 overflow-hidden">
                  <div className="p-4 lg:p-6">
                    <div className="flex justify-between items-start min-w-0">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 break-words">{course.courseTitle}</h3>
                        <p className="text-sm text-gray-500 break-words">
                          {course.completedLessons} of {course.totalLessons} lessons completed
                        </p>
                      </div>
                      <div className="relative w-12 h-12">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#4F46E5"
                            strokeWidth="3"
                            strokeDasharray={`${course.completionPercentage}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 break-words min-w-0">
                          {course.completionPercentage}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-1 break-words min-w-0">
                        <span>Progress</span>
                        <span>{course.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full" 
                          style={{ width: `${course.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500 min-w-0">
                      <div className="flex items-center min-w-0">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <span>Last active: {formatDate(course.lastActivityAt)}</span>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium break-words">
                        Continue Learning
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Quiz Performance Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 break-words">Quiz Performance</h2>
            <div className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer break-words min-w-0">
              <span>View all attempts</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          {quizPerformance.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100 overflow-hidden">
              <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 min-w-0">
                <Award className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">No quiz attempts yet</h3>
              <p className="text-gray-500">Complete quizzes to see your performance metrics here</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-1 divide-y divide-gray-100">
                {quizPerformance.slice(0, 5).map((quiz) => (
                  <div key={quiz.attemptId} className="p-5 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex-1 min-w-0 min-w-0">
                        <div className="flex items-center min-w-0">
                          <h3 className="text-base font-medium text-gray-900 truncate break-words">{quiz.quizTitle}</h3>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 break-words min-w-0">
                            {quiz.courseTitle}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 break-words min-w-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 min-w-0" />
                          <span>Completed on {formatDate(quiz.completedAt)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center min-w-0">
                        <div className={`flex flex-col items-center ${quiz.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="text-2xl font-bold break-words">{quiz.score}%</div>
                          <div className="text-xs font-medium break-words">
                            {quiz.isPassed ? 'Passed' : 'Failed'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between min-w-0">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200 break-words">
                              Performance
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-indigo-600 break-words">
                              {quiz.score}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100 mt-2 min-w-0">
                          <div 
                            style={{ width: `${quiz.score}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              quiz.isPassed ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Study Streak Section */}
        <div>
          <div className="flex items-center justify-between mb-6 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 break-words">Learning Streak & Goals</h2>
            <div className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer break-words min-w-0">
              <span>View history</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-rose-100">
            <div className="flex flex-col md:flex-row items-center min-w-0">
              <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8 min-w-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-200 rounded-full opacity-50 animate-ping"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg min-w-0">
                    <Zap className="h-10 w-10 text-white" />
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md overflow-hidden">
                      <div className="bg-rose-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center break-words min-w-0">
                        {streak.currentStreak}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-1 break-words">
                  {streak.currentStreak > 0 
                    ? `🔥 ${streak.currentStreak}-Day Streak!` 
                    : 'Start your learning journey!'}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {streak.currentStreak > 0 
                    ? 'You\'re on fire! Keep learning to maintain your streak.'
                    : 'Complete a lesson to start your streak!'}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 min-w-0">
                  <div className="bg-white bg-opacity-70 px-4 py-2 rounded-lg shadow-sm overflow-hidden">
                    <div className="text-sm font-medium text-gray-500 break-words">Current Streak</div>
                    <div className="text-xl font-bold text-rose-600 break-words">{streak.currentStreak} days</div>
                  </div>
                  
                  {streak.longestStreak > 0 && (
                    <div className="bg-white bg-opacity-70 px-4 py-2 rounded-lg shadow-sm overflow-hidden">
                      <div className="text-sm font-medium text-gray-500 break-words">Longest Streak</div>
                      <div className="text-xl font-bold text-gray-700 break-words">{streak.longestStreak} days</div>
                    </div>
                  )}
                  
                  <div className="bg-white bg-opacity-70 px-4 py-2 rounded-lg shadow-sm overflow-hidden">
                    <div className="text-sm font-medium text-gray-500 break-words">Last Active</div>
                    <div className="text-sm font-medium text-gray-700 break-words">
                      {streak.lastActiveDate ? formatDate(streak.lastActiveDate) : 'Never'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all duration-200 transform hover:-translate-y-0.5 break-words min-w-0">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Continue Learning
                  </button>
                </div>
              </div>
            </div>
            
            {/* Weekly Streak Visualization */}
            <div className="mt-8 pt-6 border-t border-rose-100">
              <h4 className="text-sm font-medium text-gray-700 mb-4 text-center break-words">Weekly Activity</h4>
              <div className="flex justify-between max-w-md mx-auto min-w-0">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                  // Simple visualization - in a real app, this would use actual data
                  const isActive = Math.random() > 0.3; // Random for demo
                  return (
                    <div key={index} className="flex flex-col items-center min-w-0">
                      <div 
                        className={`h-2 w-2 rounded-full mb-1 ${isActive ? 'bg-rose-500' : 'bg-rose-100'}`}
                      ></div>
                      <span className="text-xs text-gray-500">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
