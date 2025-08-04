"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  HelpCircle, 
  Calendar, 
  Users,
  Timer,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate?: string;
  timeLimit?: number; // in minutes
  maxAttempts?: number;
  isPublished?: boolean;
  showCorrectAnswers?: boolean;
  randomizeQuestions?: boolean;
  createdAt: string;
  questionCount?: number;
  attemptCount?: number;
}

export default function QuizzesListPage() {
  const params = useParams();
  const { courseId, moduleId } = params;

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<any>(null);

  useEffect(() => {
    fetchQuizzes();
  }, [courseId, moduleId]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/quizzes`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await response.json();
      if (data.success) {
        setQuizzes(data.data.quizzes || []);
        setModule(data.data.module);
      } else {
        setError(data.error || 'Failed to load quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete quiz');
      }

      const data = await response.json();
      if (data.success) {
        await fetchQuizzes(); // Refresh list
      } else {
        setError(data.error || 'Failed to delete quiz');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setError('Failed to delete quiz');
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
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
                  Quizzes
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                  {module?.title || 'Module'}
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quiz/create`}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-w-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 break-words">
              No quizzes yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first quiz for this module.
            </p>
            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quiz/create`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-w-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden"
              >
                <div className="flex items-start justify-between min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2 min-w-0">
                      <Link
                        href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quizzes/${quiz.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 break-words"
                      >
                        {quiz.title}
                      </Link>
                      {quiz.isPublished ? (
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

                    {quiz.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-3 break-words min-w-0">
                      <div className="flex items-center min-w-0">
                        <HelpCircle className="h-4 w-4 mr-1" />
                        <span>{quiz.questionCount || 0} questions</span>
                      </div>

                      {quiz.timeLimit && (
                        <div className="flex items-center min-w-0">
                          <Timer className="h-4 w-4 mr-1" />
                          <span>{formatDuration(quiz.timeLimit)}</span>
                        </div>
                      )}

                      {quiz.maxAttempts && (
                        <div className="flex items-center min-w-0">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          <span>{quiz.maxAttempts} attempts max</span>
                        </div>
                      )}

                      <div className="flex items-center min-w-0">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{quiz.attemptCount || 0} attempts</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 break-words min-w-0">
                      {quiz.dueDate && (
                        <div className="flex items-center min-w-0">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className={isOverdue(quiz.dueDate) ? 'text-red-500' : ''}>
                            Due {formatDate(quiz.dueDate)}
                          </span>
                          {isOverdue(quiz.dueDate) && (
                            <AlertCircle className="h-3 w-3 ml-1 text-red-500" />
                          )}
                        </div>
                      )}

                      <div className="flex items-center min-w-0">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Created {formatDate(quiz.createdAt)}</span>
                      </div>

                      {quiz.showCorrectAnswers && (
                        <div className="flex items-center min-w-0">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Shows answers</span>
                        </div>
                      )}

                      {quiz.randomizeQuestions && (
                        <div className="flex items-center min-w-0">
                          <BarChart3 className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="text-blue-600 dark:text-blue-400">Randomized</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4 min-w-0">
                    <Link
                      href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quizzes/${quiz.id}`}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Edit quiz"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete quiz"
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
