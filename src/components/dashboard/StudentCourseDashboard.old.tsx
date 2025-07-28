"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, addDays, format } from 'date-fns';
import { 
  Activity, AlertCircle, ArrowLeft, ArrowRight, Bookmark, 
  BookOpen, Bell, Calendar, CalendarCheck, CalendarClock, 
  CalendarDays, CalendarRange, Check, CheckCircle, CheckCircle2, 
  CircleCheck, ChevronDown, ChevronRight, Clock, ExternalLink, 
  FileCode, FileText, FileText as FileTextIcon, Flag, Folder, 
  Github, GitCommit, GitPullRequest, GraduationCap, Home, 
  LayoutDashboard, Lightbulb, ListTodo, Mail, MessageSquare, 
  MessageSquare as MessageSquareIcon, MoreHorizontal, Play, Plus, Search as SearchIcon, User as UserIcon
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  type: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  order?: number;
  progress?: number;
}

interface Resource {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'video' | 'link';
}

interface Project {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'reviewed' | 'needs-review';
  resources?: Resource[];
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  instructor: Instructor;
  startDate: string;
  endDate: string;
  modules: Module[];
  projects: Project[];
  progress: number;
  nextLesson: string;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    type: string;
  }>;
  category?: string;
  level?: string;
  thumbnail?: string;
}

interface StudentProgress {
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  completedProjects: number;
  totalProjects: number;
  nextLessonId?: string;
  streak: number;
  lastActive: string;
}

