"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Award, 
  MessageSquare, 
  TrendingUp, 
  Calendar, 
  Clock,
  Target,
  CheckCircle,
  Users,
  Coffee,
  ArrowRight
} from 'lucide-react';

// Types for the dashboard data
interface CourseData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  nextLesson?: {
    id: string;
    title: string;
  };
}

interface ProjectData {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  status: string; // 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED', etc.
  submittedAt: string;
  feedback?: string;
  dueDate?: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

interface UpcomingSession {
  id: string;
  title: string;
  mentorName: string;
  date: string;
  time: string;
  imageUrl?: string;
}

interface LearningGoal {
  id: string;
  title: string;
  progress: number;
  deadline?: string;
}

interface DashboardData {
  userName: string;
  userLevel: number;
  userPoints: number;
  nextLevelPoints: number;
  enrolledCourses: CourseData[];
  activeProjects: ProjectData[];
  completedProjects: ProjectData[];
  upcomingSessions: UpcomingSession[];
  streak: StreakData;
  learningGoals: LearningGoal[];
  totalStudyHours: number;
  totalCertificates: number;
  activeStudents: number;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  // Use useMemo to prevent recreating the object on every render
  const placeholderData = useMemo<DashboardData>(() => ({
    userName: session?.user?.name || 'Student',
    userLevel: 3,
    userPoints: 750,
    nextLevelPoints: 1000,
    enrolledCourses: [
      {
        id: 'course1',
        title: 'UX Design Fundamentals',
        description: 'Learn the core principles of user experience design',
        imageUrl: '/images/courses/ux-design.jpg',
        totalLessons: 12,
        completedLessons: 5,
        completionPercentage: 42,
        nextLesson: {
          id: 'lesson6',
          title: 'User Research Methods'
        }
      },
      {
        id: 'course2',
        title: 'Web Development with React',
        description: 'Master modern web development with React',
        imageUrl: '/images/courses/react-dev.jpg',
        totalLessons: 15,
        completedLessons: 3,
        completionPercentage: 20,
        nextLesson: {
          id: 'lesson4',
          title: 'State Management'
        }
      },
      {
        id: 'course3',
        title: 'Data Science for Beginners',
        description: 'Introduction to data analysis and visualization',
        imageUrl: '/images/courses/data-science.jpg',
        totalLessons: 10,
        completedLessons: 1,
        completionPercentage: 10,
        nextLesson: {
          id: 'lesson2',
          title: 'Introduction to Pandas'
        }
      }
    ],
    activeProjects: [
      {
        id: 'project1',
        title: 'UX Design Portfolio',
        courseId: 'course1',
        courseTitle: 'UX Design Fundamentals',
        status: 'SUBMITTED',
        submittedAt: '2025-05-20T15:30:00Z',
        dueDate: '2025-05-30T23:59:59Z'
      },
      {
        id: 'project2',
        title: 'React Component Library',
        courseId: 'course2',
        courseTitle: 'Web Development with React',
        status: 'REVISION_REQUESTED',
        submittedAt: '2025-05-18T11:45:00Z',
        feedback: 'Please improve the component documentation',
        dueDate: '2025-05-25T23:59:59Z'
      }
    ],
    completedProjects: [
      {
        id: 'project3',
        title: 'User Research Report',
        courseId: 'course1',
        courseTitle: 'UX Design Fundamentals',
        status: 'APPROVED',
        submittedAt: '2025-05-10T09:20:00Z'
      }
    ],
    upcomingSessions: [
      {
        id: 'session1',
        title: 'Career Planning in UX Design',
        mentorName: 'Sarah Johnson',
        date: '2025-05-28',
        time: '15:00-16:00',
        imageUrl: '/images/mentors/sarah.jpg'
      },
      {
        id: 'session2',
        title: 'React Project Review',
        mentorName: 'Michael Chen',
        date: '2025-05-30',
        time: '11:00-12:00',
        imageUrl: '/images/mentors/michael.jpg'
      }
    ],
    streak: {
      currentStreak: 5,
      longestStreak: 12,
      lastActiveDate: '2025-05-25'
    },
    learningGoals: [
      {
        id: 'goal1',
        title: 'Complete UX Design Fundamentals',
        progress: 42,
        deadline: '2025-06-15'
      },
      {
        id: 'goal2',
        title: 'Build a React portfolio project',
        progress: 25,
        deadline: '2025-07-01'
      },
      {
        id: 'goal3',
        title: 'Learn basics of Python for Data Science',
        progress: 10,
        deadline: '2025-07-30'
      }
    ],
    totalStudyHours: 24,
    totalCertificates: 1,
    activeStudents: 256
  }), [session]);

