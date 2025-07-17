"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, ArrowUpRight, Activity, AlertCircle,
  Award, BarChart, BarChart2, Bell, Book, Bookmark, BookOpen, Calendar, 
  CheckCircle, CheckSquare, ChevronDown, ChevronRight, Clock, ClipboardCheck,
  Code, Download, Edit2, ExternalLink, FileCheck, FileCode, FileEdit, FileText,
  GitBranch, GitCommit, Github, GraduationCap, HelpCircle, Layers, LineChart,
  Lock, MessageCircle, MessageSquare, PieChart, Play, Share, Star,
  Target, Timer, User, Users, UserPlus, Video, Zap
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format, formatDistance, formatDistanceToNow, addDays } from 'date-fns';

// Import UI components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Types
interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  completed: boolean;
  order: number;
  videoUrl?: string;
  content?: string;
  type?: 'video' | 'text' | 'quiz' | 'assignment';
  isPreview?: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  progress?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnailUrl?: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  modules: Module[];
  createdAt: string | Date;
  updatedAt: string | Date;
  rating?: number;
  studentCount?: number;
  progress?: number;
}

interface Commit {
  id: string;
  title: string;
  description?: string;
  date: Date | string;
  author: string;
  changes: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs-review';
}

interface Project {
  id: string;
  title: string;
  description: string;
  dueDate?: Date | string;
  completed: boolean;
  grade?: number;
  feedback?: string;
  status?: 'not-started' | 'in-progress' | 'submitted' | 'reviewed';
  collaborators?: string[];
  tags?: string[];
  resources?: {title: string, url: string}[];
}

interface Grade {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  date: Date | string;
  type: 'quiz' | 'assignment' | 'project' | 'exam';
}

interface Activity {
  id: string;
  type: 'submission' | 'question' | 'enrollment' | 'comment';
  user: {
    name: string;
    initial: string;
  };
  time: Date | string;
  description: string;
}

interface StudentProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
  timeSpent: number;
  lastAccessDate: Date | string;
  streak: number;
  activityScore: number;
  nextLessonId?: string;
  grades?: Grade[];
  projects?: Project[];
  commits?: Commit[];
}

interface StudentCourseDashboardProps {
  courses: Course[];
}

