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
type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Mock data - replace with real data from your API
const mockCourseData = {
  id: '1',
  title: 'Advanced Web Development',
  shortDescription: 'Master modern web development with the latest technologies and frameworks',
  imageUrl: '/images/course-cover.jpg',
  isPublished: true,
  enrollmentCount: 1248,
  averageRating: 4.8,
  modulesCount: 8,
  projectsCount: 5,
  lessonsCount: 64,
  difficulty: 'INTERMEDIATE' as Difficulty,
  updatedAt: '2025-05-15T10:30:00Z',
  completionRate: 78,
  totalHours: 24,
  assignments: 12,
  projects: 4,
  satisfactionRate: 96,
  lastUpdated: '2 days ago',
  instructor: {
    name: 'Alex Johnson',
    avatar: '/images/instructor-avatar.jpg',
    title: 'Senior Web Developer',
  },
  stats: {
    totalStudents: 1248,
    activeStudents: 842,
    projectCompletion: 65,
    avgProjectScore: '87%',
    mentorSessions: 24,
    peerReviews: 156,
    codeCommits: 842,
    projectMilestones: 4,
  },
  recentActivity: [
    { id: 1, type: 'assignment', title: 'Final Project Submission', date: '2 hours ago', user: 'Sarah M.' },
    { id: 2, type: 'comment', title: 'Question about React Hooks', date: '5 hours ago', user: 'Michael T.' },
    { id: 3, type: 'enrollment', title: 'New student enrolled', date: '1 day ago', user: 'Emma R.' },
  ],
  modules: [
    { id: 1, title: 'Getting Started with Modern JavaScript', lessons: 8, duration: '2h 30m', completed: true },
    { id: 2, title: 'React Fundamentals', lessons: 10, duration: '4h 15m', completed: true },
    { id: 3, title: 'State Management with Redux', lessons: 6, duration: '3h 45m', completed: true },
    { id: 4, title: 'Advanced React Patterns', lessons: 8, duration: '3h 20m', completed: false },
    { id: 5, title: 'Building Scalable APIs', lessons: 7, duration: '3h 0m', completed: false },
  ],
};

type TabType = 'overview' | 'modules' | 'students' | 'analytics' | 'settings';

export default function EnhancedCourseDashboard() {
  const params = useParams();

  const [_activeTab, _setActiveTab] = useState<TabType>('overview');
  const [isPublishing, setIsPublishing] = useState(false);
  const [course, setCourse] = useState(mockCourseData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch course data here
    const fetchCourseData = async () => {
      try {
        // const response = await fetch(`/api/courses/${params.courseId}`);
        // const data = await response.json();
        // setCourse(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [params.courseId]);

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCourse(prev => ({
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
              value={course.stats.activeStudents}
              label="Active Students"
              trend={{ value: 24, isPositive: true, label: 'this month' }}
              color="indigo"
              clickable={true}
            />
          </Link>
          <Link href={`/dashboard/instructor/courses/${params.courseId}/modules`}>
            <StatsCard
              icon={<BookOpen className="h-6 w-6 text-purple-600" />}
              value={course.modulesCount}
              label="Modules"
              color="purple"
              clickable={true}
            />
          </Link>
          <Link href={`/dashboard/instructor/courses/${params.courseId}/projects`}>
            <StatsCard
              icon={<Target className="h-6 w-6 text-pink-600" />}
              value={course.projectsCount || 5}
              label="Projects"
              color="pink"
              clickable={true}
            />
          </Link>
          <Link href={`/dashboard/instructor/courses/${params.courseId}/marks`}>
            <StatsCard
              icon={<Award className="h-6 w-6 text-blue-600" />}
              value={course.averageRating}
              label="Marks"
              color="blue"
              clickable={true}
            />
          </Link>
          <Link href={`/dashboard/instructor/courses/${params.courseId}/commits`}>
            <StatsCard
              icon={<GitBranch className="h-6 w-6 text-emerald-600" />}
              value={course.stats.codeCommits}
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
                {course.recentActivity.map((activity) => (
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
                    <span>60%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full" 
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-4">
                  {course.modules.map((module) => (
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
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span>Project Milestone 1</span>
                      <span>82%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: '82%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span>Project Milestone 2</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: '65%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span>Project Milestone 3</span>
                      <span>42%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-pink-600 h-2 rounded-full" 
                        style={{ width: '42%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span>Final Project</span>
                      <span>28%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: '28%' }}
                      ></div>
                    </div>
                  </div>
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
