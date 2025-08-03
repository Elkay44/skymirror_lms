"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Eye
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
  module: {
    id: string;
    title: string;
  };
  submission?: {
    id: string;
    submittedAt: string;
    grade?: number;
    status: 'pending' | 'graded' | 'late';
  };
}

export default function StudentAssignmentsPage() {
  const params = useParams();
  const { courseId } = params;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/assignments`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      if (data.success) {
        setAssignments(data.data.assignments || []);
        setCourse(data.data.course);
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

  const getStatusBadge = (assignment: Assignment) => {
    if (!assignment.submission) {
      if (assignment.dueDate && isOverdue(assignment.dueDate)) {
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

    if (assignment.submission.status === 'graded') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Graded
        </span>
      );
    }

    if (assignment.submission.status === 'late') {
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
                  Assignments
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
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assignments available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your instructor hasn't posted any assignments yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {assignments
              .filter(assignment => assignment.isPublished)
              .map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(assignment)}
                      </div>

                      {assignment.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {assignment.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>Module: {assignment.module.title}</span>
                        </div>

                        {assignment.dueDate && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className={isOverdue(assignment.dueDate) ? 'text-red-500' : ''}>
                              Due {formatDate(assignment.dueDate)}
                            </span>
                          </div>
                        )}
                        
                        {assignment.maxPoints && (
                          <div className="flex items-center">
                            <span>{assignment.maxPoints} points</span>
                          </div>
                        )}

                        {assignment.submission?.grade !== undefined && (
                          <div className="flex items-center">
                            <span className="font-medium">
                              Grade: {assignment.submission.grade}/{assignment.maxPoints}
                            </span>
                          </div>
                        )}
                      </div>

                      {assignment.submission && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Submitted on {formatDate(assignment.submission.submittedAt)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/courses/${courseId}/assignments/${assignment.id}`}
                        className="flex items-center px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                      
                      {!assignment.submission && (
                        <Link
                          href={`/courses/${courseId}/assignments/${assignment.id}/submit`}
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
