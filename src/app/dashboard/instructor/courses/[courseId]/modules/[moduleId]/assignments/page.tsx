"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Calendar, 
  Users,
  Clock,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  maxPoints?: number;
  isPublished?: boolean;
  allowLateSubmissions?: boolean;
  createdAt: string;
  submissionCount?: number;
}

export default function AssignmentsListPage() {
  const params = useParams();
  const { courseId, moduleId } = params;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<any>(null);

  useEffect(() => {
    fetchAssignments();
  }, [courseId, moduleId]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/assignments`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      if (data.success) {
        setAssignments(data.data.assignments || []);
        setModule(data.data.module);
      } else {
        setError(data.error || 'Failed to load assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      const data = await response.json();
      if (data.success) {
        await fetchAssignments(); // Refresh list
      } else {
        setError(data.error || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError('Failed to delete assignment');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4 break-words">{error}</div>
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
          <div className="flex items-center justify-between h-16 min-w-0">
            <div className="flex items-center space-x-4 min-w-0">
              <Link 
                href={`/dashboard/instructor/courses/${courseId}/modules`}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-w-0"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Modules
              </Link>
              <div className="text-gray-300 dark:text-gray-600">|</div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white break-words">
                  Assignments
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                  {module?.title || 'Module'}
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignment/create`}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-w-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 break-words">
              No assignments yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first assignment for this module.
            </p>
            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignment/create`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-w-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden"
              >
                <div className="flex items-start justify-between min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2 min-w-0">
                      <Link
                        href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignments/${assignment.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 break-words"
                      >
                        {assignment.title}
                      </Link>
                      {assignment.isPublished ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 break-words min-w-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 break-words min-w-0">
                          Draft
                        </span>
                      )}
                    </div>

                    {assignment.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 break-words min-w-0">
                      {assignment.dueDate && (
                        <div className="flex items-center min-w-0">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className={isOverdue(assignment.dueDate) ? 'text-red-500' : ''}>
                            Due {formatDate(assignment.dueDate)}
                          </span>
                          {isOverdue(assignment.dueDate) && (
                            <AlertCircle className="h-3 w-3 ml-1 text-red-500" />
                          )}
                        </div>
                      )}
                      
                      {assignment.maxPoints && (
                        <div className="flex items-center min-w-0">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>{assignment.maxPoints} points</span>
                        </div>
                      )}

                      <div className="flex items-center min-w-0">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{assignment.submissionCount || 0} submissions</span>
                      </div>

                      <div className="flex items-center min-w-0">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Created {formatDate(assignment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4 min-w-0">
                    <Link
                      href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/assignments/${assignment.id}`}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Edit assignment"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete assignment"
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
