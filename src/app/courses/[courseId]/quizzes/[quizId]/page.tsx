"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Clock, AlertTriangle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { 
  MultipleChoiceQuestion, 
  TrueFalseQuestion, 
  FillBlankQuestion, 
  ShortAnswerQuestion, 
  MatchingQuestion 
} from '@/components/quizzes/QuestionTypes';

// Define types for quiz data
interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  timeLimit?: number | null;
  passingScore: number;
  courseId: string;
  moduleId?: string;
  questions: Question[];
  attemptsAllowed: number;
  attempts?: number;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  points: number;
  position: number;
  explanation?: string | null;
  options?: {
    id: string;
    optionText: string;
    position: number;
  }[];
  correctAnswers?: any; // This will be type-specific
}

interface UserAnswer {
  questionId: string;
  answer: any; // Can be string, boolean, string[], or objects depending on question type
}

export default function QuizPage({ params }: { params: { courseId: string; quizId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { courseId, quizId } = params;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'intro' | 'quiz' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [quizResults, setQuizResults] = useState<any | null>(null);
  
  // Timer functionality
  useEffect(() => {
    if (currentStep === 'quiz' && timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => (prev && prev > 0) ? prev - 1 : 0);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (timeRemaining === 0) {
      // Auto-submit when time expires
      handleSubmitQuiz();
    }
  }, [timeRemaining, currentStep]);
  
  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fetch quiz data
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch quiz data');
        }
        
        const data = await response.json();
        setQuiz(data);
        
        // Initialize time remaining if there's a time limit
        if (data.timeLimit) {
          setTimeRemaining(data.timeLimit * 60); // Convert minutes to seconds
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user) {
      fetchQuizData();
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(`/courses/${courseId}/quizzes/${quizId}`));
    }
  }, [courseId, quizId, session, status, router]);
  
  // Start the quiz
  const handleStartQuiz = () => {
    setCurrentStep('quiz');
  };
  
  // Handle answer submission for current question
  const handleAnswerSubmit = (questionId: string, answer: any) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);
    
    if (existingAnswerIndex >= 0) {
      // Update existing answer
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = { questionId, answer };
      setAnswers(updatedAnswers);
    } else {
      // Add new answer
      setAnswers([...answers, { questionId, answer }]);
    }
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Submit the entire quiz
  const handleSubmitQuiz = async () => {
    if (!quiz || !session?.user) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }
      
      const results = await response.json();
      setQuizResults(results);
      setCurrentStep('results');
      
      // Show success message
      if (results.isPassed) {
        toast.success('Quiz completed successfully! You passed!');
      } else {
        toast.error('Quiz completed. Unfortunately, you did not pass.');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      toast.error('Failed to submit quiz. Please try again.');
    }
  };
  
  // Render question based on type
  const renderQuestion = (question: Question) => {
    const userAnswer = answers.find(a => a.questionId === question.id);
    
    switch (question.questionType) {
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceQuestion
            id={question.id}
            questionText={question.questionText}
            questionType={question.questionType}
            points={question.points}
            options={question.options || []}
            selectedOptionIds={userAnswer?.answer || []}
            onAnswer={(answer) => handleAnswerSubmit(question.id, answer)}
          />
        );
      case 'TRUE_FALSE':
        return (
          <TrueFalseQuestion
            id={question.id}
            questionText={question.questionText}
            questionType={question.questionType}
            points={question.points}
            userAnswer={userAnswer?.answer}
            onAnswer={(answer) => handleAnswerSubmit(question.id, answer)}
          />
        );
      case 'FILL_BLANK':
        return (
          <FillBlankQuestion
            id={question.id}
            questionText={question.questionText}
            questionType={question.questionType}
            points={question.points}
            userAnswer={userAnswer?.answer}
            onAnswer={(answer) => handleAnswerSubmit(question.id, answer)}
          />
        );
      case 'SHORT_ANSWER':
        return (
          <ShortAnswerQuestion
            id={question.id}
            questionText={question.questionText}
            questionType={question.questionType}
            points={question.points}
            userAnswer={userAnswer?.answer}
            onAnswer={(answer) => handleAnswerSubmit(question.id, answer)}
          />
        );
      case 'MATCHING':
        return (
          <MatchingQuestion
            id={question.id}
            questionText={question.questionText}
            questionType={question.questionType}
            points={question.points}
            items={question.options?.slice(0, question.options.length / 2) || []}
            matches={question.options?.slice(question.options.length / 2) || []}
            userPairs={userAnswer?.answer}
            onAnswer={(answer) => handleAnswerSubmit(question.id, answer)}
          />
        );
      default:
        return <div>Unknown question type</div>;
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-center text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Quiz</h2>
              <p className="text-gray-500 mb-6">{error}</p>
              <Link 
                href={`/courses/${courseId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // No quiz data
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
              <p className="text-gray-500 mb-6">The quiz you're looking for doesn't exist or you don't have access.</p>
              <Link 
                href={`/courses/${courseId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz intro screen
  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">{quiz.title}</h1>
                <Link 
                  href={`/courses/${courseId}`}
                  className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Course
                </Link>
              </div>
            </div>
            
            <div className="px-6 py-6">
              {quiz.description && (
                <p className="text-gray-600 mb-6">{quiz.description}</p>
              )}
              
              <div className="bg-gray-50 rounded-lg p-5 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quiz Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Questions</p>
                      <p className="text-sm text-gray-500">{quiz.questions.length} questions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Passing Score</p>
                      <p className="text-sm text-gray-500">{quiz.passingScore}% to pass</p>
                    </div>
                  </div>
                  
                  {quiz.timeLimit && (
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Time Limit</p>
                        <p className="text-sm text-gray-500">{quiz.timeLimit} minutes</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <RefreshCw className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Attempts</p>
                      <p className="text-sm text-gray-500">{quiz.attempts || 0}/{quiz.attemptsAllowed} attempts used</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Instructions</h2>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Read each question carefully before answering.</li>
                  <li>You can navigate between questions using the previous and next buttons.</li>
                  {quiz.timeLimit && <li>You have {quiz.timeLimit} minutes to complete the quiz.</li>}
                  <li>You need to score at least {quiz.passingScore}% to pass this quiz.</li>
                  <li>Once you submit the quiz, you cannot change your answers.</li>
                </ul>
              </div>
              
              {/* Start button */}
              <div className="flex justify-center">
                <button
                  onClick={handleStartQuiz}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Quiz results screen
  if (currentStep === 'results') {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Quiz Results: {quiz.title}</h1>
                <Link 
                  href={`/courses/${courseId}`}
                  className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Course
                </Link>
              </div>
            </div>
            
            <div className="px-6 py-6">
              <div className="text-center mb-8">
                {quizResults.isPassed ? (
                  <div>
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
                    <p className="text-gray-600">You've passed this quiz.</p>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
                      <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Quite There</h2>
                    <p className="text-gray-600">You didn't pass this quiz. Review your answers and try again.</p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-5 mb-8">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Your Score</p>
                    <p className="text-3xl font-bold text-gray-900">{quizResults.score}%</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Passing Score</p>
                    <p className="text-3xl font-bold text-gray-900">{quiz.passingScore}%</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Correct Answers</p>
                    <p className="text-3xl font-bold text-gray-900">{quizResults.correctCount}/{quiz.questions.length}</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Time Taken</p>
                    <p className="text-3xl font-bold text-gray-900">{quizResults.timeTaken || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Course
                </Link>
                
                {!quizResults.isPassed && quiz.attempts < quiz.attemptsAllowed && (
                  <Link
                    href={`/courses/${courseId}/quizzes/${quizId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Try Again
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Quiz taking interface
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quiz header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">{quiz.title}</h1>
              {timeRemaining !== null && (
                <div className="flex items-center text-gray-700">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {answers.length}/{quiz.questions.length} answered
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${(answers.length / quiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Current question */}
        {quiz.questions.length > 0 && renderQuestion(quiz.questions[currentQuestionIndex])}
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${currentQuestionIndex === 0 ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
          >
            Previous
          </button>
          
          <div>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
