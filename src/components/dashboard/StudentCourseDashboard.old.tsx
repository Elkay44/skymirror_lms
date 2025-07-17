"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, addDays } from 'date-fns';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
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
  MessageSquare,
  Play,
  Download,
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
  const [loading, setLoading] = useState(false);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [animateTab, setAnimateTab] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [showingFeedback, setShowingFeedback] = useState<string | null>(null);
  const [visualMode, setVisualMode] = useState<'light' | 'grid'>('grid');

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

  const calculateStudentProgress = (): StudentProgress => {
    if (!mockCourses.length) return {
      completedModules: 0,
      totalModules: 0,
      completedLessons: 0,
      totalLessons: 0,
      completedProjects: 0,
      totalProjects: 0,
      nextLessonId: ""
    };
    
    const modules = mockCourses[0].modules || [];
    const projectsData = mockCourses[0].projects || [];

    let completedModules = 0;
    let totalModules = modules.length;
    let completedLessons = 0;
    let totalLessons = 0;
    let completedProjects = 0;
    let totalProjects = projects.length;

    modules.forEach((m: Module) => {
      if (m.progress === 100) completedModules++;

      const lessons = m.lessons || [];
      totalLessons += lessons.length;

      lessons.forEach((l: Lesson) => {
        if (l.completed) completedLessons++;
      });
    });

    projectsData.forEach((p: Project) => {
      if (p.completed) completedProjects++;
    });

    return {
      completedModules,
      totalModules,
      completedLessons,
      totalLessons,
      completedProjects,
      totalProjects,
      nextLessonId: modules[0]?.lessons[0]?.id // Just for demonstration
    };
  };

  useEffect(() => {
    if (!courses || courses.length === 0) return;

    setLoading(true);

    // Simulate API call to fetch student progress
    setTimeout(() => {
      const progress = calculateStudentProgress();

      setStudentProgress(progress);
      setLoading(false);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (loading) {
    return <p>Loading courses...</p>;
  }

  if (!mockCourses || mockCourses.length === 0) {
    return <p>No courses found</p>;
  }

  const currentCourse = mockCourses[0]; // For demonstration, using the first course
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
          <div className="flex flex-col gap-6 px-2 py-4">
            <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => {
              setAnimateTab(false);
              setTimeout(() => {
                setActiveTab(value);
                setAnimateTab(true);
              }, 50);
            }}>
              <TabsList className="bg-white shadow-sm border p-1 mb-8 justify-start overflow-x-auto w-full gap-2">
                <TabsTrigger value="overview" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
                  Overview
                </TabsTrigger>
                <TabsTrigger value="modules" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
{{ ... }}
                          42 students
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xl">
                    {currentCourse.progress}%
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">{currentCourse.title}</h2>
                    <div className="flex flex-wrap gap-2 mt-1">ress}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-indigo-900">Your Progress</h4>
{{ ... }}
                          </div>
                          <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
                            <Download className="h-4 w-4" />
                            Download Certificate
                          </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-md overflow-hidden">
                      <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50/30">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <GitCommit className="h-4 w-4 text-green-600" />
                            Recent Activity
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 h-5 bg-white text-green-700 border-green-200 shadow-sm">
                            Last 7 days
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800">{Math.round(100 - currentCourse.progress)}% Remaining</h3>
                              <p className="text-sm text-slate-600">Complete these requirements to earn your certificate</p>
                            </div>
                            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-amber-100 text-amber-700 font-bold text-sm border-4 border-amber-50">
{{ ... }}
                            <h4 className="font-medium text-blue-800">Advanced Topics Q&A</h4>
                            <Badge variant="outline" className="bg-blue-100/80 border-blue-200 text-blue-700 text-xs font-normal">
                              In 2 days
                            </Badge>
                          </div>
                          <CardContent className="p-4 space-y-6">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <CalendarRange className="h-4 w-4" />
                          <span>Feb 28, 2023 - 10:30 AM</span>
                        </div>
                            <div className="flex items-center gap-1.5 text-blue-700 text-sm">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <p>With {currentCourse.instructor}</p>
                            </div>
                          </div>
{{ ... }}
                                <GitCommit className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{project.title}</p>
                              <p className="text-xs text-slate-500">
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
                  
                  <div className="space-y-4">0 shadow-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-purple-600" /> 
                        Recent Activity
                      </CardTitle>
{{ ... }}
                          <Button size="sm" variant="default" className="h-8 px-3 gap-1 bg-primary hover:bg-primary/90">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            New Topic
                          </Button>
                        </div>
                      <TabsContent value="overview" className={`${activeTab === "overview" && animateTab ? "animate-fadeIn" : ""}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                      {/* Featured Forum */}
                      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-blue-500"></div>
                        <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50/60 to-blue-50/60">
                          <div className="flex items-center justify-between">
{{ ... }}
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
                          <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
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
                          </CardDescription>
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
                        
                        {[
                          { title: "Best practices for API error handling", replies: 8, likes: 12, author: "Alex K", time: "1 day ago", unread: true, tags: ["APIs", "Error Handling"] },
                          { title: "Help needed with async component patterns", replies: 15, likes: 7, author: "Morgan T", time: "3 days ago", unread: false, tags: ["Async", "Components"] },
                          { title: "Sharing my journey learning TypeScript", replies: 24, likes: 32, author: "Jamie L", time: "5 days ago", unread: false, tags: ["TypeScript", "Learning"] }
                        ].map((forum, i) => (
                          <Card key={i} className={`border-0 ${forum.unread ? 'border-l-4 border-l-blue-500' : ''} shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group`}>
                            {!forum.unread && <div className="h-1 w-full bg-gradient-to-r from-slate-200 to-slate-300"></div>}
                            {forum.unread && <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>}
                            <CardHeader className="py-3 pb-2">
                              <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-base font-semibold group-hover:text-indigo-700 transition-colors duration-300">{forum.title}</CardTitle>
                                {forum.unread && 
                                  <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-indigo-500 border-0 shadow-sm text-xs rounded-full px-2 py-0">
                                    New
                                  </Badge>
                                }
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {forum.tags.map((tag, j) => (
                                  <Badge key={j} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border-0 rounded-full px-2 py-0 text-xs">
                                    #{tag.toLowerCase().replace(' ', '')}
                                  </Badge>
                                ))}
                              </div>
                              <CardDescription className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 ring-1 ring-slate-200">
                                    <AvatarFallback className="text-xs bg-gradient-to-r from-slate-500 to-slate-600 text-white font-medium">
                                      {forum.author.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">{forum.author}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  <span>{forum.time}</span>
                                </div>
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="py-2 flex justify-between items-center border-t text-xs text-slate-600 bg-gradient-to-r from-slate-50 to-white">
                              <div className="flex gap-3">
                                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                                  <MessageSquare className="h-3.5 w-3.5 text-indigo-500" /> 
                                  <span className="font-medium">{forum.replies}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                                  <span className="font-medium">{forum.likes}</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 text-xs hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-200 gap-1">
                                View Thread
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                        <div className="flex justify-center mt-8">
                          <Button className="gap-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 text-white shadow-md hover:shadow-lg rounded-md px-6">
                            View All Forums
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
// ... (rest of the code remains the same)
                    <div className="space-y-5">
                      {/* Search */}
                      <Card className="shadow-md border-0 overflow-hidden">
                        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50">
                          <CardTitle className="text-base flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-indigo-600"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                            Search Forums
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <div className="relative">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 text-slate-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                              <input 
                                type="text" 
                                placeholder="Search forums..." 
                                className="w-full rounded-md border border-slate-200 bg-white px-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                              />
                            </div>
                            
                            <div>
                              <p className="text-xs text-slate-500 font-medium mb-2">POPULAR SEARCHES</p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 hover:from-indigo-100 hover:to-blue-100 transition-colors border-0 rounded-full px-3 py-1 cursor-pointer">
                                  #react
                                </Badge>
                                <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-colors border-0 rounded-full px-3 py-1 cursor-pointer">
                                  #typescript
                                </Badge>
                                <Badge variant="secondary" className="bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 hover:from-sky-100 hover:to-blue-100 transition-colors border-0 rounded-full px-3 py-1 cursor-pointer">
                                  #apis
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Popular Tags */}
                      <Card className="shadow-md border-0 overflow-hidden">
                        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <CardTitle className="text-base flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                            Popular Tags
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { name: "React", count: 45, color: "from-blue-50 to-indigo-50 text-blue-700" },
                              { name: "TypeScript", count: 32, color: "from-indigo-50 to-purple-50 text-indigo-700" },
                              { name: "APIs", count: 28, color: "from-emerald-50 to-teal-50 text-emerald-700" },
                              { name: "State", count: 24, color: "from-amber-50 to-orange-50 text-amber-700" },
                              { name: "Performance", count: 18, color: "from-rose-50 to-red-50 text-rose-700" },
                              { name: "CSS", count: 15, color: "from-sky-50 to-blue-50 text-sky-700" },
                              { name: "Testing", count: 12, color: "from-violet-50 to-purple-50 text-violet-700" },
                              { name: "NextJS", count: 9, color: "from-slate-50 to-gray-50 text-slate-700" },
                            ].map((tag, i) => (
                              <Button 
                                key={i} 
                                variant="outline" 
                                size="sm" 
                                className={`h-8 text-xs flex items-center gap-1 border-0 bg-gradient-to-r ${tag.color} hover:opacity-90 transition-all shadow-sm justify-between px-3 w-full`}
                              >
                                <span className="truncate">{tag.name}</span>
                                <Badge variant="secondary" className="bg-white/60 backdrop-blur-sm text-[10px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-sm">{tag.count}</Badge>
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Top Contributors */}
                      <Card className="shadow-md border-0 overflow-hidden">
                        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-indigo-50">
                          <CardTitle className="text-base flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-purple-600"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                            Top Contributors
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {[
                              { name: "Jane Doe", role: "Instructor", posts: 45, avatar: "JD", color: "bg-indigo-500" },
                              { name: "Alex Kim", role: "Teaching Assistant", posts: 38, avatar: "AK", color: "bg-emerald-500" },
                              { name: "Taylor Wong", role: "Student", posts: 27, avatar: "TW", color: "bg-amber-500" },
                            ].map((contributor, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <Avatar className="h-10 w-10 shadow-sm border-2 border-white">
                                  <AvatarFallback className={`text-xs font-medium text-white ${contributor.color}`}>
                                    {contributor.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{contributor.name}</div>
                                  <div className="text-xs text-slate-500">{contributor.role}</div>
                                </div>
                                <Badge variant="outline" className="bg-white shadow-sm text-xs font-medium px-2">
                                  {contributor.posts} <span className="text-slate-500 ml-1">posts</span>
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Commits Tab Content */}
              <TabsContent 
                value="commits" 
                className={`pt-6 ${animateTab && activeTab === 'commits' ? 'animate-fadeIn' : ''}`}
              >
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">Project Commits</h2>
                        <p className="text-slate-600 mt-1">Track your code submissions and project progress</p>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <Button size="sm" variant="outline" className="h-8 px-3 text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                          My Commits
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-3 text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                          All Commits
                        </Button>
                        <Button size="sm" variant="default" className="h-8 px-3 gap-1 bg-green-600 hover:bg-green-700">
                          <GitCommit className="h-3.5 w-3.5" />
                          New Commit
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Commits List */}
                    <Card className="border-0 shadow-md overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-green-50/30 pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium flex items-center gap-1.5">
                            <GitCommit className="h-4 w-4 text-green-600" />
                            Recent Commits
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-white rounded-md border border-slate-200 px-2 py-1">
                              <select className="text-xs bg-transparent border-none focus:outline-none focus:ring-0">
                                <option>All Projects</option>
                                <option>Project 1</option>
                                <option>Project 2</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                          {[
                            {
                              hash: "a1b2c3d",
                              message: "Add responsive navigation drawer for mobile views",
                              project: "UI Project",
                              branch: "main",
                              date: "2 hours ago",
                              author: "You",
                              status: "success"
                            },
                            {
                              hash: "e5f6g7h",
                              message: "Fix styling issues in dashboard cards and improve accessibility",
                              project: "UI Project",
                              branch: "main",
                              date: "1 day ago",
                              author: "You",
                              status: "success"
                            },
                            {
                              hash: "i9j0k1l",
                              message: "Implement data fetching hooks and state management",
                              project: "API Integration",
                              branch: "feature/api",
                              date: "2 days ago",
                              author: "You",
                              status: "success"
                            },
                            {
                              hash: "m2n3o4p",
                              message: "Add unit tests for component rendering",
                              project: "Testing",
                              branch: "test/components",
                              date: "4 days ago",
                              author: "You",
                              status: "failed"
                            },
                          ].map((commit, i) => (
                            <div key={i} className="p-4 hover:bg-slate-50/80 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 p-1.5 rounded-full ${commit.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {commit.status === 'success' ? 
                                    <CheckCircle className="h-3.5 w-3.5" /> : 
                                    <AlertCircle className="h-3.5 w-3.5" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{commit.hash}</code>
                                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">{commit.branch}</Badge>
                                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">{commit.project}</Badge>
                                    </div>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {commit.date}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium mt-1">{commit.message}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-slate-500">Committed by {commit.author}</span>
                                    <div className="flex gap-2">
                                      <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-green-50 hover:text-green-700">
                                        <GitCommit className="h-3 w-3 mr-1" /> View
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 text-xs hover:bg-slate-100 hover:text-slate-700">
                                        <MessageSquare className="h-3 w-3 mr-1" /> Comment
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center py-4 bg-slate-50 border-t border-slate-100">
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <GitCommit className="h-3.5 w-3.5" />
                            View All Commits
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
