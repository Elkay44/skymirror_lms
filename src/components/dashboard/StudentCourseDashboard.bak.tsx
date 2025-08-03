"use client";

import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, ArrowUpRight,
  BarChart2, CheckCircle, Clock, ExternalLink,
  BookOpen, Bookmark, GitCommit, GitBranch, Award, Play, Target,
  Calendar, FileEdit, FileText, Download, CheckSquare, Zap,
  GraduationCap, Layers
} from 'lucide-react';
import { useState, useEffect } from 'react';
// Import UI components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";



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
  type: 'quiz' | 'assignment' | 'project' | 'exam';
  date: Date;
}

interface StudentProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  lastAccessed: Date;
  projects: Project[];
  commits: Commit[];
  grades: Grade[];
  completionPercentage: number;
  nextLesson?: {
    moduleId: string;
    lessonId: string;
    title: string;
    type?: 'video' | 'text' | 'quiz' | 'assignment';
    description?: string;
  };
  streak?: number;
  timeSpent?: number; // in minutes
  certificateEligible?: boolean;
  lastCommit?: Date | string;
  activityScore?: number;
}

interface StudentCourseDashboardProps {
  courses: Course[];
}

// Helper functions
const getLevelColor = (level: string) => {
  switch(level.toLowerCase()) {
    case 'beginner': return 'bg-green-100 text-green-800';
    case 'intermediate': return 'bg-blue-100 text-blue-800';
    case 'advanced': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getLevelIcon = (level: string) => {
  switch(level.toLowerCase()) {
    case 'beginner': return <BookOpen className="h-4 w-4" />;
    case 'intermediate': return <Award className="h-4 w-4" />;
    case 'advanced': return <GraduationCap className="h-4 w-4" />;
    default: return <Target className="h-4 w-4" />;
  }
};

// Get status color for projects and commits
const getStatusColor = (status: string) => {
  switch(status) {
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'needs-review': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'submitted': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'reviewed': return 'bg-green-100 text-green-800 border-green-200';
    case 'not-started': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// CSS for grid background
const gridBgStyle = `
  .bg-grid-slate-100 {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%23e2e8f0'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
  }
`;

export default function StudentCourseDashboard({ courses = [] }: StudentCourseDashboardProps) {
  const router = useRouter();
  
  // Calculate course progress
  const calculateCourseProgress = (course: Course): StudentProgress => {
    const totalLessons = course.modules.reduce(
      (total, module) => total + (module.lessons?.length || 0),
      0
    );
    
    const completedLessons = course.modules.reduce(
      (total, module) => total + (module.lessons?.filter(l => l.completed).length || 0),
      0
    );
    
    const completionPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Find next uncompleted lesson
    let nextLesson = undefined;
    for (const module of course.modules) {
      const uncompleted = module.lessons?.find(lesson => !lesson.completed);
      if (uncompleted) {
        nextLesson = {
          moduleId: module.id,
          lessonId: uncompleted.id,
          title: uncompleted.title,
          type: uncompleted.type,
          description: uncompleted.description
        };
        break;
      }
    }
    
    // Mock data for projects
    const mockProjects: Project[] = [
      {
        id: 'project-1',
        title: 'Portfolio Website',
        description: 'Build a responsive portfolio website showcasing your skills and projects',
        dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        completed: false,
        status: 'in-progress',
        tags: ['frontend', 'responsive', 'portfolio'],
        resources: [{ title: 'Design Template', url: '#' }]
      },
      {
        id: 'project-2',
        title: 'E-commerce API',
        description: 'Create a RESTful API for an e-commerce platform with authentication',
        dueDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        completed: false,
        status: 'not-started',
        tags: ['backend', 'api', 'e-commerce'],
        resources: [{ title: 'API Specification', url: '#' }]
      },
      {
        id: 'project-3',
        title: 'Database Design',
        description: 'Design and implement a relational database schema for the learning platform',
        dueDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completed: true,
        grade: 92,
        feedback: 'Excellent work on normalization and indexing. Consider adding more documentation.',
        status: 'reviewed',
        tags: ['database', 'sql', 'schema']
      }
    ];
    
    // Mock data for commits
    const mockCommits: Commit[] = [
      {
        id: 'commit-1',
        title: 'Initial project setup',
        description: 'Set up project structure and dependencies',
        date: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        author: 'Student',
        changes: 24,
        status: 'approved'
      },
      {
        id: 'commit-2',
        title: 'Add authentication features',
        description: 'Implemented login, registration and password reset',
        date: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        author: 'Student',
        changes: 47,
        status: 'needs-review'
      },
      {
        id: 'commit-3',
        title: 'Fix responsive layout issues',
        description: 'Fixed mobile layout bugs in navigation and product cards',
        date: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        author: 'Student',
        changes: 12,
        status: 'pending'
      }
    ];
    
    // Calculate grades (mock data)
    const mockGrades: Grade[] = [
      {
        id: 'grade-1',
        title: 'Module 1 Quiz',
        score: 85,
        maxScore: 100,
        type: 'quiz',
        date: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      },
      {
        id: 'grade-2',
        title: 'Module 2 Assignment',
        score: 92,
        maxScore: 100,
        type: 'assignment',
        date: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    ];

    // Extra stats
    const streak = 7; // days
    const timeSpent = totalLessons * 15; // rough estimate in minutes
    const certificateEligible = completionPercentage >= 80;
    const lastCommit = mockCommits.length > 0 ? mockCommits[mockCommits.length - 1].date : undefined;
    const activityScore = 85; // out of 100
    
    return {
      courseId: course.id,
      completedLessons,
      totalLessons,
      lastAccessed: new Date(),
      projects: mockProjects,
      commits: mockCommits,
      grades: mockGrades,
      completionPercentage,
      nextLesson,
      streak,
      timeSpent,
      certificateEligible,
      lastCommit,
      activityScore
    };
  };
  
  // UI state
  const [studentProgress, setStudentProgress] = useState<Record<string, StudentProgress>>({});

  const handleNavigateToLesson = (courseId: string, moduleId: string, lessonId: string) => {
    router.push(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  };
  
  const handleNavigateToProject = (courseId: string, projectId: string) => {
    router.push(`/courses/${courseId}/projects/${projectId}`);
  };

  const handleNavigateToCommit = (courseId: string, commitId: string) => {
    router.push(`/courses/${courseId}/commits/${commitId}`);
  };

  
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center p-6 max-w-md">
          <div className="bg-blue-50 inline-flex rounded-full p-3 mb-4">
            <BookOpen className="h-6 w-6 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No courses found</h2>
          <p className="text-gray-600 mb-6">You haven't enrolled in any courses yet.</p>
          <Button
            onClick={() => router.push('/courses')}
            size="lg"
            className="px-6"
          >
            <Layers className="mr-2 h-5 w-5" /> Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  // Calculate progress for the first course
  useEffect(() => {
    if (courses && courses.length > 0) {
      setStudentProgress(prev => ({
        ...prev,
        [courses[0].id]: calculateCourseProgress(courses[0])
      }));
    }
  }, [courses]);
  
  // Current course is the first one in the array
  // In a real app, you'd have navigation between courses
  const currentCourse = courses[0]; // Since we're viewing a single course detail
  const progress = currentCourse ? studentProgress[currentCourse.id] || calculateCourseProgress(currentCourse) : null;

  // Main course dashboard render
  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <style jsx>{gridBgStyle}</style>
      {/* Course Header */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b shadow-sm relative overflow-hidden">
        {/* Premium visual element - decorative dots */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.5),rgba(255,255,255,0))] -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getLevelColor(courses[0].level)} rounded-md px-2.5 py-1 font-medium`}>
                  <span className="flex items-center gap-1.5">
                    {getLevelIcon(courses[0].level)}
                    {courses[0].level.charAt(0).toUpperCase() + courses[0].level.slice(1)}
                  </span>
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 rounded-md px-2.5 py-1 font-medium">
                  Updated {new Date(courses[0].updatedAt).toLocaleDateString()}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {courses[0].title}
              </h1>
              <p className="mt-2 text-lg text-slate-600 max-w-3xl">
                {courses[0].description}
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
              <div className="text-3xl font-bold text-purple-600">{progress?.projects?.length || 0}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Projects</div>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="text-3xl font-bold text-amber-600">{progress?.grades?.length ? ((progress?.grades?.reduce((sum, g) => sum + g.score, 0) / progress?.grades?.length) / 20).toFixed(1) : '4.8'}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Marks</div>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4 py-2">
              <div className="text-3xl font-bold text-green-600">{progress?.commits?.length || 0}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Code Commits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Overview Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>Track your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-500">
                        {progress?.completedLessons || 0} of {progress?.totalLessons || 0} lessons completed
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {progress?.completionPercentage || 0}%
                      </span>
                    </div>
                    <Progress
                      value={progress?.completionPercentage || 0}
                      className="h-2 bg-blue-100"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="bg-emerald-100 p-2 rounded-full">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-slate-600 text-sm">Completed</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">{progress?.completedLessons || 0}</span>
                        <span className="text-slate-500 text-sm ml-1">lessons</span>
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-slate-600 text-sm">Time Spent</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">{progress?.timeSpent ? `${Math.floor(progress.timeSpent / 60)}h ${progress.timeSpent % 60}m` : 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Zap className="h-5 w-5 text-amber-600" />
                        </div>
                        <span className="text-slate-600 text-sm">Streak</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">{progress?.streak || 0}</span>
                        <span className="text-slate-500 text-sm ml-1">days</span>
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <BarChart2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-slate-600 text-sm">Activity Score</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">{progress?.activityScore || 0}</span>
                        <span className="text-slate-500 text-sm ml-1">/ 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projects Section */}
            <Card id="projects-section" className="overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileEdit className="h-5 w-5 text-blue-600" />
                    Projects
                  </CardTitle>
                  <CardDescription>Your assignments and project work</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-4 w-4" /> View All
                </Button>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[340px] pr-4">
                  <div className="space-y-4">
                    {progress?.projects && progress.projects.length > 0 ? (
                      progress.projects.map(project => (
                        <div key={project.id} className="border rounded-lg overflow-hidden bg-white hover:bg-slate-50 transition-colors">
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                                {project.title}
                                {project.completed && <CheckCircle className="h-4 w-4 text-green-500" />}
                              </h3>
                              <Badge className={getStatusColor(project.status || '')}>
                                {project.status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </div>
                            
                            <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                              {project.tags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs bg-slate-50">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="mt-4 flex items-center justify-between text-sm">
                              <div className="text-slate-500">
                                {project.dueDate && (
                                  <div className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                    Due: {new Date(project.dueDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                {project.resources && project.resources.length > 0 && (
                                  <Button size="sm" variant="ghost" className="h-8 text-xs gap-1">
                                    <Download className="h-3 w-3" /> Resources
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  onClick={() => handleNavigateToProject(currentCourse.id, project.id)}
                                  className="h-8 text-xs">
                                  View Project
                                </Button>
                              </div>
                            </div>
                            
                            {project.feedback && (
                              <div className="mt-3 pt-3 border-t text-sm">
                                <div className="font-medium text-slate-700 mb-1">Instructor Feedback:</div>
                                <p className="text-slate-600">{project.feedback}</p>
                              </div>
                            )}
                            
                            {project.grade && (
                              <div className="mt-3 flex justify-end">
                                <div className="rounded-full bg-green-50 border border-green-100 text-green-700 font-semibold text-sm py-1 px-3">
                                  Grade: {project.grade}/100
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <FileText className="h-12 w-12 text-slate-300 mb-3" />
                        <h4 className="text-lg font-semibold text-slate-700">No Projects Yet</h4>
                        <p className="text-slate-500 mt-1 mb-4">Projects will appear here when assigned</p>
                        <Button variant="outline">
                          Browse Available Projects
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Commits Section */}
            <Card id="commits-section">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GitCommit className="h-5 w-5 text-blue-600" />
                    Commits
                  </CardTitle>
                  <CardDescription>Your code submissions and reviews</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <GitBranch className="h-4 w-4" /> View Repository
                </Button>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {progress?.commits && progress.commits.length > 0 ? (
                      progress.commits.map(commit => (
                        <div 
                          key={commit.id}
                          className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div className={`p-2 rounded-full ${
                              commit.status === 'approved' ? 'bg-green-100' : 
                              commit.status === 'rejected' ? 'bg-red-100' : 
                              commit.status === 'needs-review' ? 'bg-blue-100' : 'bg-yellow-100'
                            }`}>
                              <GitCommit className={`h-4 w-4 ${
                                commit.status === 'approved' ? 'text-green-600' : 
                                commit.status === 'rejected' ? 'text-red-600' : 
                                commit.status === 'needs-review' ? 'text-blue-600' : 'text-yellow-600'
                              }`} />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-800 truncate">
                                {commit.title}
                              </h4>
                              <Badge className={getStatusColor(commit.status)}>
                                {commit.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </div>
                            
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                              {commit.description}
                            </p>
                            
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <div className="flex items-center text-slate-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(commit.date).toLocaleDateString()}
                                <span className="mx-2">•</span>
                                <span>{commit.author}</span>
                                <span className="mx-2">•</span>
                                <span>{commit.changes} changes</span>
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs gap-1"
                                onClick={() => handleNavigateToCommit(currentCourse.id, commit.id)}
                              >
                                View <ArrowUpRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <GitCommit className="h-12 w-12 text-slate-300 mb-3" />
                        <h4 className="text-lg font-semibold text-slate-700">No Commits Yet</h4>
                        <p className="text-slate-500 mt-1 mb-4">Your code submissions will appear here</p>
                        <Button variant="outline">
                          Set Up Repository
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Next Lesson Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-slate-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Continue Learning</span>
                  {progress?.certificateEligible && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-amber-300 text-white border-0">
                      <Award className="h-3.5 w-3.5 mr-1" /> Certificate Ready
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progress?.nextLesson ? (
                  <div>
                    <div className="mb-3">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                        {progress.completionPercentage}% Complete
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-semibold mb-2">
                      {progress.nextLesson.title}
                    </h4>
                    
                    <p className="text-sm text-slate-600 mb-4">
                      {progress.nextLesson.description || 'Continue where you left off in the course.'}
                    </p>
                    
                    <Button
                      onClick={() => handleNavigateToLesson(
                        currentCourse.id,
                        progress.nextLesson?.moduleId || '',
                        progress.nextLesson?.lessonId || ''
                      )}
                      className="w-full gap-2"
                    >
                      <Play className="h-4 w-4" /> Continue Learning
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckSquare className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                    <h4 className="text-lg font-semibold">All Caught Up!</h4>
                    <p className="text-sm text-slate-600 mt-1 mb-4">
                      You've completed all lessons in this course.
                    </p>
                    <Button variant="outline" className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Browse Courses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Additional sidebar content would go here */}
          </div>
        </div>
      </div>
    </div>
  );
}
