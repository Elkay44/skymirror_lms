"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Calendar, 
  Code2, 
  FileCheck, 
  Github, 
  Globe, 
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// Project status icons and colors
const statusConfig = {
  SUBMITTED: { icon: <Clock className="h-5 w-5 text-blue-500" />, color: 'bg-blue-100 text-blue-800' },
  REVIEWING: { icon: <Clock className="h-5 w-5 text-indigo-500" />, color: 'bg-indigo-100 text-indigo-800' },
  APPROVED: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: 'bg-green-100 text-green-800' },
  REVISION_REQUESTED: { icon: <AlertCircle className="h-5 w-5 text-amber-500" />, color: 'bg-amber-100 text-amber-800' },
  REJECTED: { icon: <XCircle className="h-5 w-5 text-red-500" />, color: 'bg-red-100 text-red-800' }
};

// Types for projects
interface Submission {
  id: string;
  status: 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
  submittedAt: string;
  grade?: number;
  feedback?: string;
  reviewedAt?: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  skills?: string[];
  courseId: string;
  course?: {
    title: string;
  };
  submissions?: Submission[];
  isRequiredForCertification: boolean;
}

export default function StudentProjects() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [courses, setCourses] = useState<Record<string, {title: string; projects: Project[]}>>({}); // Group projects by course
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const fetchedProjects = await response.json();
        
        // Parse skills JSON if needed and ensure submissions are properly typed
        const processedProjects = (fetchedProjects || []).map((project: any) => ({
          ...project,
          skills: project.skills && typeof project.skills === 'string' 
            ? JSON.parse(project.skills) 
            : project.skills
        }));
        
        setProjects(processedProjects);
        
        // Filter projects by status and organize by course
        const active: Project[] = [];
        const completed: Project[] = [];
        const courseMap: Record<string, {title: string; projects: Project[]}> = {};
        
        for (const project of processedProjects) {
          const latestSubmission = project.submissions && project.submissions.length > 0 
            ? project.submissions[0] 
            : null;
          
          // Add to active or completed lists
          if (latestSubmission && latestSubmission.status === 'APPROVED') {
            completed.push(project);
          } else {
            active.push(project);
          }
          
          // Group by course
          const courseId = project.courseId || '';
          if (!courseMap[courseId]) {
            courseMap[courseId] = {
              title: project.course?.title || 'Unknown Course',
              projects: []
            };
          }
          courseMap[courseId].projects.push(project);
        }
        
        setActiveProjects(active);
        setCompletedProjects(completed);
        setCourses(courseMap);
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [session]);
  
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">My Projects</h1>
          
          {/* Course filter */}
          <div className="w-full md:w-auto">
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full md:w-60 border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="">All Courses</option>
              {Object.entries(courses).map(([id, course]) => (
                <option key={id} value={id}>
                  {course.title} ({course.projects.length} projects)
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedCourseId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
            <h2 className="font-semibold mb-1">
              {courses[selectedCourseId]?.title}
            </h2>
            <p className="text-sm">
              Viewing {courses[selectedCourseId]?.projects.length} projects for this course.
              <button 
                onClick={() => setSelectedCourseId('')}
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
              >
                Show all courses
              </button>
            </p>
          </div>
        )}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">My Projects</h1>
          
          {/* Course filter */}
          <div className="w-full md:w-auto">
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full md:w-60 border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="">All Courses</option>
              {Object.entries(courses).map(([id, course]) => (
                <option key={id} value={id}>
                  {course.title} ({course.projects.length} projects)
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedCourseId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
            <h2 className="font-semibold mb-1">
              {courses[selectedCourseId]?.title}
            </h2>
            <p className="text-sm">
              Viewing {courses[selectedCourseId]?.projects.length} projects for this course.
              <button 
                onClick={() => setSelectedCourseId('')}
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
              >
                Show all courses
              </button>
            </p>
          </div>
        )}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">My Projects</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Total Projects: {projects.length}
          </span>
          <span className="h-4 w-px bg-gray-300"></span>
          <span className="text-sm text-blue-600">
            Active: {activeProjects.length}
          </span>
          <span className="h-4 w-px bg-gray-300"></span>
          <span className="text-sm text-green-600">
            Completed: {completedProjects.length}
          </span>
        </div>
      </div>
      
      {/* Active Projects Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Code2 className="h-5 w-5 mr-2 text-blue-600" />
          Active Projects
        </h2>
        
        {activeProjects.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-2">No active projects found</p>
            <p className="text-sm text-gray-500 mb-4">Start exploring courses to find projects to work on</p>
            <Link 
              href="/courses" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse Courses
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(selectedCourseId ? courses[selectedCourseId]?.projects.filter(p => 
              !p.submissions?.some(s => s.status === 'APPROVED')
            ) : activeProjects).map((project) => {
              const latestSubmission = project.submissions && project.submissions.length > 0 
                ? project.submissions[0] 
                : null;
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-grow">{project.title}</h3>
                      {latestSubmission && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[latestSubmission.status].color}`}>
                          {latestSubmission.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-3 text-sm text-gray-500">
                      <p className="flex items-center mb-1">
                        <FileCheck className="h-4 w-4 mr-1.5" />
                        Course: {project.course?.title || 'Unknown Course'}
                      </p>
                      {project.dueDate && (
                        <p className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          Due: {new Date(project.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      {project.isRequiredForCertification && (
                        <p className="flex items-center text-amber-600">
                          <Award className="h-4 w-4 mr-1.5" />
                          Required for certification
                        </p>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>
                    
                    {project.skills && project.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {project.skills.map((skill: string, i: number) => (
                            <span 
                              key={i} 
                              className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <div className="flex space-x-1">
                        {latestSubmission ? (
                          <Link 
                            href={`/courses/${project.courseId}/projects/${project.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </Link>
                        ) : (
                          <Link 
                            href={`/courses/${project.courseId}/projects/${project.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Start Project
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
      
      {/* Completed Projects Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          Completed Projects
        </h2>
        
        {completedProjects.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
            <Award className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-2">No completed projects yet</p>
            <p className="text-sm text-gray-500">As you complete projects, they will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(selectedCourseId ? courses[selectedCourseId]?.projects.filter(p => 
              p.submissions?.some(s => s.status === 'APPROVED')
            ) : completedProjects).map((project) => {
              const approvedSubmission = project.submissions?.find(s => s.status === 'APPROVED');
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-grow">{project.title}</h3>
                      <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        APPROVED
                      </span>
                    </div>
                    
                    <div className="mb-3 text-sm text-gray-500">
                      <p className="flex items-center mb-1">
                        <FileCheck className="h-4 w-4 mr-1.5" />
                        Course: {project.course?.title || 'Unknown Course'}
                      </p>
                      {approvedSubmission?.grade && (
                        <p className="flex items-center mb-1 text-green-600 font-medium">
                          <Award className="h-4 w-4 mr-1.5" />
                          Grade: {approvedSubmission.grade}%
                        </p>
                      )}
                      {approvedSubmission?.reviewedAt && (
                        <p className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          Completed: {new Date(approvedSubmission.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>
                    
                    {project.skills && project.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {project.skills.map((skill: string, i: number) => (
                            <span 
                              key={i} 
                              className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <Link 
                        href={`/dashboard/student/projects/submissions/${approvedSubmission?.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Submission
                      </Link>
                      
                      <Link 
                        href={`/dashboard/student/portfolio?project=${project.id}`}
                        className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
                      >
                        Add to Portfolio
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
