'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Play,
  CheckCircle,
  Lock,
  FileText,
  Target,
  GitBranch,
  MessageSquare,
  Award,
  TrendingUp,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const [loadingAdditionalData, setLoadingAdditionalData] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!session?.user?.id || !courseId) return;
    
    fetchCourse();
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

  const fetchAdditionalData = (tabType: TabType) => {
    switch (tabType) {
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
        return (
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                      <p className="text-2xl font-bold text-gray-900">{course.totalLessons}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{course.completedLessons}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(course.progress)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Star className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Grade</p>
                      <p className="text-2xl font-bold text-gray-900">A-</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Lesson Completed</p>
                      <p className="text-sm text-gray-600">Introduction to React Hooks</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Play className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Video Watched</p>
                      <p className="text-sm text-gray-600">State Management Basics</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'modules':
        return (
          <div className="space-y-6">
            {course.modules.map((module, moduleIndex) => (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {module.isLocked ? (
                          <Lock className="h-5 w-5 text-gray-400" />
                        ) : (
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            {moduleIndex + 1}
                          </span>
                        )}
                        {module.title}
                      </CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                    <Badge variant={module.isLocked ? "secondary" : "default"}>
                      {Math.round(module.progress)}% Complete
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          lesson.completed
                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                            : module.isLocked
                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => !module.isLocked && handleLessonClick(module.id, lesson.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {lesson.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : module.isLocked ? (
                              <Lock className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Play className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            <p className="text-sm text-gray-500">{lesson.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {formatDuration(lesson.duration)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Course Forums</CardTitle>
              </CardHeader>
              <CardContent>
                {forumsData?.data?.forums && forumsData.data.forums.length > 0 ? (
                  <div className="space-y-4">
                    {forumsData.data.forums.map((forum: any) => (
                      <div key={forum.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{forum.title}</h4>
                            <p className="text-sm text-gray-600">{forum.description}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{forum.threadCount} threads</p>
                            <p>{forum.postCount} posts</p>
                          </div>
                        </div>
                        {forum.lastPost && (
                          <div className="mt-2 text-xs text-gray-500">
                            Last post: {new Date(forum.lastPost.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No forums available for this course yet.</p>
                )}
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Course Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {projectsData?.data && projectsData.data.length > 0 ? (
                  <div className="space-y-4">
                    {projectsData.data.map((project: any) => (
                      <div key={project.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{project.title}</h4>
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                            )}
                            {project.module && (
                              <p className="text-xs text-gray-500 mt-1">Module: {project.module.title}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {project.pointsValue} points
                            </div>
                            {project.dueDate && (
                              <div className="text-xs text-gray-500">
                                Due: {new Date(project.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {project._count?.submissions || 0} submissions
                            </div>
                          </div>
                        </div>
                        {project.isRequiredForCertification && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Required for Certification
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No projects available for this course yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'commits':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Code Commits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Your code commits and version history will be available here.</p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/student/courses')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Courses
          </Button>
          
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Course Header */}
            <div className="p-6 border-b">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.instructor.name}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {course.totalLessons} lessons
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {course.completedLessons} completed
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(course.progress)}%</span>
                    </div>
                    <Progress value={course.progress} className="w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b">
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
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