export default function StudentCourseDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [visualMode] = useState<'light' | 'grid'>('grid');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [animateTab, setAnimateTab] = useState(true);
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({
    completedModules: 0,
    totalModules: 0,
    completedLessons: 0,
    totalLessons: 0,
    completedProjects: 0,
    totalProjects: 0,
    nextLessonId: "",
    streak: 0,
    lastActive: new Date().toISOString()
  });

  const projects: Project[] = [
    {
      id: "1",
      title: "Project Milestone 1",
      description: "Implementing core functionality and connecting to APIs",
      dueDate: new Date().toISOString(),
      status: "in-progress",
      resources: [
        {
          id: "r1",
          name: "RESTful API Design",
          url: "https://restfulapi.net",
          type: "link"
        },
        {
          id: "r2",
          name: "GraphQL Introduction",
          url: "https://graphql.org/learn",
          type: "link"
        }
      ]
    },
    {
      id: "2",
      title: "Project Milestone 2",
      description: "Implementing core functionality and connecting to APIs",
      dueDate: new Date().toISOString(),
      status: "reviewed"
    },
    {
      id: "3",
      title: "API Integration",
      description: "Connect the application to backend services using RESTful or GraphQL APIs.",
      dueDate: "2023-12-31",
      status: "in-progress",
      resources: [
        {
          id: "r1",
          name: "RESTful API Design",
          url: "https://restfulapi.net",
          type: "link"
        },
        {
          id: "r2",
          name: "GraphQL Introduction",
          url: "https://graphql.org/learn",
          type: "link"
        }
      ]
    },
    {
      id: "4",
      title: "Final Project",
      description: "Completing all requirements and preparing for submission",
      dueDate: addDays(new Date(), 14).toISOString().split('T')[0],
      status: "not-started",
      resources: [
        {
          id: "r3",
          name: "Submission Guide",
          url: "#",
          type: "document"
        }
      ]
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

  interface Activity {
    id: string;
    type: string;
    user: { name: string; initial: string };
    time: Date;
    description: string;
  }

  const mockActivities: Activity[] = [
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

  // Mock user data for demonstration
  const currentUser = {
    id: "user-1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "student"
  } as const;

  // Mock course data for demonstration
  const mockCourses: Course[] = [
    {
      id: "course-1",
      title: "Modern Web Development",
      code: "WEB-101",
      description: "Learn modern web development with React and TypeScript",
      instructor: {
        id: "instr-1",
        name: "Dr. Jane Smith",
        email: "jane.smith@example.com",
        avatar: "/avatars/jane-smith.jpg"
      },
      thumbnail: "/course-thumbnail.jpg",
      progress: 68,
      startDate: "2023-01-15",
      endDate: "2023-05-30",
      nextLesson: "lesson-1",
      modules: [
        { 
          id: "module-1", 
          title: "Introduction to React", 
          description: "Learn React basics", 
          progress: 100, 
          lessons: [],
          order: 1
        },
        { 
          id: "module-2", 
          title: "State Management", 
          description: "Redux and Context API", 
          progress: 75, 
          lessons: [],
          order: 2
        },
        { 
          id: "module-3", 
          title: "API Integration", 
          description: "Fetch and Axios", 
          progress: 30, 
          lessons: [],
          order: 3
        },
        { 
          id: "module-4", 
          title: "Testing & Deployment", 
          description: "Jest and CI/CD", 
          progress: 0, 
          lessons: [],
          order: 4
        }
      ],
      projects: projects,
      upcomingDeadlines: []
    }
  ];

  const calculateStudentProgress = (): StudentProgress => {
    const defaultProgress: StudentProgress = {
      completedModules: 0,
      totalModules: 0,
      completedLessons: 0,
      totalLessons: 0,
      completedProjects: 0,
      totalProjects: 0,
      nextLessonId: "",
      streak: 0,
      lastActive: new Date().toISOString()
    };

    if (!mockCourses.length || !mockCourses[0]) return defaultProgress;
    
    const modules = mockCourses[0].modules || [];
    const projectsData = mockCourses[0].projects || [];

    const completedModules = modules.filter(m => m.progress === 100).length;
    const totalModules = modules.length;

    const lessons = modules.flatMap(m => m.lessons || []);
    const completedLessons = lessons.filter(l => l.completed).length;
    const totalLessons = lessons.length;

    const completedProjects = projectsData.filter(p => 
      p.status === 'completed' || p.status === 'reviewed'
    ).length;
    const totalProjects = projectsData.length;

    const nextLesson = modules[0]?.lessons?.[0]?.id || "";

    return {
      ...defaultProgress,
      completedModules,
      totalModules,
      completedLessons,
      totalLessons,
      completedProjects,
      totalProjects,
      nextLessonId: nextLesson
    };
  };

  useEffect(() => {
    if (!mockCourses || mockCourses.length === 0) return;

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
  const progress: StudentProgress = studentProgress || {
    completedModules: 0,
    totalModules: 1,
    completedLessons: 0,
    totalLessons: 1,
    completedProjects: 0,
    totalProjects: 1,
    nextLessonId: "",
    streak: 0,
    lastActive: new Date().toISOString()
  };

  // Calculate overall progress percentages with null checks
  const overallProgress = Math.round((progress.completedLessons / Math.max(1, progress.totalLessons)) * 100);
  const completedModulesPercent = Math.round((progress.completedModules / Math.max(1, progress.totalModules)) * 100);
  const completedProjectsPercent = Math.round((progress.completedProjects / Math.max(1, progress.totalProjects)) * 100);

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
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 hours</div>
              <div className="mt-2">
                <Progress value={50} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Average time spent per day</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="flex space-x-4 mb-4">
            <TabsTrigger value="overview" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20v-6m0 0v6m0-6h4m-4 0H8m4 0h4Z"/>
              </svg>
              Overview
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <path d="M3.27 6.96 8.3 12l-4.05 5.04.01-8.36 7.78 12z"/>
              </svg>
              Modules
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Projects
            </TabsTrigger>
            <TabsTrigger value="forums" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Forums
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-medium">
                        {Math.round((progress.completedModules / Math.max(1, progress.totalModules)) * 100)}%
                      </span>
                    </div>
                    <Progress value={(progress.completedModules / Math.max(1, progress.totalModules)) * 100} className="h-2" />
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Modules</p>
                        <p className="font-medium">
                          {progress.completedModules} of {progress.totalModules} completed
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lessons</p>
                        <p className="font-medium">
                          {progress.completedLessons} of {progress.totalLessons} completed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projects
                        .filter(project => project.dueDate && new Date(project.dueDate) > new Date())
                        .sort((a, b) => (a.dueDate && b.dueDate) ? 
                          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : 0)
                        .slice(0, 3)
                        .map((project) => (
                          <div key={project.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{project.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Due {new Date(project.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </div>
                        ))}
                      {projects.filter(project => project.dueDate && new Date(project.dueDate) > new Date()).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No upcoming deadlines
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Modules Tab Content */}
          <TabsContent value="modules" className="mt-0">
            <div className="space-y-4">
              {currentCourse?.modules?.map((module) => (
                <Card key={module.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{module.title}</CardTitle>
                      <Badge variant="outline" className="bg-white">
                        {module.progress || 0}% Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {module.lessons?.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50">
                          <div className="flex items-center space-x-3">
                            <div className={`p-1 rounded-full ${lesson.completed ? 'bg-green-100 text-green-600' : 'bg-slate-100'}`}>
                              {lesson.completed ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </div>
                            <span className={lesson.completed ? 'text-slate-500' : 'font-medium'}>
                              {lesson.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-500">{lesson.duration} min</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab Content */}
          <TabsContent value="projects" className="mt-0">
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{project.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Due {new Date(project.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {project.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-slate-600 mb-4">{project.description}</p>
                    {project.resources && project.resources.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Resources:</h4>
                        <div className="space-y-2">
                          {project.resources.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {resource.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        View Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Forums Tab Content */}
          <TabsContent value="forums" className="mt-0">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Discussions</CardTitle>
                    <Button variant="outline" size="sm">
                      New Discussion
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start space-x-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">Discussion Title {i}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              Started by User {i} • {i} day{i !== 1 ? 's' : ''} ago
                            </p>
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              This is a preview of the discussion content. Click to view the full discussion and participate.
                            </p>
                            <div className="flex items-center mt-2 space-x-4 text-sm text-slate-500">
                              <span>{i * 2} replies</span>
                              <span>•</span>
                              <span>{i * 5} views</span>
                              <span>•</span>
                              <span>Last reply {i} hour{i !== 1 ? 's' : ''} ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