export default function StudentCourseDashboard({ courses = [] }: StudentCourseDashboardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [studentProgress, setStudentProgress] = useState<Record<string, StudentProgress>>({});
  const [activeTab, setActiveTab] = useState("overview");

  // Format mock data for UI demonstration
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      title: 'Project Milestone 1',
      description: 'Setting up the development environment and creating the basic structure',
      completed: true,
      status: 'reviewed',
      grade: 82,
      tags: ['React', 'Setup'],
      resources: [{ title: 'Project Brief', url: '#' }]
    },
    {
      id: 'proj-2',
      title: 'Project Milestone 2',
      description: 'Implementing core functionality and connecting to APIs',
      completed: true,
      status: 'reviewed',
      grade: 65,
      tags: ['APIs', 'React'],
      resources: [{ title: 'API Documentation', url: '#' }]
    },
    {
      id: 'proj-3',
      title: 'Project Milestone 3',
      description: 'Adding advanced features and performance optimization',
      completed: false,
      status: 'in-progress',
      grade: 42,
      tags: ['Performance', 'Features'],
      resources: [{ title: 'Requirements', url: '#' }]
    },
    {
      id: 'proj-4',
      title: 'Final Project',
      description: 'Completing all requirements and preparing for submission',
      completed: false,
      status: 'not-started',
      grade: 28,
      dueDate: addDays(new Date(), 14),
      tags: ['Final', 'Submission'],
      resources: [{ title: 'Submission Guide', url: '#' }]
    }
  ];

  const mockCommits: Commit[] = [
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

  const calculateCourseProgress = (course: Course): StudentProgress => {
    // Count all lessons
    const totalLessons = course.modules.reduce(
      (total, module) => total + module.lessons.length,
      0
    );

    // Count completed lessons and calculate time spent
    let completedLessons = 0;
    let timeSpent = 0;

    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        if (lesson.completed) {
          completedLessons++;
          timeSpent += lesson.duration;
        }
      });
    });

    const completionPercentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    const lastAccessDate = new Date();
    const streak = 5; // Mock data
    const activityScore = 87; // Mock data

    // Find the next lesson that is not completed
    let nextLessonId;
    moduleLoop: for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.completed) {
          nextLessonId = lesson.id;
          break moduleLoop;
        }
      }
    }

    // Mock grades data
    const grades: Grade[] = [
      { id: 'g1', title: 'Quiz 1', score: 85, maxScore: 100, date: addDays(new Date(), -10), type: 'quiz' },
      { id: 'g2', title: 'Assignment 1', score: 92, maxScore: 100, date: addDays(new Date(), -15), type: 'assignment' },
      { id: 'g3', title: 'Midterm Project', score: 88, maxScore: 100, date: addDays(new Date(), -20), type: 'project' }
    ];

    return {
      courseId: course.id,
      completedLessons,
      totalLessons,
      completionPercentage,
      timeSpent,
      lastAccessDate,
      streak,
      activityScore,
      nextLessonId,
      grades,
      projects: mockProjects,
      commits: mockCommits
    };
  };

  useEffect(() => {
    if (!courses || courses.length === 0) return;
    
    setLoading(true);
    
    // Simulate API call to fetch student progress
    setTimeout(() => {
      const progress = courses.reduce((acc, course) => {
        acc[course.id] = calculateCourseProgress(course);
        return acc;
      }, {} as Record<string, StudentProgress>);
      
      setStudentProgress(progress);
      setLoading(false);
    }, 500);
  }, [courses]);

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

  if (loading) {
    return <p>Loading courses...</p>;
  }

  if (!courses || courses.length === 0) {
    return <p>No courses found</p>;
  }

  const currentCourse = courses[0]; // For demonstration, using the first course
  const progress = studentProgress[currentCourse.id];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Course Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-100 text-blue-700 rounded-md px-2.5 py-1 font-medium">
                  {currentCourse.level.charAt(0).toUpperCase() + currentCourse.level.slice(1)}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 rounded-md px-2.5 py-1 font-medium">
                  Updated {format(new Date(currentCourse.updatedAt), 'dd/MM/yyyy')}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentCourse.title}
              </h1>
              <p className="mt-2 text-lg text-slate-600 max-w-3xl">
                {currentCourse.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-3">
                <Button variant="outline" className="border-blue-200 hover:bg-blue-50 font-medium text-blue-700">
                  <Bookmark className="mr-1.5 h-4 w-4" /> Save for Later
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  Continue Learning <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
              {progress && progress.completionPercentage > 0 && (
                <div className="text-emerald-600 text-sm font-medium flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" /> {progress.completionPercentage}% Complete
                </div>
              )}
            </div>
          </div>
          
          {/* Course Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-8 bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="text-3xl font-bold text-blue-600">{progress?.totalLessons || 0}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Lessons</div>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="text-3xl font-bold text-indigo-600">{currentCourse.modules.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Modules</div>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="text-3xl font-bold text-purple-600">{mockProjects.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Projects</div>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="text-3xl font-bold text-amber-600">4.8</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Marks</div>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="text-3xl font-bold text-green-600">{mockCommits.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Code Commits</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="projects" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Projects
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Activity
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4 space-y-6">
                {/* Course Completion */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center justify-between">
                      Course Completion
                      <span className="text-sm font-medium text-blue-600">{progress?.completionPercentage || 0}%</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {currentCourse.modules.map((module, index) => (
                        <div key={module.id} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium flex-1">{module.title}</h3>
                            <span className="text-xs text-slate-500">
                              {module.lessons.length} lessons • {formatDistance(0, module.lessons.reduce((acc, lesson) => acc + lesson.duration, 0) * 1000)}
                            </span>
                            <Badge className={index < 3 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}>
                              {index < 3 ? "Completed" : "Continue"}
                            </Badge>
                          </div>
                          
                          <Progress 
                            value={index < 3 ? 100 : (index === 3 ? 60 : 0)} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Project Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center justify-between">
                      Project Progress
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        View All Milestones
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockProjects.map(project => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{project.title}</h3>
                            <span className="text-sm font-medium">
                              {project.grade || 0}%
                            </span>
                          </div>
                          <Progress 
                            value={project.grade || 0} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="projects" className="pt-4 space-y-6">
                {/* Projects List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Projects</CardTitle>
                    <CardDescription>View and manage your course projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockProjects.map(project => (
                        <Card key={project.id} className="border shadow-sm overflow-hidden">
                          <div className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge className={
                                  project.status === 'reviewed' ? "bg-emerald-100 text-emerald-700" :
                                  project.status === 'submitted' ? "bg-blue-100 text-blue-700" :
                                  project.status === 'in-progress' ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-700"
                                }>
                                  {project.status?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </Badge>
                                
                                {project.dueDate && (
                                  <span className="text-xs text-slate-500">
                                    Due {format(new Date(project.dueDate), 'MMM dd, yyyy')}
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="font-semibold">{project.title}</h3>
                              <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                              
                              {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {project.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs font-normal">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 min-w-[120px]">
                              <div className="text-center mb-1">
                                {project.grade ? (
                                  <>
                                    <div className="text-2xl font-bold text-blue-600">{project.grade}%</div>
                                    <div className="text-xs text-slate-500">Grade</div>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="w-full">Not Graded</Badge>
                                )}
                              </div>
                              
                              <Button 
                                onClick={() => handleNavigateToProject(currentCourse.id, project.id)}
                                className="w-full"
                              >
                                View Project
                              </Button>
                              
                              {project.resources && project.resources.length > 0 && (
                                <Button variant="outline" className="w-full">
                                  <FileText className="h-4 w-4 mr-1" /> Resources
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="pt-4 space-y-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from your course</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={
                              activity.type === 'submission' ? "bg-blue-100 text-blue-700" :
                              activity.type === 'question' ? "bg-amber-100 text-amber-700" :
                              "bg-emerald-100 text-emerald-700"
                            }>
                              {activity.user.initial}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="font-medium">{activity.description}</div>
                            <div className="text-sm text-slate-500">
                              {activity.user.name} • {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Continue Learning Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-slate-50">
              <CardHeader>
                <CardTitle className="text-lg">Continue Learning</CardTitle>
              </CardHeader>
              <CardContent>
                {progress?.nextLessonId ? (
                  <div>
                    <div className="mb-3">
                      <Badge className="bg-blue-100 text-blue-700">
                        Next Lesson
                      </Badge>
                    </div>
                    
                    <h4 className="font-semibold mb-2">
                      {currentCourse.modules
                        .flatMap(m => m.lessons)
                        .find(l => l.id === progress.nextLessonId)?.title || "Continue your course"}
                    </h4>
                    
                    <Button 
                      onClick={() => handleNavigateToLesson(
                        currentCourse.id, 
                        progress.nextLessonId || ''
                      )}
                      className="w-full mt-2"
                    >
                      <Play className="h-4 w-4 mr-1.5" /> Continue
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                    <h4 className="font-semibold">All Caught Up!</h4>
                    <p className="text-sm text-slate-600 mt-1 mb-4">
                      You've completed all lessons in this course.
                    </p>
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-1.5" /> Browse Courses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Course Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Students</span>
                    <span className="font-medium">1248</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Active Students</span>
                    <span className="font-medium">842</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Project Completion</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Avg. Project Score</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mentor Sessions</span>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Code Commits</span>
                    <span className="font-medium">{mockCommits.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" /> Ask a Question
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" /> View Resources
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart className="h-4 w-4 mr-2" /> View Progress Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
