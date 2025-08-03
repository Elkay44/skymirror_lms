"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  BookOpen,
  Users,
  FileText,
  Edit,
  BarChart2,
  Eye,
  Clock,
  Lock,
  Unlock,
  MessageSquare,
  Check,
  AlertTriangle,
  PlusIcon,
  ArrowLeft,
  RefreshCw,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpenCheck,
  BarChart3,
  Users2,
  FileQuestion,
  BookMarked,
  Info,
  AlertCircle
} from 'lucide-react';
import { Course, Module } from '@/types/course-detail';

// Define tab types
type TabType = 'overview' | 'modules' | 'students' | 'analytics' | 'settings';

// Format duration in minutes to a readable format
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Format date to a readable format
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Loading component
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-600">Loading course details...</p>
    </div>
  </div>
);

// Error component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Course</h2>
    <p className="text-gray-600 mb-6">
      {error || 'Failed to load course data. Please try again.'}
    </p>
    <div className="flex gap-3">
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
      <Link 
        href="/dashboard/instructor/courses"
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>
    </div>
  </div>
);

// Course header component
const CourseHeader = ({ 
  course, 
  isPublishing, 
  onPublishToggle 
}: { 
  course: Course; 
  isPublishing: boolean; 
  onPublishToggle: () => void 
}) => (
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
    <div className="relative h-64 w-full">
      {course.imageUrl ? (
        <Image
          src={course.imageUrl}
          alt={course.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          priority
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-blue-400" />
        </div>
      )}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800 flex items-center gap-2">
        {course.isPublished ? (
          <>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>Published</span>
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
            <span>Draft</span>
          </>
        )}
        {course.isPrivate && (
          <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
            <Lock className="h-3 w-3" />
            <span>Private</span>
          </div>
        )}
        {course.difficulty && (
          <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            course.difficulty === 'BEGINNER' 
              ? 'bg-blue-100 text-blue-800' 
              : course.difficulty === 'INTERMEDIATE'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1).toLowerCase()}
          </div>
        )}
      </div>
    </div>

    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title || 'Untitled Course'}</h1>
          {course.shortDescription && (
            <p className="text-gray-600 text-lg mb-4">{course.shortDescription}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            {typeof course.enrollmentCount !== 'undefined' && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-900">{course.enrollmentCount}</span>
                  <span className="ml-1">students</span>
                </div>
              </div>
            )}
            {typeof course.completionRate !== 'undefined' && (
              <div className="flex items-center gap-1">
                <BarChart2 className="h-4 w-4 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-900">{course.completionRate}%</span>
                  <span className="ml-1">completion</span>
                </div>
              </div>
            )}
            {typeof course.averageRating !== 'undefined' && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-900">
                    {typeof course.averageRating === 'number' ? course.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="ml-1">/5.0 rating</span>
                </div>
              </div>
            )}
            {course.updatedAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <div>
                  <span>Updated </span>
                  <span className="font-medium text-gray-900">
                    {formatDate(course.updatedAt)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {course.instructor && (
            <div className="flex items-center gap-3 mt-4">
              <div className="relative h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                {course.instructor.image ? (
                  <Image
                    src={course.instructor.image}
                    alt={course.instructor.name || 'Instructor'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                    <UserIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Instructor</p>
                <p className="font-medium text-gray-900">
                  {course.instructor.name || course.instructor.email?.split('@')[0] || 'Unknown'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg w-full md:w-64 flex-shrink-0">
          <h3 className="font-medium text-gray-900 mb-3">Course Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Modules</span>
              <span className="font-medium">{course.modules || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lessons</span>
              <span className="font-medium">{course.lessons || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Projects</span>
              <span className="font-medium">{course.projects || 0}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Students</span>
                <span className="font-medium">{course.enrollmentCount || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onPublishToggle}
              disabled={isPublishing}
              className={`w-full px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                course.isPublished 
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {course.isPublished ? 'Unpublishing...' : 'Publishing...'}
                </>
              ) : course.isPublished ? (
                <>
                  <Unlock className="h-4 w-4" />
                  Unpublish Course
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Publish Course
                </>
              )}
            </button>
            
            <Link 
              href={`/dashboard/instructor/courses/${course.id}/edit`}
              className="mt-2 w-full px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Edit className="h-4 w-4" />
              Edit Course
            </Link>
            
            <Link 
              href={`/courses/${course.id}`}
              target="_blank"
              className="mt-2 w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Eye className="h-4 w-4" />
              View Live
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Tab navigation component
const TabNavigation = ({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: TabType; 
  onTabChange: (tab: TabType) => void 
}) => (
  <div className="border-b border-gray-200 mb-6">
    <nav className="-mb-px flex space-x-8">
      {[
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'modules', label: 'Modules & Lessons', icon: BookMarked },
        { id: 'students', label: 'Students', icon: Users2 },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ].map((tab) => {
        const TabIcon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TabIcon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  </div>
);

// Overview tab component
const OverviewTab = ({ course }: { course: Course }) => (
  <div className="space-y-8">
    {course.description && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
        <div className="prose max-w-none text-gray-700">
          {course.description}
        </div>
      </div>
    )}

    {course.learningOutcomes?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          What You'll Learn
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {course.learningOutcomes.map((outcome, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{outcome}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {course.requirements?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Requirements
        </h3>
        <ul className="space-y-2">
          {course.requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{req}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {course.targetAudience?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Who This Course Is For
        </h3>
        <div className="flex flex-wrap gap-2">
          {course.targetAudience.map((audience, i) => (
            <span
              key={i}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {audience}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Modules tab component
const ModulesTab = ({ modules, expandedModules, onToggleModule }: { 
  modules: Module[]; 
  expandedModules: Record<string, boolean>; 
  onToggleModule: (id: string) => void 
}) => (
  <div className="space-y-4">
    {modules.length > 0 ? (
      <div className="space-y-6">
        {modules.map((module) => (
          <div key={module.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => onToggleModule(module.id)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center text-left"
            >
              <div>
                <h3 className="font-medium text-gray-900">{module.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                  {module.projects.length > 0 && ` • ${module.projects.length} projects`}
                </p>
              </div>
              {expandedModules[module.id] ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedModules[module.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border-t">
                    {module.description && (
                      <p className="text-gray-600 mb-4">{module.description}</p>
                    )}
                    
                    <div className="space-y-4">
                      {module.lessons.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Lessons</h4>
                          <ul className="space-y-2">
                            {module.lessons.map((lesson) => (
                              <li key={lesson.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                                    {lesson.description && (
                                      <p className="text-xs text-gray-500 mt-1">{lesson.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDuration(lesson.duration)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {module.projects.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Projects</h4>
                          <ul className="space-y-2">
                            {module.projects.map((project) => (
                              <li key={project.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <FileQuestion className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {project.title}
                                      {project.isRequiredForCertification && (
                                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                          Required for Certificate
                                        </span>
                                      )}
                                    </p>
                                    {project.description && (
                                      <p className="text-xs text-gray-500 mt-1">{project.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {project.submissionCount} submissions
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <BookOpenCheck className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No modules yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first module.</p>
        <div className="mt-6">
          <Link
            href={`/dashboard/instructor/courses/${modules[0]?.id || 'new'}/modules/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Module
          </Link>
        </div>
      </div>
    )}
  </div>
);

// Students tab component
const StudentsTab = () => (
  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-lg font-medium text-gray-900">Students</h3>
      <p className="mt-1 text-sm text-gray-500">
        View and manage students enrolled in this course.
      </p>
      <div className="mt-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Student management is coming soon. This feature will allow you to view and manage all students enrolled in your course.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Analytics tab component
const AnalyticsTab = () => (
  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
      <p className="mt-1 text-sm text-gray-500">
        View detailed analytics about your course performance.
      </p>
      <div className="mt-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Analytics dashboard is coming soon. This will provide you with insights into student engagement, completion rates, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Main component
export default function CourseDetailPage() {
  const { data: _session } = useSession();
  const params = useParams();

  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  
  // Fetch course data
  useEffect(() => {
    if (!courseId) return;
    
    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        const [courseRes, modulesRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/courses/${courseId}/modules`)
        ]);
        
        if (!courseRes.ok || !modulesRes.ok) {
          const errorData = await courseRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch course data');
        }
        
        const courseData = await courseRes.json();
        const modulesData = await modulesRes.json();
        
        setCourse(courseData);
        setModules(modulesData.modules || []);
        
        // Initialize expanded state for modules
        const initialExpandedState: Record<string, boolean> = {};
        if (modulesData.modules?.length > 0) {
          // Only expand the first module by default
          initialExpandedState[modulesData.modules[0].id] = true;
        }
        setExpandedModules(initialExpandedState);
        
        setError('');
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);
  
  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  // Toggle course publish status
  const togglePublishStatus = async () => {
    if (!course) return;
    
    try {
      setIsPublishing(true);
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !course.isPublished })
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update course status');
      }
      
      setCourse(prev => prev ? {
        ...prev,
        isPublished: !prev.isPublished
      } : null);
      
      toast.success(`Course ${course.isPublished ? 'unpublished' : 'published'} successfully`);
    } catch (err) {
      console.error('Error updating publish status:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update course status');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  // Render loading state
  if (isLoading) {
    return <LoadingState />;
  }
  
  // Render error state
  if (error || !course) {
    return <ErrorState 
      error={error} 
      onRetry={() => window.location.reload()} 
    />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link 
              href="/dashboard/instructor/courses" 
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Back to courses"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Course Details</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage and view details for <span className="font-medium">{course.title}</span>
          </p>
        </div>
      </div>
      
      {/* Course header */}
      <CourseHeader 
        course={course} 
        isPublishing={isPublishing} 
        onPublishToggle={togglePublishStatus} 
      />
      
      {/* Tab navigation */}
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      {/* Tab content */}
      <div className="py-4">
        {activeTab === 'overview' && <OverviewTab course={course} />}
        {activeTab === 'modules' && (
          <ModulesTab 
            modules={modules} 
            expandedModules={expandedModules} 
            onToggleModule={toggleModule} 
          />
        )}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
}
