"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, addDays } from 'date-fns';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  BookOpen,
  Bell,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle,
  CheckCircle2,
  CircleCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  BarChart,
  GitCommit,
  Info,
  MessageSquare,
  Play,
  Plus,
  Download,
  Tag,
  Users,
  Video
} from 'lucide-react';

// Import UI components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Types
interface Module {
  id: string;
  title: string;
  description?: string;
  progress: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  duration: string;
  type?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  status: string;
  progress: number;
  dueDate?: Date;
  grade?: number;
  tags: string[];
  resources: {
    title: string;
    url: string;
  }[];
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  description?: string;
  progress: number;
  modules: Module[];
  projects: Project[];
  category?: string;
  thumbnail?: string;
  startDate?: Date;
  endDate?: Date;
}

interface StudentProgress {
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  completedProjects: number;
  totalProjects: number;
  nextLessonId?: string;
}

interface StudentCourseDashboardProps {
  courses?: Course[];
}

export default function StudentCourseDashboard({ courses = [] }: StudentCourseDashboardProps) {
  // Define CSS for tab animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-in-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Start with loading true
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [animateTab, setAnimateTab] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [showingFeedback, setShowingFeedback] = useState<string | null>(null);
  const [visualMode, setVisualMode] = useState<'light' | 'grid'>('grid');
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Helper function to get appropriate color for lesson type badges
  const getDueTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return 'bg-blue-100 text-blue-700';
      case 'quiz':
        return 'bg-purple-100 text-purple-700';
      case 'assignment':
        return 'bg-amber-100 text-amber-700';
      case 'reading':
        return 'bg-emerald-100 text-emerald-700';
      case 'discussion':
        return 'bg-indigo-100 text-indigo-700';
      case 'lab':
        return 'bg-cyan-100 text-cyan-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Mock data for UI demonstration
  const projects: Project[] = [
    {
      id: "1",
      title: "React UI Components",
      description: "Build a set of reusable UI components using React and Styled Components.",
      completed: true,
      status: "Completed",
      progress: 100,
      grade: 92,
      tags: ["React", "UI/UX", "Components"],
      resources: [
        {
          title: "React Documentation",
          url: "https://reactjs.org/docs",
        },
        {
          title: "Styled Components Guide",
          url: "https://styled-components.com/docs",
        },
      ],
    },
    {
      id: "2",
      title: "Project Milestone 2",
      description: "Implementing core functionality and connecting to APIs",
      completed: true,
      status: "reviewed",
      progress: 100,
      grade: 65,
      tags: ["APIs", "React"],
      resources: [
        {
          title: "API Documentation",
          url: "#",
        },
      ],
    },
    {
      id: "3",
      title: "API Integration",
      description: "Connect the application to backend services using RESTful or GraphQL APIs.",
      completed: false,
      status: "In Progress",
      progress: 65,
      grade: 0,
      tags: ["API", "Integration", "Backend"],
      resources: [
        {
          title: "RESTful API Design",
          url: "https://restfulapi.net",
        },
        {
          title: "GraphQL Introduction",
          url: "https://graphql.org/learn",
        },
      ],
    },
    {
      id: "4",
      title: "Final Project",
      description: "Completing all requirements and preparing for submission",
      completed: false,
      status: "not-started",
      progress: 28,
      grade: 28,
      dueDate: addDays(new Date(), 14),
      tags: ["Final", "Submission"],
      resources: [
        {
          title: "Submission Guide",
          url: "#",
        },
      ],
    }
  ];

  const mockCommits: any[] = [
    {
      id: 'commit-1',
      title: 'Implemented authentication flow',
      description: 'Added login, registration, and password reset functionality',
      date: addDays(new Date(), -3),
      author: 'You',
      changes: 42,
      status: 'approved'
    },
    {
      id: 'commit-2',
      title: 'Fixed responsive design issues',
      description: 'Resolved layout problems on mobile devices',
      date: addDays(new Date(), -5),
      author: 'You',
      changes: 18,
      status: 'approved'
    },
    {
      id: 'commit-3',
      title: 'Added user profile features',
      description: 'Implemented avatar upload and profile editing',
      date: addDays(new Date(), -8),
      author: 'You',
      changes: 27,
      status: 'needs-review'
    }
  ];

  const mockActivities: any[] = [
    {
      id: 'act-1',
      type: 'submission',
      user: { name: 'Sarah M.', initial: 'S' },
      time: addDays(new Date(), 0),
      description: 'Final Project Submission'
    },
    {
      id: 'act-2',
      type: 'question',
      user: { name: 'Michael T.', initial: 'M' },
      time: addDays(new Date(), -0.2),
      description: 'Question about React Hooks'
    },
    {
      id: 'act-3',
      type: 'enrollment',
      user: { name: 'Emma R.', initial: 'E' },
      time: addDays(new Date(), -1),
      description: 'New student enrolled'
    }
  ];

  // Mock course data for demonstration
  const mockCourses: Course[] = [
    {
      id: "course-1",
      title: "Modern Web Development",
      instructor: "Dr. Jane Smith",
      thumbnail: "/course-thumbnail.jpg",
      progress: 68,
      startDate: new Date("2023-01-15"),
      endDate: new Date("2023-05-30"),
      modules: [
        { id: "module-1", title: "Introduction to React", description: "Learn React basics", progress: 100, lessons: [] },
        { id: "module-2", title: "State Management", description: "Redux and Context API", progress: 75, lessons: [] },
        { id: "module-3", title: "API Integration", description: "Fetch and Axios", progress: 30, lessons: [] },
        { id: "module-4", title: "Testing & Deployment", description: "Jest and CI/CD", progress: 0, lessons: [] }
      ],
      projects: projects
    }
  ];

  // Memoize the calculation function to prevent unnecessary recalculations
  const calculateStudentProgress = useCallback((): StudentProgress => {
    try {
      // Default empty progress object
      const emptyProgress = {
        completedModules: 0,
        totalModules: 0,
        completedLessons: 0,
        totalLessons: 0,
        completedProjects: 0,
        totalProjects: 0,
        nextLessonId: ""
      };
      
      // Safety check
      if (!mockCourses || !Array.isArray(mockCourses) || mockCourses.length === 0) {
        return emptyProgress;
      }

      // Safely access modules and projects with fallbacks
      const currentCourse = mockCourses[0];
      if (!currentCourse) return emptyProgress;
      
      const modules = Array.isArray(currentCourse.modules) ? currentCourse.modules : [];
      const projectsData = Array.isArray(currentCourse.projects) ? currentCourse.projects : [];

      // Initialize counters
      let completedModules = 0;
      let totalModules = modules.length;
      let completedLessons = 0;
      let totalLessons = 0;
      let completedProjects = 0;
      let totalProjects = projectsData.length;

      // Count completed modules and lessons
      modules.forEach((m) => {
        if (!m) return;
        if (m.progress === 100) completedModules++;

        const lessons = Array.isArray(m.lessons) ? m.lessons : [];
        totalLessons += lessons.length;

        lessons.forEach((l) => {
          if (l && l.completed) completedLessons++;
        });
      });

      // Count completed projects
      projectsData.forEach((p) => {
        if (p && p.completed) completedProjects++;
      });

      return {
        completedModules,
        totalModules,
        completedLessons,
        totalLessons,
        completedProjects,
        totalProjects,
        nextLessonId: modules[0]?.lessons?.[0]?.id || "" // Safe access with optional chaining
      };
    } catch (error) {
      console.error('Error calculating student progress:', error);
      // Return empty progress on error
      return {
        completedModules: 0,
        totalModules: 0,
        completedLessons: 0,
        totalLessons: 0,
        completedProjects: 0,
        totalProjects: 0,
        nextLessonId: ""
      };
    }
  }, [mockCourses]);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = () => {
      try {
        // Set loading true at the start
        setLoading(true);
        setLoadingError(null);
        
        // Simulate API call with timeout
        setTimeout(() => {
          try {
            // Calculate progress regardless of course availability
            const progress = calculateStudentProgress();
            setStudentProgress(progress);
            setLoading(false); // Always set loading to false
          } catch (error) {
            console.error('Error in progress calculation:', error);
            setLoadingError('Failed to load course data');
            setLoading(false); // Ensure loading is turned off even on error
          }
        }, 500);
      } catch (error) {
        console.error('Error in initialization:', error);
        setLoadingError('Failed to initialize dashboard');
        setLoading(false); // Safety measure to ensure loading is always turned off
      }
    };
    
    // Call initialization function
    initializeData();
    
    // Clean-up function
    return () => {
      // Any cleanup if needed
    };
  }, []); // Empty dependency array - only run once on mount

  // Navigate to project
  const handleNavigateToProject = (courseId: string, projectId: string) => {
    router.push(`/courses/${courseId}/projects/${projectId}`);
  };

  // Navigate to commit
  const handleNavigateToCommit = (courseId: string, commitId: string) => {
    router.push(`/courses/${courseId}/commits/${commitId}`);
  };

  // Navigate to lesson
  const handleNavigateToLesson = (courseId: string, lessonId: string) => {
    router.push(`/courses/${courseId}/lessons/${lessonId}`);
  };

  // Helper function to determine color based on due date proximity
  const getDueDateColor = (dueDate?: Date) => {
    if (!dueDate) return "bg-slate-400";

    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "bg-red-500"; // Overdue
    if (diffDays < 3) return "bg-orange-500"; // Due soon
    if (diffDays < 7) return "bg-yellow-500"; // Coming up
    return "bg-emerald-500"; // Plenty of time
  };

  // Display loading state with skeleton UI for better UX
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        {/* Header skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse flex items-center space-x-4">
            <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Cards skeleton */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
                <div className="flex justify-between items-center mb-3">
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 w-4 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
          
          {/* Tabs skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-200 rounded w-24 flex-shrink-0"></div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error message if there was a problem
  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-lg font-medium text-slate-700">{loadingError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // First check for courses from props, then fallback to mockCourses
  // Add checks to ensure mockCourses is defined and an array
  const availableCourses = courses && courses.length > 0 ? courses : 
                          (mockCourses && Array.isArray(mockCourses) && mockCourses.length > 0 ? mockCourses : []);

  // If no courses are available after all checks
  if (availableCourses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
        <BookOpen className="w-16 h-16 text-blue-500 mb-4" />
        <p className="text-lg font-medium text-slate-700">No courses found</p>
        <p className="text-sm text-slate-500 mt-2">You are not enrolled in any courses yet.</p>
      </div>
    );
  }

  const currentCourse = availableCourses[0]; // For demonstration, using the first course
  const progress = studentProgress;

  // Calculate overall progress percentages
  const overallProgress = progress ? Math.round((progress.completedLessons / progress.totalLessons) * 100) : 0;
  const completedModulesPercent = progress ? Math.round((progress.completedModules / progress.totalModules) * 100) : 0;
  const completedProjectsPercent = progress ? Math.round((progress.completedProjects / progress.totalProjects) * 100) : 0;

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Course Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/courses">
                <ArrowLeft className="h-4 w-4 mr-1" /> All Courses
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold text-slate-800">{currentCourse.title}</h1>
            <Badge variant="secondary" className="ml-2">
              {currentCourse.category}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <BookOpen className="h-4 w-4 mr-1.5" /> Continue Learning
            </Button>
            <Button size="sm">
              <Bookmark className="h-4 w-4 mr-1.5" /> Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Performance Metrics */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <div className="mt-2">
                <Progress value={overallProgress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{progress?.completedLessons || 0} of {progress?.totalLessons || 0} lessons complete</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modules</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedModulesPercent}%</div>
              <div className="mt-2">
                <Progress value={completedModulesPercent} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{progress?.completedModules || 0} of {progress?.totalModules || 0} complete</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <GitCommit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedProjectsPercent}%</div>
              <div className="mt-2">
                <Progress value={completedProjectsPercent} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{progress?.completedProjects || 0} of {progress?.totalProjects || 0} complete</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12h 30m</div>
              <p className="text-xs text-muted-foreground mt-2">+2h from last week</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="flex flex-col gap-6 lg:col-span-2"> {/* Adjusted column span */}
            <Tabs defaultValue="overview" className="space-y-4" onValueChange={(value) => {
              setActiveTab(value);
              setAnimateTab(true);
            }}>
              <div className="relative overflow-auto pb-1">
                <TabsList className="bg-muted/60 p-1 flex-nowrap overflow-x-auto w-full md:flex md:justify-start">
                  <TabsTrigger value="overview" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
                    <span className="sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="modules" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <BookOpen className="h-4 w-4" /> <span className="sm:inline">Modules</span>
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <FileText className="h-4 w-4" /> <span className="sm:inline">Projects</span>
                  </TabsTrigger>
                  <TabsTrigger value="commits" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <GitCommit className="h-4 w-4" /> <span className="sm:inline">Commits</span>
                  </TabsTrigger>
                  <TabsTrigger value="marks" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
                    <Award className="h-4 w-4" /> <span className="sm:inline">Marks</span>
                    {/* New grades notification */}
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">2</span>
                  </TabsTrigger>
                  <TabsTrigger value="forum" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
                    <MessageSquare className="h-4 w-4" /> <span className="sm:inline">Forum</span>
                    {/* New messages notification */}
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">3</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className={`${activeTab === "overview" && animateTab ? "animate-fadeIn" : ""}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    {/* Course Overview Card */}
                    <Card className="border-0 shadow-md overflow-hidden">
                      <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/60 to-indigo-50/60">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xl">
                            {currentCourse.progress}%
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">{currentCourse.title}</h2>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                                <CalendarDays className="h-3 w-3 mr-1" /> Started: {currentCourse.startDate?.toLocaleDateString()}
                              </Badge>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                <CalendarCheck className="h-3 w-3 mr-1" /> Ends: {currentCourse.endDate?.toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4 px-6 space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-slate-800">Your Progress</h3>
                          <Progress value={currentCourse.progress} className="h-2.5 bg-blue-100" />
                          <span className="text-sm text-slate-500">{currentCourse.progress}% Completed</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {currentCourse.description || "No description provided for this course."}
                        </p>
                        <div className="flex justify-between items-center flex-wrap gap-3 pt-2">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Video className="h-4 w-4" />
                            Resume Lesson
                          </Button>
                          <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
                            <Download className="h-4 w-4" />
                            Download Certificate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity Card */}
                    <Card className="border-0 shadow-md overflow-hidden">
                      <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50/30">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-600" />
                            Recent Activity
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 h-5 bg-white text-green-700 border-green-200 shadow-sm">
                            Last 7 days
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                          {mockActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-slate-200 text-slate-600 text-sm font-medium">
                                  {activity.user.initial}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm text-slate-700">
                                  <span className="font-semibold">{activity.user.name}</span>{" "}
                                  <span className="text-slate-500">{activity.description}</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {formatDistanceToNow(activity.time, { addSuffix: true })}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                <span className="sr-only">View activity</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50 border-t py-3 px-6">
                        <Button variant="ghost" className="w-full text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 justify-center">
                          View All Activities <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </CardFooter>
                    </Card>

                    {/* Upcoming Deadlines Card */}
                    <Card className="border-0 shadow-md overflow-hidden">
                      <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50/30">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-purple-600" />
                            Upcoming Deadlines
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 h-5 bg-white text-purple-700 border-purple-200 shadow-sm">
                            Next 7 days
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                          {projects.filter(p => !p.completed && p.dueDate).sort((a,b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0)).map((project) => (
                            <div key={project.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
                              <span className={`h-3 w-3 rounded-full ${getDueDateColor(project.dueDate)}`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">{project.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Due: {project.dueDate ? formatDistanceToNow(project.dueDate, { addSuffix: true }) : 'N/A'}
                                </p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleNavigateToProject(currentCourse.id, project.id)}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          {projects.filter(p => !p.completed && !p.dueDate).length === projects.filter(p => !p.completed).length && (
                            <div className="px-6 py-3 text-center text-slate-500 text-sm">No upcoming deadlines found.</div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50 border-t py-3 px-6">
                        <Button variant="ghost" className="w-full text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 justify-center">
                          View All Deadlines <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>

                  {/* Right Column - Quick Links / Side Info */}
                  <div className="space-y-6">
                    {/* Course Instructor Card */}
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          Instructor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center gap-4 py-4 px-6">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl font-semibold">
                            {currentCourse.instructor.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{currentCourse.instructor}</h3>
                          <p className="text-sm text-slate-500">Course Lead</p>
                          <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-purple-600 hover:text-purple-800">
                            View Profile <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions Card */}
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Play className="h-4 w-4 text-blue-600" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2 py-4 px-6">
                        <Button variant="outline" className="justify-start gap-3">
                          <BookOpen className="h-4 w-4 text-blue-500" /> Go to next lesson
                        </Button>
                        <Button variant="outline" className="justify-start gap-3">
                          <FileText className="h-4 w-4 text-green-500" /> Check project feedback
                        </Button>
                        <Button variant="outline" className="justify-start gap-3">
                          <MessageSquare className="h-4 w-4 text-indigo-500" /> Ask a question in forum
                        </Button>
                        <Button variant="outline" className="justify-start gap-3">
                          <Bell className="h-4 w-4 text-amber-500" /> View announcements
                        </Button>
                      </CardContent>
                    </Card>
                    
                    {/* Course Information Card */}
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Info className="h-4 w-4 text-emerald-600" /> {/* Assuming 'Info' icon from lucide-react, if not, choose another */}
                          Course Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-4 px-6 text-sm text-slate-600 space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>Started: {currentCourse.startDate?.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarCheck className="h-4 w-4 text-slate-500" />
                          <span>Ends: {currentCourse.endDate?.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-500" />
                          <span>42 students enrolled</span>
                        </div>
                        {currentCourse.category && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-slate-500" /> {/* Assuming 'Tag' icon */}
                            <span>Category: {currentCourse.category}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="modules" className={`${activeTab === "modules" && animateTab ? "animate-fadeIn" : ""}`}>
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">Course Modules</h2>
                  {currentCourse.modules.length > 0 ? (
                    <div className="space-y-4">
                      {currentCourse.modules.map((moduleItem) => (
                        <Card key={moduleItem.id} className="shadow-sm">
                          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                              {moduleItem.progress === 100 ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <BookOpen className="h-5 w-5 text-blue-500" />}
                              {moduleItem.title}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedModule(expandedModule === moduleItem.id ? null : moduleItem.id)}
                            >
                              {expandedModule === moduleItem.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            </Button>
                          </CardHeader>
                          {expandedModule === moduleItem.id && (
                            <CardContent className="pt-2 pb-4 px-4 border-t">
                              {moduleItem.description && (
                                <p className="text-sm text-slate-600 mb-3">{moduleItem.description}</p>
                              )}
                              <div className="flex items-center gap-2 mb-3">
                                <Progress value={moduleItem.progress} className="h-2 flex-1" />
                                <span className="text-sm text-slate-600">{moduleItem.progress}%</span>
                              </div>
                              {moduleItem.lessons && moduleItem.lessons.length > 0 ? (
                                <ul className="space-y-2">
                                  {moduleItem.lessons.map((lesson) => (
                                    <li key={lesson.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-md">
                                      <div className="flex items-center gap-3">
                                        {lesson.completed ? (
                                          <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                          <CircleCheck className="h-5 w-5 text-slate-400" />
                                        )}
                                        <div>
                                          <p className="text-sm font-medium text-slate-700">{lesson.title}</p>
                                          <p className="text-xs text-slate-500">{lesson.duration}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {lesson.type && (
                                          <Badge className={`text-xs px-2 py-0.5 ${getDueTypeColor(lesson.type)}`}>
                                            {lesson.type}
                                          </Badge>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => handleNavigateToLesson(currentCourse.id, lesson.id)}>
                                          <Play className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-500 mt-2">No lessons available for this module.</p>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600">No modules found for this course.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="projects" className={`${activeTab === "projects" && animateTab ? "animate-fadeIn" : ""}`}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Course Projects</h2>
                    <Button variant="default" size="sm">
                      <Plus className="h-4 w-4 mr-1.5" /> {/* Assuming 'Plus' icon from lucide-react */}
                      New Project
                    </Button>
                  </div>
                  {projects.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Title</TableHead>
                          <TableHead className="w-[150px]">Status</TableHead>
                          <TableHead className="w-[120px]">Progress</TableHead>
                          <TableHead className="w-[120px]">Due Date</TableHead>
                          <TableHead className="w-[80px]">Grade</TableHead>
                          <TableHead className="text-right w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">
                              {project.title}
                              {project.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {project.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  project.status === 'Completed' || project.status === 'reviewed'
                                    ? 'bg-green-100 text-green-700'
                                    : project.status === 'In Progress'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-700'
                                }
                              >
                                {project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Progress value={project.progress} className="h-2" />
                              <span className="text-xs text-muted-foreground mt-1 block">{project.progress}%</span>
                            </TableCell>
                            <TableCell>
                              {project.dueDate ? formatDistanceToNow(project.dueDate, { addSuffix: true }) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {project.grade ? `${project.grade}%` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleNavigateToProject(currentCourse.id, project.id)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-slate-600">No projects found for this course.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="commits" className={`${activeTab === "commits" && animateTab ? "animate-fadeIn" : ""}`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Your Commits</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Most Recent
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs gap-1">
                        <GitCommit className="h-3.5 w-3.5" />
                        All Projects
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {mockCommits.length > 0 ? (
                      mockCommits.map(commit => (
                        <Card key={commit.id} className="shadow-sm">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <GitCommit className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium">{commit.title}</p>
                                <p className="text-xs text-slate-500">{commit.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                className={
                                  commit.status === 'approved'
                                    ? 'bg-green-100 text-green-700'
                                    : commit.status === 'needs-review'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-slate-100 text-slate-700'
                                }
                              >
                                {commit.status}
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => handleNavigateToCommit(currentCourse.id, commit.id)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-slate-600">No commits found.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="marks" className={`${activeTab === "marks" && animateTab ? "animate-fadeIn" : ""}`}>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Academic Progress</h2>
                  </div>

                  {/* Marks Summary Section - Top Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">4.8/5.0</div>
                        <div className="mt-2">
                          <Progress value={93} className="h-2" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">93% average score</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">95%</div>
                        <p className="text-xs text-muted-foreground">Mid-term Project</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">3/4</div>
                        <p className="text-xs text-muted-foreground">Assignments submitted</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Class Rank</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">Top 10%</div>
                        <p className="text-xs text-muted-foreground">Among 120 students</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Assessment Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Assessment Scores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Module 1 Quiz</p>
                                <p className="text-xs text-muted-foreground">Completed 2 weeks ago</p>
                              </div>
                              <div className="font-medium text-sm">85/100</div>
                            </div>
                            <Progress value={85} className="h-1.5" />
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Module 2 Assignment</p>
                                <p className="text-xs text-muted-foreground">Completed 1 week ago</p>
                              </div>
                              <div className="font-medium text-sm">92/100</div>
                            </div>
                            <Progress value={92} className="h-1.5" />
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Mid-term Project</p>
                                <p className="text-xs text-muted-foreground">Completed 3 days ago</p>
                              </div>
                              <div className="font-medium text-sm">95/100</div>
                            </div>
                            <Progress value={95} className="h-1.5" />
                          </div>
                        </div>
                        
                        <div className="flex items-center opacity-50">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Final Exam</p>
                                <p className="text-xs text-muted-foreground">Not yet available</p>
                              </div>
                              <div className="font-medium text-sm">--/100</div>
                            </div>
                            <Progress value={0} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Feedback Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Instructor Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">Mid-term Project</div>
                              <p className="text-sm mt-1">
                                Excellent work on your project! Your implementation of React hooks showed a deep understanding of the concepts. Consider adding more unit tests in future assignments.
                              </p>
                              <div className="flex items-center mt-2 gap-2">
                                <Badge variant="secondary" className="text-xs font-normal">Outstanding</Badge>
                                <span className="text-xs text-muted-foreground">3 days ago</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="forum" className={`${activeTab === "forum" && animateTab ? "animate-fadeIn" : ""}`}>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Course Forum</h2>
                    <Button size="sm" variant="default" className="h-8 px-3 gap-1 bg-primary hover:bg-primary/90">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      New Topic
                    </Button>
                  </div>

                  {/* Featured Forum */}
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-blue-500"></div>
                    <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50/60 to-blue-50/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-0 rounded-full px-3 py-1 font-medium text-xs uppercase tracking-wide shadow-sm">
                            Featured
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full px-2 py-0.5 text-xs">
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"></path><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
                              Pinned
                            </span>
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                          <span className="sr-only">Menu</span>
                        </Button>
                      </div>
                      <CardTitle className="mt-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent group-hover:from-indigo-800 group-hover:to-blue-800 transition-all duration-300">Understanding React Hooks in Depth</span>
                      </CardTitle>
                      {/* Changed from CardDescription to div to avoid nesting divs inside p elements */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                            <AvatarFallback className="text-xs bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium">
                              JD
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">Started by <span className="font-medium text-indigo-700">Prof. Jane Doe</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded-full shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>Posted 2 days ago</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-4">
                      <p className="text-slate-700 mb-4 leading-relaxed">
                        In this thread, we're discussing the fundamental concepts behind React Hooks. I'd like everyone to share their experiences with useEffect, useState, and any custom hooks you've built. What challenges have you faced?...
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border-0 rounded-full px-3">
                          #react
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-0 rounded-full px-3">
                          #hooks
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border-0 rounded-full px-3">
                          #frontend
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                          <MessageSquare className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium">23</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                          <span className="font-medium">15</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                          <span className="font-medium">3h ago</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t flex justify-between">
                      <Button variant="ghost" size="sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                        Like
                      </Button>
                      <Button variant="ghost" size="sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        Bookmark
                      </Button>
                    </CardFooter>
                  </Card>
                  {/* Recent Forums List */}
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">Recent Forums</h3>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                        Latest First
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {[
                        { title: "Best practices for API error handling", replies: 8, lastReply: "2h ago", author: "Alex S.", tags: ["api", "error-handling"] },
                        { title: "Demystifying CSS Grid vs Flexbox for Layouts", replies: 12, lastReply: "1d ago", author: "Maria K.", tags: ["css", "layout"] },
                        { title: "Understanding Asynchronous JavaScript (Promises & Async/Await)", replies: 5, lastReply: "4h ago", author: "John D.", tags: ["javascript", "async"] }
                      ].map((forum, index) => (
                        <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="py-4 px-5">
                            <h4 className="font-semibold text-slate-800 mb-1">{forum.title}</h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {forum.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">{`#${tag}`}</Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-500">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>{forum.replies} replies</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-slate-200 text-slate-600">{forum.author[0]}</AvatarFallback>
                                </Avatar>
                                <span>{forum.author}</span>
                              </div>
                              <span>Last reply: {forum.lastReply}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}