  useEffect(() => {
    if (!session) return;
    
    const fetchDashboardData = () => {
      setIsLoading(true);
      fetch('/api/analytics/user')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch analytics');
          return res.json();
        })
        .then(data => {
          // Map API data to DashboardData structure
          const dashboard: DashboardData = {
            userName: session.user?.name || 'Student',
            userLevel: 1, // You can enhance this based on XP/points logic
            userPoints: data.totalMinutesSpent || 0, // Example: use minutes as points
            nextLevelPoints: 1000, // Placeholder for next level
            enrolledCourses: (data.courseStats || []).map((c: any) => ({
              id: c.courseId,
              title: c.courseTitle,
              description: '',
              imageUrl: null,
              totalLessons: c.totalLessons || 0,
              completedLessons: c.completedLessons || 0,
              completionPercentage: c.completionPercentage || 0,
              nextLesson: c.nextLessonId ? { id: c.nextLessonId, title: c.nextLessonTitle || 'Next Lesson' } : undefined
            })),
            activeProjects: (data.activeProjects || []).slice(0, 3).map((p: any) => ({
              id: p.id,
              title: p.title || 'Untitled Project',
              courseId: p.courseId,
              courseTitle: p.courseTitle || 'Course',
              status: p.status || 'PENDING',
              submittedAt: p.submittedAt || new Date().toISOString(),
              dueDate: p.dueDate,
              feedback: p.feedback
            })),
            completedProjects: (data.completedProjects || []).slice(0, 3).map((p: any) => ({
              id: p.id,
              title: p.title || 'Completed Project',
              courseId: p.courseId,
              courseTitle: p.courseTitle || 'Course',
              status: 'APPROVED',
              submittedAt: p.submittedAt || new Date().toISOString()
            })),
            upcomingSessions: [], // You can fill this from another API if needed
            streak: {
              currentStreak: data.currentStreak?.currentStreak || 0,
              longestStreak: data.currentStreak?.longestStreak || 0,
              lastActiveDate: data.currentStreak?.lastActiveDate || ''
            },
            learningGoals: data.learningGoals || [],
            totalStudyHours: data.totalHours || 24,
            totalCertificates: data.totalCertificates || 1,
            activeStudents: data.activeStudents || 256
          };
          setDashboardData(dashboard);
        })
        .catch(error => {
          console.error('Error fetching dashboard data:', error);
          // Fall back to placeholder data on error
          setDashboardData(placeholderData);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };
    
    fetchDashboardData();
    // Only depend on session changes, not placeholderData which is already memoized
  }, [session]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-20 bg-gray-200 rounded col-span-1"></div>
                <div className="h-20 bg-gray-200 rounded col-span-1"></div>
                <div className="h-20 bg-gray-200 rounded col-span-1"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-40 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Error loading dashboard</div>;
  }

