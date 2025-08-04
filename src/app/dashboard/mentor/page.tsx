"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle,
  Target,
  Plus,
  Star,
  Video,
  FileText,
  Edit3,
  BookOpen,
  Wrench,
  Copy
} from 'lucide-react';

// Types for the dashboard data
interface MenteeData {
  id: string;
  name: string;
  imageUrl: string | null;
  careerGoal: string;
  lastSessionDate: string | null;
  progressPercentage: number;
  upcomingSession: {
    id: string;
    date: string;
    time: string;
  } | null;
  activeMilestones: number;
  completedMilestones: number;
}

interface UpcomingSession {
  id: string;
  menteeId: string;
  menteeName: string;
  menteeImage: string | null;
  date: string;
  time: string;
  topic: string;
  type: 'ONE_ON_ONE' | 'CAREER_PLANNING' | 'PROJECT_REVIEW' | 'GENERAL_GUIDANCE';
  notes: string | null;
}

interface CareerPath {
  id: string;
  title: string;
  description: string;
  menteeCount: number;
  milestoneCount: number;
  averageCompletionRate: number;
}

interface Resource {
  id: string;
  title: string;
  type: 'ARTICLE' | 'VIDEO' | 'EBOOK' | 'TOOL' | 'TEMPLATE';
  url: string;
  tags: string[];
  shareCount: number;
}

interface MentorStats {
  totalMentees: number;
  activeMentees: number;
  sessionCompletedThisMonth: number;
  averageMenteeRating: number;
  menteeRetentionRate: number;
  totalHoursThisMonth: number;
}

interface DashboardData {
  mentorName: string;
  mentees: MenteeData[];
  upcomingSessions: UpcomingSession[];
  careerPaths: CareerPath[];
  resources: Resource[];
  overallStats: MentorStats;
}

