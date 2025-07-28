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
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'matching';
  question: string;
  points: number;
  options?: {
    id: string;
    text: string;
    isCorrect?: boolean;
    matchId?: string;
  }[];
  correctAnswer?: string | string[] | Record<string, string>;
}

interface UserAnswer {
  questionId: string;
  answer: any;
}

interface QuizPageProps {
  params: {
    courseId: string;
    quizId: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function QuizPage({ 
  params: paramsPromise 
}: { 
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const [params, setParams] = useState<{ courseId: string; quizId: string } | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { data: session, status } = useSession();
  const router = useRouter();

  // Load params when component mounts
  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await paramsPromise;
        setParams(resolvedParams);
      } catch (err) {
        console.error('Error loading params:', err);
        setError('Failed to load quiz data');
        setLoading(false);
      }
    };

    loadParams();
  }, [paramsPromise]);

  // Load quiz data when params are available
  useEffect(() => {
    if (!params) return;
    
    const { courseId, quizId } = params;
    
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load quiz');
        }
        
        const data = await response.json();
        setQuiz(data);
        
        // Initialize user answers
        setUserAnswers(
          data.questions.map((q: Question) => ({
            questionId: q.id,
            answer: q.type === 'multiple_choice' || q.type === 'true_false' 
              ? '' 
              : q.type === 'fill_blank' 
                ? [] 
                : q.type === 'matching'
                  ? {}
                  : ''
          }))
        );
        
        // Set time limit if exists
        if (data.timeLimit) {
          setTimeLeft(data.timeLimit * 60); // Convert minutes to seconds
        }
        
        setStartTime(new Date());
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [params]);
  
  // Timer effect
  useEffect(() => {
    if (!timeLeft || submitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);
  
  const handleAnswerChange = (questionId: string, answer: any) => {
    setUserAnswers(prev => 
      prev.map(item => 
        item.questionId === questionId ? { ...item, answer } : item
      )
    );
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!quiz || !startTime) return;
    
    try {
      setSubmitting(true);
      
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // in seconds
      
      const response = await fetch(`/api/courses/${params?.courseId}/quizzes/${params?.quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          timeSpent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }
      
      const result = await response.json();
      
      setScore(result.score);
      setPassed(result.passed);
      setSubmitted(true);
      
      // Show success/error message
      if (result.passed) {
        toast.success(`Quiz submitted! Your score: ${result.score}%`);
      } else {
        toast.error(`Quiz submitted. Your score: ${result.score}% - You need ${quiz.passingScore}% to pass.`);
      }
      
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('quiz-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
    } catch (err) {
      console.error('Error submitting quiz:', err);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center text-red-600 mb-4">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <h1 className="text-xl font-semibold">Error Loading Quiz</h1>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link 
            href={`/courses/${params?.courseId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }
  
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-semibold text-gray-800">Quiz not found</h1>
          <p className="text-gray-600 mt-2">The requested quiz could not be found.</p>
          <Link 
            href={`/courses/${params?.courseId}`}
            className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link 
            href={`/courses/${params?.courseId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Course
          </Link>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-gray-600 mt-1">{quiz.description}</p>
              )}
            </div>
            
            {timeLeft !== null && !submitted && (
              <div className="flex items-center bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md mt-4 sm:mt-0">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-medium">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
          
          {quiz.attemptsAllowed > 0 && (
            <div className="text-sm text-gray-600 mb-6">
              Attempts allowed: {quiz.attempts || 0} of {quiz.attemptsAllowed}
            </div>
          )}
        </div>
        
        {submitted ? (
          <div id="quiz-results" className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="text-center">
              {passed ? (
                <div className="text-green-600 mb-4">
                  <CheckCircle className="h-16 w-16 mx-auto mb-2" />
                  <h2 className="text-2xl font-bold">Quiz Completed!</h2>
                  <p className="text-lg">Your score: {score}%</p>
                </div>
              ) : (
                <div className="text-red-600 mb-4">
                  <XCircle className="h-16 w-16 mx-auto mb-2" />
                  <h2 className="text-2xl font-bold">Quiz Completed</h2>
                  <p className="text-lg">Your score: {score}% (Minimum passing score: {quiz.passingScore}%)</p>
                </div>
              )}
              
              <div className="mt-6">
                <Link
                  href={`/courses/${params?.courseId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Course
                </Link>
                
                {!passed && quiz.attemptsAllowed > (quiz.attempts || 0) && (
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {quiz.questions.map((question, index) => {
              const userAnswer = userAnswers.find(a => a.questionId === question.id)?.answer;
              
              return (
                <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {question.question} <span className="text-sm text-gray-500">({question.points} points)</span>
                      </h3>
                      
                      <div className="mt-2">
                        {question.type === 'multiple_choice' && (
                          <MultipleChoiceQuestion
                            id={question.id}
                            questionText={question.question}
                            questionType={question.type}
                            points={question.points}
                            options={question.options?.map(opt => ({
                              id: opt.id,
                              optionText: opt.text,
                              position: question.options?.indexOf(opt) || 0
                            })) || []}
                            selectedOptionIds={userAnswer ? [userAnswer] : []}
                            correctOptionIds={question.options?.filter(opt => opt.isCorrect).map(opt => opt.id) || []}
                            isReview={submitted}
                            onAnswer={(answer) => handleAnswerChange(question.id, answer[0])}
                          />
                        )}
                        
                        {question.type === 'true_false' && (
                          <TrueFalseQuestion
                            id={question.id}
                            questionText={question.question}
                            questionType={question.type}
                            points={question.points}
                            correctAnswer={question.correctAnswer as boolean | undefined}
                            userAnswer={userAnswer as boolean | undefined}
                            isReview={submitted}
                            onAnswer={(answer) => handleAnswerChange(question.id, answer)}
                          />
                        )}
                        
                        {question.type === 'fill_blank' && (
                          <FillBlankQuestion
                            id={question.id}
                            questionText={question.question}
                            questionType={question.type}
                            points={question.points}
                            correctAnswers={((): string[] => {
                              if (!question.correctAnswer) return [];
                              if (Array.isArray(question.correctAnswer)) {
                                return question.correctAnswer.filter((item): item is string => 
                                  typeof item === 'string'
                                );
                              }
                              return [String(question.correctAnswer)];
                            })()}
                            userAnswer={userAnswer as string | undefined}
                            isReview={submitted}
                            onAnswer={(answer) => handleAnswerChange(question.id, answer)}
                          />
                        )}
                        
                        {question.type === 'short_answer' && (
                          <ShortAnswerQuestion
                            id={question.id}
                            questionText={question.question}
                            questionType={question.type}
                            points={question.points}
                            correctAnswers={((): string[] => {
                              if (!question.correctAnswer) return [];
                              if (Array.isArray(question.correctAnswer)) {
                                return question.correctAnswer.filter((item): item is string => 
                                  typeof item === 'string'
                                );
                              }
                              return [String(question.correctAnswer)];
                            })()}
                            userAnswer={userAnswer as string | undefined}
                            isReview={submitted}
                            onAnswer={(answer) => handleAnswerChange(question.id, answer)}
                          />
                        )}
                        
                        {question.type === 'matching' && (
                          <MatchingQuestion
                            id={question.id}
                            questionText={question.question}
                            questionType={question.type}
                            points={question.points}
                            items={question.options?.filter(opt => !opt.matchId).map(opt => ({
                              id: opt.id,
                              text: opt.text
                            })) || []}
                            matches={question.options?.filter(opt => opt.matchId).map(opt => ({
                              id: opt.id,
                              text: opt.text
                            })) || []}
                            correctPairs={question.options
                              ?.filter(opt => opt.matchId && opt.isCorrect)
                              .map(opt => ({
                                itemId: opt.id,
                                matchId: opt.matchId || ''
                              })) || []}
                            userPairs={userAnswer as { itemId: string; matchId: string }[] || []}
                            isReview={submitted}
                            onAnswer={(pairs) => handleAnswerChange(question.id, pairs)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="bg-white rounded-lg shadow-md p-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