  // Calculate level progress
  const levelProgressPercentage = (dashboardData.userPoints / dashboardData.nextLevelPoints) * 100;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Section with User Welcome and Level Progress */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center sm:text-left"
        >
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {dashboardData.userName}!</h1>
          <p className="mt-2 opacity-90">Here's an overview of your learning progress</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Level Progress</span>
              <span>{Math.round(levelProgressPercentage)}%</span>
            </div>
            <div className="h-2 bg-blue-800 bg-opacity-40 rounded-full">
              <div 
                className="h-full bg-white rounded-full" 
                style={{ width: `${levelProgressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex mt-6 space-x-4">
            <div className="text-center">
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth="8" 
                  />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="8" 
                    strokeDasharray="283" 
                    strokeDashoffset={283 - (283 * levelProgressPercentage / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{dashboardData.userLevel}</span>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium">Level</p>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-2">
                <Award className="h-6 w-6" />
                <span className="text-2xl font-bold">{dashboardData.userPoints}</span>
              </div>
              <p className="mt-2 text-sm font-medium">XP Points</p>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Continue Learning
              </h2>
              <Link href="/courses" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                All Courses
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.enrolledCourses.slice(0, 2).map((course) => (
                <div key={course.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {course.completionPercentage}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${course.completionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {course.completedLessons} of {course.totalLessons} lessons
                    </div>
                    <Link 
                      href={`/courses/${course.id}`}
                      className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Continue
                    </Link>
                  </div>
                </div>
              ))}

              {dashboardData.enrolledCourses.length > 2 && (
                <Link 
                  href="/dashboard/student/my-courses" 
                  className="block text-center py-3 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  View all {dashboardData.enrolledCourses.length} courses
                </Link>
              )}
            </div>
          </motion.section>
          
          {/* Learning Goals */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Target className="h-5 w-5 mr-2 text-indigo-600" />
                Your Learning Goals
              </h2>
              <Link href="/dashboard/student/goals" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Manage Goals
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.learningGoals.map((goal) => (
                <div key={goal.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{goal.title}</h3>
                    <span className="text-sm text-gray-500">
                      {goal.deadline ? `Due: ${new Date(goal.deadline).toLocaleDateString()}` : 'No deadline'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {goal.progress}% complete
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Projects */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Your Projects
              </h2>
              <Link href="/dashboard/student/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                All Projects
              </Link>
            </div>

            {(dashboardData.activeProjects.length > 0 || dashboardData.completedProjects.length > 0) ? (
              <div className="space-y-4">
                {dashboardData.activeProjects.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-2">Active Projects</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardData.activeProjects.map((project) => (
                            <tr key={project.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                <Link href={`/dashboard/student/projects/${project.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                  {project.title}
                                </Link>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{project.courseTitle}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span 
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    project.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' : 
                                    project.status === 'REVISION_REQUESTED' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-gray-100 text-gray-800'}`}
                                >
                                  {project.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {dashboardData.completedProjects.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium text-gray-700 mb-2">Completed Projects</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardData.completedProjects.map((project) => (
                            <tr key={project.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                <Link href={`/dashboard/student/projects/${project.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                  {project.title}
                                </Link>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{project.courseTitle}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {new Date(project.submittedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">No projects yet. Start working on course projects to build your portfolio.</p>
                <Link href="/courses" className="inline-block mt-3 text-blue-600 hover:text-blue-700">
                  Browse Courses
                </Link>
              </div>
            )}
          </motion.section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="rounded-full bg-purple-100 w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{dashboardData.totalStudyHours}</h3>
              <p className="text-xs text-gray-500 mt-1">Study Hours</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="rounded-full bg-yellow-100 w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{dashboardData.totalCertificates}</h3>
              <p className="text-xs text-gray-500 mt-1">Certificates</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="rounded-full bg-green-100 w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{dashboardData.streak.currentStreak}</h3>
              <p className="text-xs text-gray-500 mt-1">Day Streak</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="rounded-full bg-blue-100 w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{dashboardData.activeStudents}</h3>
              <p className="text-xs text-gray-500 mt-1">Active Students</p>
            </div>
          </motion.section>

          {/* Upcoming Mentor Sessions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                Upcoming Sessions
              </h2>
              <Link href="/dashboard/student/sessions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </Link>
            </div>

            {dashboardData.upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-full overflow-hidden mr-4 bg-gray-200 flex-shrink-0">
                      {session.imageUrl ? (
                        <Image 
                          src={session.imageUrl} 
                          alt={session.mentorName} 
                          width={48} 
                          height={48} 
                          className="object-cover"
                        />
                      ) : (
                        <Users className="h-6 w-6 m-3 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900">{session.title}</h3>
                      <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                        <span className="mr-3">With {session.mentorName}</span>
                        <span className="mr-3">{session.date}</span>
                        <span>{session.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">No upcoming mentor sessions. Book a session to get personalized guidance.</p>
                <Link href="/mentors" className="inline-block mt-3 text-blue-600 hover:text-blue-700">
                  Find a Mentor
                </Link>
              </div>
            )}
          </motion.section>

          {/* Daily Tip */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-sm p-6 text-white"
          >
            <div className="flex items-center mb-3">
              <Coffee className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold">Daily Tip</h2>
            </div>
            <p className="mb-4">"Consistency is key to mastery. Try to study for at least 25 minutes each day rather than cramming hours in a single session."</p>
            <div className="text-sm">
              <Link href="/tips" className="text-white underline hover:no-underline">Get more learning tips</Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}