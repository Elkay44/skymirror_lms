'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  BookOpen, 
  FileText, 
  Award, 
  MessageSquare, 
  Target, 
  GitBranch, 
  ArrowLeft, 
  CheckCircle, 
  TrendingUp, 
  Star, 
  Clock, 
  Play, 
  Users, 
  FileBox,
  Lock,
  FolderOpen,
  GitCommit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types
type TabType = 'overview' | 'modules' | 'marks' | 'forum' | 'projects' | 'commits';

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  instructor: {
    id: string;
    name: string;
    image?: string;
  };
  modules: Module[];
  progress: number;
  totalLessons: number;
  completedLessons: number;
  enrolledAt: string;
  status: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  isLocked: boolean;
  progress: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  completed: boolean;
  videoUrl?: string;
  type: 'video' | 'text' | 'quiz';
}

export default function StudentCourseDashboard() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Additional data states
  const [marksData, setMarksData] = useState<any>(null);
  const [forumsData, setForumsData] = useState<any>(null);
  const [projectsData, setProjectsData] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loadingAdditionalData, setLoadingAdditionalData] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!session?.user?.id || !courseId) return;
    
    fetchCourse();
    // Fetch overview data since it's the default tab
    fetchOverviewData();
  }, [session, courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/courses/${courseId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You are not enrolled in this course');
        }
        throw new Error('Failed to fetch course data');
      }
      
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarksData = async () => {
    try {
      setLoadingAdditionalData(prev => ({ ...prev, marks: true }));
      const response = await fetch(`/api/courses/${courseId}/marks`);
      
      if (response.ok) {
        const data = await response.json();
        setMarksData(data);
      }
    } catch (err) {
      console.error('Error fetching marks:', err);
    } finally {
      setLoadingAdditionalData(prev => ({ ...prev, marks: false }));
    }
  };

  const fetchForumsData = async () => {
    try {
      setLoadingAdditionalData(prev => ({ ...prev, forums: true }));
      const response = await fetch(`/api/courses/${courseId}/forums`);
      
      if (response.ok) {
        const data = await response.json();
        setForumsData(data);
      }
    } catch (err) {
      console.error('Error fetching forums:', err);
    } finally {
      setLoadingAdditionalData(prev => ({ ...prev, forums: false }));
    }
  };

  const fetchProjectsData = async () => {
    try {
      setLoadingAdditionalData(prev => ({ ...prev, projects: true }));
      const response = await fetch(`/api/courses/${courseId}/projects`);
      
      if (response.ok) {
        const data = await response.json();
        setProjectsData(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoadingAdditionalData(prev => ({ ...prev, projects: false }));
    }
  };

  const fetchOverviewData = async () => {
    try {
      setLoadingAdditionalData(prev => ({ ...prev, overview: true }));
      
      // Fetch recent activity and learning stats
      const [activityResponse, statsResponse] = await Promise.all([
        fetch(`/api/student/courses/${courseId}/activity`),
        fetch(`/api/student/courses/${courseId}/stats`)
      ]);
      
      const activityData = activityResponse.ok ? await activityResponse.json() : null;
      const statsData = statsResponse.ok ? await statsResponse.json() : null;
      
      setOverviewData({
        recentActivity: activityData?.activities || [],
        learningStats: statsData || {},
        quickActions: {
          continueLesson: course?.modules?.find(m => !m.isLocked)?.lessons?.find(l => !l.completed) || null,
          pendingAssignments: statsData?.pendingAssignments || 0,
          activeForums: statsData?.activeForums || 0
        }
      });
    } catch (err) {
      console.error('Error fetching overview data:', err);
      // Set default data if API fails
      setOverviewData({
        recentActivity: [],
        learningStats: {},
        quickActions: {
          continueLesson: null,
          pendingAssignments: 0,
          activeForums: 0
        }
      });
    } finally {
      setLoadingAdditionalData(prev => ({ ...prev, overview: false }));
    }
  };

  const fetchAdditionalData = (tabType: TabType) => {
    switch (tabType) {
      case 'overview':
        if (!overviewData) fetchOverviewData();
        break;
      case 'marks':
        if (!marksData) fetchMarksData();
        break;
      case 'forum':
        if (!forumsData) fetchForumsData();
        break;
      case 'projects':
        if (!projectsData) fetchProjectsData();
        break;
    }
  };

  const handleLessonClick = (moduleId: string, lessonId: string) => {
    router.push(`/dashboard/student/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Course</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <Button onClick={() => router.push('/dashboard/student/courses')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'modules', label: 'Modules', icon: FileText },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
    { id: 'projects', label: 'Projects', icon: Target },
    { id: 'commits', label: 'Commits', icon: GitBranch },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        if (loadingAdditionalData.overview) {
          return (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading overview data...</span>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 lg:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        const nextLesson = overviewData?.quickActions?.continueLesson;
                        if (nextLesson) {
                          handleLessonClick(nextLesson.moduleId, nextLesson.id);
                        } else {
                          setActiveTab('modules');
                        }
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <Play className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-900 dark:text-white block">Continue Learning</span>
                          {overviewData?.quickActions?.continueLesson && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {overviewData.quickActions.continueLesson.title}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('projects')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-900 dark:text-white block">View Assignments</span>
                          {overviewData?.quickActions?.pendingAssignments > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {overviewData.quickActions.pendingAssignments} pending
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('forum')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-900 dark:text-white block">Join Discussion</span>
                          {overviewData?.quickActions?.activeForums > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {overviewData.quickActions.activeForums} active topics
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                    </button>
                    
                    <button 
                      onClick={() => window.location.href = `/tips`}
                      className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <FileBox className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-900 dark:text-white block">Learning Resources</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Tips and strategies to improve learning
                          </span>
                        </div>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 lg:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {overviewData?.recentActivity?.length > 0 ? (
                      overviewData.recentActivity.map((activity: any, index: number) => {
                        const getActivityIcon = (type: string) => {
                          switch (type) {
                            case 'lesson_completed':
                              return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
                            case 'video_watched':
                              return <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
                            case 'assignment_submitted':
                              return <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
                            case 'quiz_completed':
                              return <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
                            default:
                              return <BookOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
                          }
                        };

                        const formatTimeAgo = (timestamp: string) => {
                          const now = new Date();
                          const activityTime = new Date(timestamp);
                          const diffInHours = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60 * 60));
                          
                          if (diffInHours < 1) return 'Just now';
                          if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                          const diffInDays = Math.floor(diffInHours / 24);
                          return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                        };

                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            {getActivityIcon(activity.type)}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Start learning to see your activity here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learning Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(course.progress)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Lessons Completed</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.completedLessons}/{course.totalLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Current Grade</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {overviewData?.learningStats?.currentGrade || marksData?.letterGrade || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Study Streak</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {overviewData?.learningStats?.studyStreak ? `${overviewData.learningStats.studyStreak} days` : '0 days'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Time Spent</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {overviewData?.learningStats?.timeSpent ? `${overviewData.learningStats.timeSpent} hours` : '0 hours'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Assignments Done</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {overviewData?.learningStats?.assignmentsCompleted && overviewData?.learningStats?.totalAssignments
                        ? `${overviewData.learningStats.assignmentsCompleted}/${overviewData.learningStats.totalAssignments}`
                        : '0/0'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'modules':
        return (
          <div className="space-y-6">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {module.isLocked ? (
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {moduleIndex + 1}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{module.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{module.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        module.isLocked 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                          : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                      }`}>
                        {Math.round(module.progress)}% Complete
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 lg:p-6">
                  <div className="space-y-3">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          lesson.completed
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                            : module.isLocked
                            ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed opacity-60'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                        onClick={() => !module.isLocked && handleLessonClick(module.id, lesson.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {lesson.completed ? (
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            ) : module.isLocked ? (
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700">
                                <Lock className="h-5 w-5 text-gray-400" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                <Play className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{lesson.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(lesson.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'marks':
        if (loadingAdditionalData.marks) {
          return (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2">Loading marks...</span>
            </div>
          );
        }
        
        const currentStudentData = marksData?.students?.find((s: any) => s.studentId === session?.user?.id);
        const averageGrade = currentStudentData?.averageGrade || 0;
        const letterGrade = currentStudentData?.letterGrade || 'N/A';
        const completedAssignments = currentStudentData?.assignments?.filter((a: any) => a.grade !== null).length || 0;
        const totalAssignments = currentStudentData?.assignments?.length || 0;
        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">{letterGrade}</div>
                  <p className="text-sm text-gray-600 mt-1">Current Grade</p>
                  <p className="text-xs text-gray-500 mt-1">{averageGrade.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">{completedAssignments}</div>
                  <p className="text-sm text-gray-600 mt-1">Assignments Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">{totalAssignments}</div>
                  <p className="text-sm text-gray-600 mt-1">Total Assignments</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Assessment Categories */}
            {marksData?.classAnalytics?.assessmentCategories && (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marksData.classAnalytics.assessmentCategories.map((category: any) => (
                      <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-sm text-gray-600">Weight: {category.weight}%</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{category.averageScore?.toFixed(1) || 0}%</p>
                          <p className="text-sm text-gray-600">
                            {category.completedAssessments || 0}/{category.totalAssessments || 0} completed
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Individual Assignments */}
            {currentStudentData?.assignments && currentStudentData.assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentStudentData.assignments.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-gray-600">
                            {assignment.submittedAt ? 
                              `Submitted: ${new Date(assignment.submittedAt).toLocaleDateString()}` : 
                              'Not submitted'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {assignment.grade !== null ? 
                              `${assignment.grade}/${assignment.maxScore}` : 
                              'Not graded'
                            }
                          </p>
                          {assignment.grade !== null && (
                            <p className="text-sm text-gray-600">
                              {((assignment.grade / assignment.maxScore) * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!marksData && (
              <Card>
                <CardHeader>
                  <CardTitle>Grade Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">No grade data available yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'forum':
        if (loadingAdditionalData.forums) {
          return (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2">Loading forums...</span>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            {forumsData?.data?.forums && forumsData.data.forums.length > 0 ? (
              forumsData.data.forums.map((forum: any) => (
                <div key={forum.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0">
                        <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{forum.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{forum.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>{forum.threadCount} threads</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span>{forum.postCount} posts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span>Last: {new Date(forum.lastPostAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                          View Forum
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Forums Available</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">There are no discussion forums for this course yet. Check back later or contact your instructor.</p>
              </div>
            )}
          </div>
        );

      case 'projects':
        if (loadingAdditionalData.projects) {
          return (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2">Loading projects...</span>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            {projectsData?.data && projectsData.data.length > 0 ? (
              projectsData.data.map((project: any) => (
                <div key={project.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                        <FolderOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.title}</h3>
                            {project.module && (
                              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Module: {project.module.title}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                              {project.pointsValue} points
                            </div>
                          </div>
                        </div>
                        
                        {project.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {project.dueDate && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>{project._count?.submissions || 0} submissions</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {project.isRequiredForCertification && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                                Required for Certification
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/student/projects/${project.id}`} className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                              View Project
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mx-auto mb-6">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Projects Available</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">There are no project assignments for this course yet. Check back later or contact your instructor.</p>
              </div>
            )}
          </div>
        );

      case 'commits':
        return (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mx-auto mb-6">
              <GitCommit className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Commits Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Your code commits and version history will appear here when you start working on projects.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl overflow-hidden shadow-2xl mb-8 mx-4 sm:mx-6 lg:mx-8 mt-8">
        <div className="relative h-72 w-full">
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-purple-800" />
          )}
          
          <div className="relative z-10 h-full flex flex-col justify-center p-8 text-white min-w-0">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex flex-wrap items-center gap-3 mb-4 min-w-0">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/student/courses')}
                  className="text-white hover:bg-white/20 border-white/20 mb-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to My Courses
                </Button>
                
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Enrolled
                </span>
                
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Enrolled {new Date(course.enrolledAt).toLocaleDateString()}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight break-words">
                {course.title}
              </h1>
              
              <p className="text-lg md:text-xl text-indigo-100 max-w-3xl mb-8 break-words">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-indigo-100">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Instructor: {course.instructor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{course.totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{course.completedLessons} completed</span>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Course Progress</span>
                  <span>{Math.round(course.progress)}%</span>
                </div>
                <Progress value={course.progress} className="w-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {course.completedLessons}
              </div>
              <h3 className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                Completed
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(course.progress)}%
              </div>
              <h3 className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                Progress
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30">
                <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                A-
              </div>
              <h3 className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                Current Grade
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {course.modules?.length || 0}
              </div>
              <h3 className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                Modules
              </h3>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      fetchAdditionalData(tab.id as TabType);
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
