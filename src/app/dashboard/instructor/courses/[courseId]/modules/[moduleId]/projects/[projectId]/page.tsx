"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Users,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Code,
  GitBranch
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
  updatedAt: string;
  module: {
    id: string;
    title: string;
    courseId: string;
  };
  submissionCount?: number;
  canEdit: boolean;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { courseId, moduleId, projectId } = params;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    requirements: '',
    dueDate: '',
    maxPoints: 100,
    allowLateSubmissions: false,
    repositoryUrl: ''
  });

  useEffect(() => {
    fetchProject();
  }, [courseId, moduleId, projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/projects/${projectId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Project not found');
        } else {
          setError('Failed to load project');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setProject(data.data);
        setEditForm({
          title: data.data.title,
          description: data.data.description || '',
          requirements: data.data.requirements || '',
          dueDate: data.data.dueDate ? new Date(data.data.dueDate).toISOString().slice(0, 16) : '',
          maxPoints: data.data.maxPoints || 100,
          allowLateSubmissions: data.data.allowLateSubmissions || false,
          repositoryUrl: data.data.repositoryUrl || ''
        });
      } else {
        setError(data.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (project) {
      setEditForm({
        title: project.title,
        description: project.description || '',
        requirements: project.requirements || '',
        dueDate: project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 16) : '',
        maxPoints: project.maxPoints || 100,
        allowLateSubmissions: project.allowLateSubmissions || false,
        repositoryUrl: project.repositoryUrl || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...editForm,
          dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const data = await response.json();
      if (data.success) {
        await fetchProject();
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project');
    }
  };

  const handleDelete = async () => {
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
        router.push(`/dashboard/instructor/courses/${courseId}/modules`);
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
      month: 'long',
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

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error || 'Project not found'}</div>
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
                  {isEditing ? 'Edit Project' : project.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project.module.title}
                </p>
              </div>
            </div>

            {project.canEdit && (
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Requirements
                      </label>
                      <textarea
                        value={editForm.requirements}
                        onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Project requirements and specifications..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Repository URL
                      </label>
                      <input
                        type="url"
                        value={editForm.repositoryUrl}
                        onChange={(e) => setEditForm({ ...editForm, repositoryUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Points
                        </label>
                        <input
                          type="number"
                          value={editForm.maxPoints}
                          onChange={(e) => setEditForm({ ...editForm, maxPoints: parseInt(e.target.value) || 100 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.allowLateSubmissions}
                          onChange={(e) => setEditForm({ ...editForm, allowLateSubmissions: e.target.checked })}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Allow late submissions
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {project.title}
                      </h2>
                      {project.description && (
                        <p className="text-gray-600 dark:text-gray-300">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {project.requirements && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Requirements
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {project.requirements}
                          </p>
                        </div>
                      </div>
                    )}

                    {project.repositoryUrl && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Repository
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            <GitBranch className="h-4 w-4 mr-2" />
                            {project.repositoryUrl}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Project Details
              </h3>
              <div className="space-y-3">
                {project.dueDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Due: {formatDate(project.dueDate)}
                      </span>
                      {isOverdue(project.dueDate) && (
                        <div className="flex items-center text-red-500 mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span className="text-xs">Overdue</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Code className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Max Points: {project.maxPoints || 'Not set'}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Submissions: {project.submissionCount || 0}
                  </span>
                </div>
                {project.allowLateSubmissions && (
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Late submissions allowed
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/projects/${projectId}/submissions`}
                  className="block w-full px-3 py-2 text-center text-sm bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300"
                >
                  View Submissions
                </Link>
                <Link
                  href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/projects/${projectId}/grade`}
                  className="block w-full px-3 py-2 text-center text-sm bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg text-green-700 dark:text-green-300"
                >
                  Grade Submissions
                </Link>
                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-3 py-2 text-center text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    View Repository
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
