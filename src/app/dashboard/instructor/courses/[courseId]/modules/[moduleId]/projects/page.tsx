"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Folder, 
  Calendar, 
  Users,
  Code,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  GitBranch,
  Clock
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
  submissionCount?: number;
}

export default function ProjectsListPage() {
  const params = useParams();
  const { courseId, moduleId } = params;

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
  }, [courseId, moduleId]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/projects`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      if (data.success) {
        setProjects(data.data.projects || []);
        setModule(data.data.module);
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

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      const data = await response.json();
      if (data.success) {
        await fetchProjects(); // Refresh list
      } else {
        setError(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
            href={`/dashboard/instructor/courses/${courseId}/modules`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Modules
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
                href={`/dashboard/instructor/courses/${courseId}/modules`}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Modules
              </Link>
              <div className="text-gray-300 dark:text-gray-600">|</div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Projects
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {module?.title || 'Module'}
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/project/create`}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first project for this module.
            </p>
            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/project/create`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/projects/${project.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {project.title}
                      </Link>
                      {project.isPublished ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          Draft
                        </span>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
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
                          Repository
                        </a>
                      </div>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      {project.dueDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className={isOverdue(project.dueDate) ? 'text-red-500' : ''}>
                            Due {formatDate(project.dueDate)}
                          </span>
                          {isOverdue(project.dueDate) && (
                            <AlertCircle className="h-3 w-3 ml-1 text-red-500" />
                          )}
                        </div>
                      )}
                      
                      {project.maxPoints && (
                        <div className="flex items-center">
                          <Code className="h-4 w-4 mr-1" />
                          <span>{project.maxPoints} points</span>
                        </div>
                      )}

                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{project.submissionCount || 0} submissions</span>
                      </div>

                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Created {formatDate(project.createdAt)}</span>
                      </div>

                      {project.allowLateSubmissions && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Late submissions allowed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/projects/${project.id}`}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Edit project"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