export default function MentorDashboard() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Use useMemo to prevent recreating the object on every render
  const placeholderData = useMemo<DashboardData>(() => ({
    mentorName: session?.user?.name || 'Mentor',
    mentees: [
      {
        id: 'mentee1',
        name: 'Emma Thompson',
        imageUrl: '/images/mentees/emma.jpg',
        careerGoal: 'UX Designer',
        lastSessionDate: '2025-05-18',
        progressPercentage: 65,
        upcomingSession: {
          id: 'session1',
          date: '2025-05-27',
          time: '15:00-16:00'
        },
        activeMilestones: 4,
        completedMilestones: 7
      },
      {
        id: 'mentee2',
        name: 'Daniel Lee',
        imageUrl: '/images/mentees/daniel.jpg',
        careerGoal: 'Frontend Developer',
        lastSessionDate: '2025-05-20',
        progressPercentage: 42,
        upcomingSession: {
          id: 'session2',
          date: '2025-05-28',
          time: '11:00-12:00'
        },
        activeMilestones: 3,
        completedMilestones: 2
      },
      {
        id: 'mentee3',
        name: 'Sofia Martinez',
        imageUrl: '/images/mentees/sofia.jpg',
        careerGoal: 'Data Scientist',
        lastSessionDate: '2025-05-15',
        progressPercentage: 78,
        upcomingSession: null,
        activeMilestones: 2,
        completedMilestones: 8
      }
    ],
    upcomingSessions: [
      {
        id: 'session1',
        menteeId: 'mentee1',
        menteeName: 'Emma Thompson',
        menteeImage: '/images/mentees/emma.jpg',
        date: '2025-05-27',
        time: '15:00-16:00',
        topic: 'UX Portfolio Review',
        type: 'PROJECT_REVIEW',
        notes: 'Review portfolio projects and discuss improvements for job applications.'
      },
      {
        id: 'session2',
        menteeId: 'mentee2',
        menteeName: 'Daniel Lee',
        menteeImage: '/images/mentees/daniel.jpg',
        date: '2025-05-28',
        time: '11:00-12:00',
        topic: 'React Advanced Patterns',
        type: 'ONE_ON_ONE',
        notes: 'Discuss component design patterns and state management strategies.'
      },
      {
        id: 'session3',
        menteeId: 'mentee4',
        menteeName: 'Olivia Wilson',
        menteeImage: '/images/mentees/olivia.jpg',
        date: '2025-05-30',
        time: '14:00-15:00',
        topic: 'Career Planning Session',
        type: 'CAREER_PLANNING',
        notes: 'Discuss long-term career goals and create a development roadmap.'
      }
    ],
    careerPaths: [
      {
        id: 'path1',
        title: 'UX Designer Career Path',
        description: 'Comprehensive roadmap for becoming a professional UX designer',
        menteeCount: 4,
        milestoneCount: 12,
        averageCompletionRate: 58
      },
      {
        id: 'path2',
        title: 'Frontend Developer Roadmap',
        description: 'Step-by-step path to becoming a frontend developer',
        menteeCount: 6,
        milestoneCount: 15,
        averageCompletionRate: 42
      },
      {
        id: 'path3',
        title: 'Data Science Fundamentals',
        description: 'Essential skills and knowledge for data science careers',
        menteeCount: 3,
        milestoneCount: 18,
        averageCompletionRate: 35
      }
    ],
    resources: [
      {
        id: 'resource1',
        title: 'UX Design Systems: A Complete Guide',
        type: 'ARTICLE',
        url: 'https://example.com/ux-design-systems',
        tags: ['UX Design', 'Design Systems', 'UI'],
        shareCount: 12
      },
      {
        id: 'resource2',
        title: 'React Performance Optimization Techniques',
        type: 'VIDEO',
        url: 'https://example.com/react-performance',
        tags: ['React', 'Web Development', 'Performance'],
        shareCount: 8
      },
      {
        id: 'resource3',
        title: 'Career Development Plan Template',
        type: 'TEMPLATE',
        url: 'https://example.com/career-template',
        tags: ['Career Planning', 'Professional Development'],
        shareCount: 15
      }
    ],
    overallStats: {
      totalMentees: 9,
      activeMentees: 7,
      sessionCompletedThisMonth: 14,
      averageMenteeRating: 4.8,
      menteeRetentionRate: 92,
      totalHoursThisMonth: 18
    }
  }), [session]);

  useEffect(() => {
    if (!session) return;
    
    const fetchDashboardData = () => {
      setIsLoading(true);
      // In a production app, we would fetch data from an API endpoint
      // For now, simulate an API call with setTimeout
      setTimeout(() => {
        try {
          // Simulating successful data fetch
          setDashboardData(placeholderData);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          // Still use placeholder data on error for demo purposes
          setDashboardData(placeholderData);
        } finally {
          setIsLoading(false);
        }
      }, 1000);
    };
    
    fetchDashboardData();
    
    // No need for cleanup since we're using setTimeout which will be garbage collected
    // Only depend on session changes, not placeholderData which is already memoized
  }, [session]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse flex space-x-4 min-w-0">
          <div className="flex-1 space-y-4 lg:space-y-6 py-1 min-w-0">
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Hero Section with Mentor Welcome and Quick Stats */}
      <section className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-2xl p-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-center min-w-0"
        >
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold mb-2 break-words">Welcome back, {dashboardData.mentorName}!</h1>
            <p className="text-teal-100">
              You have {dashboardData.upcomingSessions.length} upcoming mentoring sessions.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center px-4 py-2 bg-white bg-opacity-10 rounded-lg overflow-hidden">
              <div className="text-2xl font-bold break-words">{dashboardData.overallStats.activeMentees}</div>
              <p className="text-xs">Active Mentees</p>
            </div>
            <div className="text-center px-4 py-2 bg-white bg-opacity-10 rounded-lg overflow-hidden">
              <div className="text-2xl font-bold break-words">{dashboardData.overallStats.sessionCompletedThisMonth}</div>
              <p className="text-xs">Sessions This Month</p>
            </div>
            <div className="text-center px-4 py-2 bg-white bg-opacity-10 rounded-lg overflow-hidden">
              <div className="text-2xl font-bold break-words">{dashboardData.overallStats.averageMenteeRating}</div>
              <p className="text-xs">Avg. Rating</p>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Mentee Overview Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4 min-w-0">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center break-words min-w-0">
                <Users className="h-5 w-5 mr-2 text-teal-600" />
                Your Mentees
              </h2>
              <Link href="/dashboard/mentor/mentees" className="text-teal-600 hover:text-teal-700 text-sm font-medium break-words">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.mentees.map((mentee) => (
                <Link 
                  key={mentee.id} 
                  href={`/dashboard/mentor/mentees/${mentee.id}`}
                  className="block border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between min-w-0">
                    <div className="flex items-center min-w-0">
                      <div className="h-12 w-12 rounded-full overflow-hidden mr-4 bg-gray-200 flex-shrink-0 min-w-0">
                        {mentee.imageUrl ? (
                          <Image 
                            src={mentee.imageUrl} 
                            alt={mentee.name} 
                            width={48} 
                            height={48} 
                            className="object-cover" 
                          />
                        ) : (
                          <Users className="h-6 w-6 m-3 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 break-words">{mentee.name}</h3>
                        <p className="text-sm text-gray-500 break-words">Goal: {mentee.careerGoal}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">
                        {mentee.upcomingSession ? (
                          <span>Next session: {mentee.upcomingSession.date}</span>
                        ) : (
                          <span>No upcoming sessions</span>
                        )}
                      </div>
                      <div className="flex items-center justify-end min-w-0">
                        <span className="text-xs text-gray-500 mr-2">
                          {mentee.progressPercentage}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-teal-500 h-1.5 rounded-full" 
                            style={{ width: `${mentee.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs min-w-0">
                    <div className="flex items-center text-gray-500 min-w-0">
                      <Target className="h-3 w-3 mr-1" />
                      <span>{mentee.activeMilestones} active milestones</span>
                    </div>
                    <div className="flex items-center text-gray-500 min-w-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>{mentee.completedMilestones} completed</span>
                    </div>
                  </div>
                </Link>
              ))}
              
              <Link 
                href="/mentor/mentees/add" 
                className="block text-center py-3 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-center min-w-0">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add New Mentee</span>
                </div>
              </Link>
            </div>
          </motion.section>
          
          {/* Upcoming Sessions Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4 min-w-0">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center break-words min-w-0">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Upcoming Sessions
              </h2>
              <Link href="/mentor/calendar" className="text-purple-600 hover:text-purple-700 text-sm font-medium break-words">
                Full Calendar
              </Link>
            </div>

            {dashboardData.upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingSessions.map((session) => (
                  <div key={session.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex items-center min-w-0">
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex-shrink-0 min-w-0">
                          {session.menteeImage ? (
                            <Image 
                              src={session.menteeImage} 
                              alt={session.menteeName} 
                              width={40} 
                              height={40} 
                              className="object-cover" 
                            />
                          ) : (
                            <Users className="h-5 w-5 m-2.5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 break-words">{session.menteeName}</h3>
                          <p className="text-sm text-gray-500 break-words">{session.topic}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 break-words">{session.date}</div>
                        <div className="text-xs text-gray-500">{session.time}</div>
                      </div>
                    </div>
                    
                    {session.notes && (
                      <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded flex-shrink-0">
                        <span className="font-medium break-words">Notes:</span> {session.notes}
                      </div>
                    )}
                    
                    <div className="mt-3 flex justify-between items-center min-w-0">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.type === 'ONE_ON_ONE' ? 'bg-blue-100 text-blue-800' :
                        session.type === 'CAREER_PLANNING' ? 'bg-purple-100 text-purple-800' :
                        session.type === 'PROJECT_REVIEW' ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {session.type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex space-x-2 min-w-0">
                        <Link href={`/mentor/sessions/${session.id}/edit`} className="text-gray-500 hover:text-teal-600">
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <Link href={`/mentor/sessions/${session.id}/video`} className="text-gray-500 hover:text-purple-600">
                          <Video className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Link 
                  href="/mentor/sessions/schedule" 
                  className="block text-center py-3 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Schedule New Session
                </Link>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">No upcoming sessions scheduled.</p>
                <Link href="/mentor/sessions/schedule" className="inline-block mt-3 text-purple-600 hover:text-purple-700">
                  Schedule a Session
                </Link>
              </div>
            )}
          </motion.section>
        </div>

        {/* Right Column */}
        <div className="space-y-4 lg:space-y-6">
          {/* Stats Summary */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white rounded-xl shadow-sm p-4 text-center overflow-hidden">
              <div className="rounded-full bg-teal-100 w-10 h-10 flex items-center justify-center mx-auto mb-3 min-w-0">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 break-words">{dashboardData.overallStats.totalHoursThisMonth}</h3>
              <p className="text-xs text-gray-500 mt-1">Hours This Month</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center overflow-hidden">
              <div className="rounded-full bg-amber-100 w-10 h-10 flex items-center justify-center mx-auto mb-3 min-w-0">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 break-words">{dashboardData.overallStats.averageMenteeRating}</h3>
              <p className="text-xs text-gray-500 mt-1">Average Rating</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center overflow-hidden">
              <div className="rounded-full bg-purple-100 w-10 h-10 flex items-center justify-center mx-auto mb-3 min-w-0">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 break-words">{dashboardData.overallStats.totalMentees}</h3>
              <p className="text-xs text-gray-500 mt-1">Total Mentees</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center overflow-hidden">
              <div className="rounded-full bg-green-100 w-10 h-10 flex items-center justify-center mx-auto mb-3 min-w-0">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 break-words">{dashboardData.overallStats.menteeRetentionRate}%</h3>
              <p className="text-xs text-gray-500 mt-1">Retention Rate</p>
            </div>
          </motion.section>

          {/* Career Paths Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4 min-w-0">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center break-words min-w-0">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Career Paths
              </h2>
              <Link href="/mentor/career-paths" className="text-blue-600 hover:text-blue-700 text-sm font-medium break-words">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {dashboardData.careerPaths.map((path) => (
                <div key={path.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start min-w-0">
                    <div>
                      <h3 className="font-medium text-gray-900 break-words">{path.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{path.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {path.menteeCount} mentees
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 min-w-0">
                    <span>{path.milestoneCount} milestones</span>
                    <span>{path.averageCompletionRate}% avg. completion</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Resources Library */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4 min-w-0">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center break-words min-w-0">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Resource Library
              </h2>
              <Link href="/mentor/resources" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium break-words">
                Add Resources
              </Link>
            </div>

            <div className="space-y-3">
              {dashboardData.resources.map((resource) => (
                <a 
                  key={resource.id} 
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between min-w-0">
                    <div className="flex items-center min-w-0">
                      <div className="rounded-full bg-gray-100 w-8 h-8 flex items-center justify-center mr-3 min-w-0">
                        {resource.type === 'ARTICLE' && <FileText className="h-4 w-4 text-gray-600" />}
                        {resource.type === 'VIDEO' && <Video className="h-4 w-4 text-gray-600" />}
                        {resource.type === 'EBOOK' && <BookOpen className="h-4 w-4 text-gray-600" />}
                        {resource.type === 'TOOL' && <Wrench className="h-4 w-4 text-gray-600" />}
                        {resource.type === 'TEMPLATE' && <Copy className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm break-words">{resource.title}</h3>
                        <span className="text-xs text-gray-500">{resource.type}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {resource.shareCount} shares
                    </div>
                  </div>
                  
                  {resource.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 min-w-0">
                      {resource.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
