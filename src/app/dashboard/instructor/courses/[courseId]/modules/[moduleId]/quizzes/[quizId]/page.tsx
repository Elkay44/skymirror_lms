"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  HelpCircle, 
  Calendar, 
  Users,
  Save,
  X,
  AlertCircle,
  Timer
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
  updatedAt: string;
  module: {
    id: string;
    title: string;
    courseId: string;
  };
  questionCount?: number;
  attemptCount?: number;
  canEdit: boolean;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { courseId, moduleId, quizId } = params;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    timeLimit: 60,
    maxAttempts: 3,
    showCorrectAnswers: true,
    randomizeQuestions: false
  });

  useEffect(() => {
    fetchQuiz();
  }, [courseId, moduleId, quizId]);

  const fetchQuiz = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/quizzes/${quizId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Quiz not found');
        } else {
          setError('Failed to load quiz');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setQuiz(data.data);
        setEditForm({
          title: data.data.title,
          description: data.data.description || '',
          instructions: data.data.instructions || '',
          dueDate: data.data.dueDate ? new Date(data.data.dueDate).toISOString().slice(0, 16) : '',
          timeLimit: data.data.timeLimit || 60,
          maxAttempts: data.data.maxAttempts || 3,
          showCorrectAnswers: data.data.showCorrectAnswers || false,
          randomizeQuestions: data.data.randomizeQuestions || false
        });
      } else {
        setError(data.error || 'Failed to load quiz');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (quiz) {
      setEditForm({
        title: quiz.title,
        description: quiz.description || '',
        instructions: quiz.instructions || '',
        dueDate: quiz.dueDate ? new Date(quiz.dueDate).toISOString().slice(0, 16) : '',
        timeLimit: quiz.timeLimit || 60,
        maxAttempts: quiz.maxAttempts || 3,
        showCorrectAnswers: quiz.showCorrectAnswers || false,
        randomizeQuestions: quiz.randomizeQuestions || false
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/quizzes/${quizId}`, {
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
        throw new Error('Failed to update quiz');
      }

      const data = await response.json();
      if (data.success) {
        await fetchQuiz();
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update quiz');
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      setError('Failed to update quiz');
    }
  };

  const handleDelete = async () => {
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
        router.push(`/dashboard/instructor/courses/${courseId}/modules`);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4 break-words">{error || 'Quiz not found'}</div>
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
                  {isEditing ? 'Edit Quiz' : quiz.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                  {quiz.module.title}
                </p>
              </div>
            </div>

            {quiz.canEdit && (
              <div className="flex items-center space-x-2 min-w-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 min-w-0"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 min-w-0"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-w-0"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 min-w-0"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 lg:p-6">
                {isEditing ? (
                  <div className="space-y-4 lg:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 break-words">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 break-words">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 break-words">
                        Instructions
                      </label>
                      <textarea
                        value={editForm.instructions}
                        onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Instructions for taking the quiz..."
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 break-words">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 break-words">
                          Time Limit (minutes)
                        </label>
                        <input
                          type="number"
                          value={editForm.timeLimit}
                          onChange={(e) => setEditForm({ ...editForm, timeLimit: parseInt(e.target.value) || 60 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 break-words">
                          Max Attempts
                        </label>
                        <input
                          type="number"
                          value={editForm.maxAttempts}
                          onChange={(e) => setEditForm({ ...editForm, maxAttempts: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center min-w-0">
                        <input
                          type="checkbox"
                          checked={editForm.showCorrectAnswers}
                          onChange={(e) => setEditForm({ ...editForm, showCorrectAnswers: e.target.checked })}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 break-words">
                          Show correct answers after submission
                        </span>
                      </label>

                      <label className="flex items-center min-w-0">
                        <input
                          type="checkbox"
                          checked={editForm.randomizeQuestions}
                          onChange={(e) => setEditForm({ ...editForm, randomizeQuestions: e.target.checked })}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 break-words">
                          Randomize question order
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 lg:space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 break-words">
                        {quiz.title}
                      </h2>
                      {quiz.description && (
                        <p className="text-gray-600 dark:text-gray-300">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    {quiz.instructions && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 break-words">
                          Instructions
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {quiz.instructions}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 break-words">
                        Quiz Settings
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-gray-600 dark:text-gray-300">Time Limit:</span>
                          <span className="font-medium text-gray-900 dark:text-white break-words">
                            {quiz.timeLimit ? formatDuration(quiz.timeLimit) : 'No limit'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-gray-600 dark:text-gray-300">Max Attempts:</span>
                          <span className="font-medium text-gray-900 dark:text-white break-words">
                            {quiz.maxAttempts || 'Unlimited'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-gray-600 dark:text-gray-300">Show Answers:</span>
                          <span className="font-medium text-gray-900 dark:text-white break-words">
                            {quiz.showCorrectAnswers ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-gray-600 dark:text-gray-300">Randomize Questions:</span>
                          <span className="font-medium text-gray-900 dark:text-white break-words">
                            {quiz.randomizeQuestions ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* Quiz Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 break-words">
                Quiz Details
              </h3>
              <div className="space-y-3">
                {quiz.dueDate && (
                  <div className="flex items-center text-sm break-words min-w-0">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Due: {formatDate(quiz.dueDate)}
                      </span>
                      {isOverdue(quiz.dueDate) && (
                        <div className="flex items-center text-red-500 mt-1 min-w-0">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span className="text-xs">Overdue</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center text-sm break-words min-w-0">
                  <Timer className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Time Limit: {quiz.timeLimit ? formatDuration(quiz.timeLimit) : 'No limit'}
                  </span>
                </div>
                <div className="flex items-center text-sm break-words min-w-0">
                  <HelpCircle className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Questions: {quiz.questionCount || 0}
                  </span>
                </div>
                <div className="flex items-center text-sm break-words min-w-0">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Attempts: {quiz.attemptCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 break-words">
                Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quizzes/${quizId}/questions`}
                  className="block w-full px-3 py-2 text-center text-sm bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300 break-words"
                >
                  Manage Questions
                </Link>
                <Link
                  href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quizzes/${quizId}/attempts`}
                  className="block w-full px-3 py-2 text-center text-sm bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg text-green-700 dark:text-green-300 break-words"
                >
                  View Attempts
                </Link>
                <Link
                  href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/quizzes/${quizId}/analytics`}
                  className="block w-full px-3 py-2 text-center text-sm bg-purple-50 dark:bg-purple-900 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg text-purple-700 dark:text-purple-300 break-words"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
