"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  HelpCircle, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Timer,
  BarChart3,
  Lock
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
  module: {
    id: string;
    title: string;
  };
  questionCount?: number;
  attempt?: {
    id: string;
    score?: number;
    maxScore?: number;
    completedAt?: string;
    attemptsUsed: number;
    status: 'in_progress' | 'completed' | 'graded';
  };
  isAccessible?: boolean;
}

export default function StudentQuizzesPage() {
  const params = useParams();
  const { courseId } = params;

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/quizzes`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await response.json();
      if (data.success) {
        setQuizzes(data.data.quizzes || []);
        setCourse(data.data.course);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusBadge = (quiz: Quiz) => {
    if (!quiz.isAccessible) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          <Lock className="h-3 w-3 mr-1" />
          Locked
        </span>
      );
    }

    if (!quiz.attempt) {
      if (quiz.dueDate && isOverdue(quiz.dueDate)) {
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
          Not Started
        </span>
      );
    }

    if (quiz.attempt.status === 'in_progress') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Play className="h-3 w-3 mr-1" />
          In Progress
        </span>
      );
    }

    if (quiz.attempt.status === 'graded') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        <BarChart3 className="h-3 w-3 mr-1" />
        Submitted
      </span>
    );
  };

  const canTakeQuiz = (quiz: Quiz) => {
    if (!quiz.isAccessible) return false;
    if (!quiz.attempt) return true;
    if (quiz.attempt.status === 'in_progress') return true;
    if (!quiz.maxAttempts) return true;
    return quiz.attempt.attemptsUsed < quiz.maxAttempts;
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
                  Quizzes
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
        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No quizzes available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your instructor hasn't published any quizzes yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {quizzes
              .filter(quiz => quiz.isPublished)
              .map((quiz) => (
                <div
                  key={quiz.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                    !quiz.isAccessible ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {quiz.title}
                        </h3>
                        {getStatusBadge(quiz)}
                      </div>

                      {quiz.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {quiz.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center">
                          <HelpCircle className="h-4 w-4 mr-1" />
                          <span>Module: {quiz.module.title}</span>
                        </div>

                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          <span>{quiz.questionCount || 0} questions</span>
                        </div>

                        {quiz.timeLimit && (
                          <div className="flex items-center">
                            <Timer className="h-4 w-4 mr-1" />
                            <span>{formatDuration(quiz.timeLimit)}</span>
                          </div>
                        )}

                        {quiz.maxAttempts && (
                          <div className="flex items-center">
                            <span>{quiz.maxAttempts} attempts max</span>
                          </div>
                        )}

                        {quiz.dueDate && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className={isOverdue(quiz.dueDate) ? 'text-red-500' : ''}>
                              Due {formatDate(quiz.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {quiz.attempt && (
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <span>Attempts used: {quiz.attempt.attemptsUsed}</span>
                          {quiz.attempt.score !== undefined && quiz.attempt.maxScore && (
                            <span className="font-medium">
                              Score: {quiz.attempt.score}/{quiz.attempt.maxScore}
                            </span>
                          )}
                          {quiz.attempt.completedAt && (
                            <span>Completed {formatDate(quiz.attempt.completedAt)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {quiz.isAccessible ? (
                        <>
                          {canTakeQuiz(quiz) ? (
                            <Link
                              href={`/courses/${courseId}/quizzes/${quiz.id}`}
                              className="flex items-center px-3 py-2 text-sm bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg text-green-700 dark:text-green-300"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {quiz.attempt?.status === 'in_progress' ? 'Continue' : 'Start Quiz'}
                            </Link>
                          ) : (
                            <div className="flex items-center px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                              No attempts left
                            </div>
                          )}
                          
                          {quiz.attempt?.status === 'graded' && (
                            <Link
                              href={`/courses/${courseId}/quizzes/${quiz.id}/results`}
                              className="flex items-center px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Results
                            </Link>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                          <Lock className="h-4 w-4 mr-2" />
                          Locked
                        </div>
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
