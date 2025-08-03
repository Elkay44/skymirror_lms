"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Folder, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Eye,
  GitBranch,
  Code
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  dueDate?: string;
  maxPoints?: number;
  isPublished?: boolean;
  allowLateSubmissions?: boolean;
  repositoryUrl?: string;
  createdAt: string;
  module: {
    id: string;
    title: string;
  };
  submission?: {
    id: string;
    submittedAt: string;
    grade?: number;
    status: 'pending' | 'graded' | 'late';
    repositoryUrl?: string;
  };
}

export default function StudentProjectsPage() {
  const params = useParams();
  const { courseId } = params;

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
  }, [courseId]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/projects`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      if (data.success) {
        setProjects(data.data.projects || []);
        setCourse(data.data.course);
      } else {
        setError(data.error || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusBadge = (project: Project) => {
    if (!project.submission) {
      if (project.dueDate && isOverdue(project.dueDate)) {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    }

    if (project.submission.status === 'graded') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Graded
        </span>
      );
    }

    if (project.submission.status === 'late') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Late Submission
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        <Upload className="h-3 w-3 mr-1" />
        Submitted
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Link 
            href={`/courses/${courseId}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/courses/${courseId}`}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Course
              </Link>
              <div className="text-gray-300 dark:text-gray-600">|</div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Projects
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {course?.title || 'Course'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your instructor hasn't posted any projects yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {projects
              .filter(project => project.isPublished)
              .map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        {getStatusBadge(project)}
                      </div>

                      {project.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {project.description}
                        </p>
                      )}

                      {project.repositoryUrl && (
                        <div className="mb-3">
                          <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            <GitBranch className="h-4 w-4 mr-1" />
                            Starter Repository
                          </a>
                        </div>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center">
                          <Folder className="h-4 w-4 mr-1" />
                          <span>Module: {project.module.title}</span>
                        </div>

                        {project.dueDate && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className={isOverdue(project.dueDate) ? 'text-red-500' : ''}>
                              Due {formatDate(project.dueDate)}
                            </span>
                          </div>
                        )}
                        
                        {project.maxPoints && (
                          <div className="flex items-center">
                            <Code className="h-4 w-4 mr-1" />
                            <span>{project.maxPoints} points</span>
                          </div>
                        )}

                        {project.submission?.grade !== undefined && (
                          <div className="flex items-center">
                            <span className="font-medium">
                              Grade: {project.submission.grade}/{project.maxPoints}
                            </span>
                          </div>
                        )}
                      </div>

                      {project.submission && (
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Submitted on {formatDate(project.submission.submittedAt)}</span>
                          {project.submission.repositoryUrl && (
                            <a
                              href={project.submission.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                              <GitBranch className="h-3 w-3 mr-1" />
                              Your Repository
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/courses/${courseId}/projects/${project.id}`}
                        className="flex items-center px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                      
                      {!project.submission && (
                        <Link
                          href={`/courses/${courseId}/projects/${project.id}/submit`}
                          className="flex items-center px-3 py-2 text-sm bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg text-green-700 dark:text-green-300"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
