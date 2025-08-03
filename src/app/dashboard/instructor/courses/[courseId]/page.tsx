"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';


import {
  BookOpen,
  Users,
  FileText,
  Edit,
  Eye,
  Target,
  GitBranch,
  ChevronRight,
  Award
} from 'lucide-react';

// Components
import CourseHeader from '@/components/enhanced-course-dashboard/CourseHeader';
import StatsCard from '@/components/enhanced-course-dashboard/StatsCard';

// Types
type TabType = 'overview' | 'modules' | 'students' | 'analytics' | 'settings';

export default function EnhancedCourseDashboard() {
  const params = useParams();

  const [_activeTab, _setActiveTab] = useState<TabType>('overview');
  const [isPublishing, setIsPublishing] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/instructor/courses/${params.courseId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch course data');
        }
        
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.courseId) {
      fetchCourseData();
    }
  }, [params.courseId]);

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCourse((prev: any) => ({
        ...prev,
        isPublished: !prev.isPublished
      }));
      // In a real app:
      // await fetch(`/api/courses/${params.courseId}/publish`, {
      //   method: 'POST',
      //   body: JSON.stringify({ publish: !course.isPublished })
      // });
    } catch (error) {
      console.error('Error toggling publish status:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error || 'Course not found'}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <CourseHeader 
        course={course} 
        onPublishToggle={handlePublishToggle}
        isPublishing={isPublishing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link href={`/dashboard/instructor/courses/${params.courseId}/students?status=active`}>
            <StatsCard
              icon={<Users className="h-6 w-6 text-indigo-600" />}
              value={course.stats?.activeStudents || 0}
              label="Active Students"
              trend={{ value: course.stats?.totalStudents > 10 ? 12 : 5, isPositive: true, label: 'this month' }}
              color="indigo"
              clickable={true}
            />
          </Link>
          <Link href={`/dashboard/instructor/courses/${params.courseId}/modules`}>
            <StatsCard
              icon={<BookOpen className="h-6 w-6 text-purple-600" />}
              value={course.modulesCount || 0}
              label="Modules"
              color="purple"
              clickable={true}
            />
          </Link>
          <Link href={`/dashboard/instructor/courses/${params.courseId}/projects`}>
            <StatsCard
              icon={<Target className="h-6 w-6 text-pink-600" />}
              value={course.projectsCount || 0}
              label="Projects"
              color="pink"
              clickable={true}
            />
          </Link>
          <Link href={`/dashboard/instructor/courses/${params.courseId}/marks`}>
            <StatsCard
              icon={<Award className="h-6 w-6 text-blue-600" />}
              value={course.averageRating || 0}
              label="Marks"
              color="blue"
              clickable={true}
            />
          </Link>
          <Link href={`/dashboard/instructor/courses/${params.courseId}/commits`}>
            <StatsCard
              icon={<GitBranch className="h-6 w-6 text-emerald-600" />}
              value={course.stats?.codeCommits || 0}
              label="Code Commits"
              color="emerald"
              clickable={true}
            />
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {course.recentActivity?.map((activity: any) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {activity.user.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.user} • {activity.date}
                        </p>
                      </div>
                      <div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project Milestones</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center">
                  View All Milestones
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span>Course Completion</span>
                    <span>{course.completionRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full" 
                      style={{ width: `${course.completionRate || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-4">
                  {course.modules?.map((module: any) => (
                    <div key={module.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{module.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {module.lessons} lessons • {module.duration}
                          </p>
                        </div>
                        {module.completed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                            Completed
                          </span>
                        ) : (
                          <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-800/50">
                            Continue
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Project Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Progress</h2>
                <div className="space-y-4">
                  {course.projects && course.projects.length > 0 ? (
                    course.projects.map((project: any, index: number) => {
                      const colors = ['bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-emerald-600'];
                      const colorClass = colors[index % colors.length];
                      
                      return (
                        <div key={project.id}>
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                            <span>{project.title}</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className={`${colorClass} h-2 rounded-full`} 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400 mb-2">No projects yet</div>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Create your first project to track progress</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <Edit className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Edit Course</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">View Live</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Generate Report</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Course Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Students</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.stats.totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active Students</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.stats.activeStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Project Completion</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.stats.projectCompletion}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Avg. Project Score</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.stats.avgProjectScore}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Mentor Sessions</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.stats.mentorSessions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Code Commits</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.stats.codeCommits}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
