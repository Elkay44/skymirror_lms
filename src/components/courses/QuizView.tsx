import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

interface Question {
  id: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  timeLimit?: number;
  passingScore: number;
}

interface QuizViewProps {
  quizId: string;
  onComplete: (score: number) => void;
}

export default function QuizView({ quizId, onComplete }: QuizViewProps) {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz?.timeLimit && !showResults) {
      setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz]);

  const fetchQuiz = async () => {
    try {
      const response = await axios.get(`/api/quizzes/${quizId}`);
      setQuiz(response.data.quiz);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/quizzes/${quizId}/submit`, {
        answers,
      });
      setScore(response.data.score);
      setShowResults(true);
      onComplete(response.data.score);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const currentQuestionData = quiz.questions[currentQuestion];

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Quiz Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
            {timeRemaining !== null && (
              <div className="text-lg font-semibold text-gray-700">
                Time: {formatTime(timeRemaining)}
              </div>
            )}
          </div>
          {quiz.description && (
            <p className="mt-1 text-gray-600">{quiz.description}</p>
          )}
        </div>

        {showResults ? (
          // Results View
          <div className="px-6 py-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-4">
                {score !== null && (
                  <span
                    className={
                      score >= quiz.passingScore
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {score}%
                  </span>
                )}
              </div>
              <p className="text-lg text-gray-700 mb-6">
                {score !== null &&
                  (score >= quiz.passingScore
                    ? 'Congratulations! You passed the quiz.'
                    : 'Keep practicing! You can do better next time.')}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          // Quiz Questions View
          <div className="px-6 py-4">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((currentQuestion + 1) / quiz.questions.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600 text-right">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </p>
            </div>

            {/* Question */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {currentQuestionData.content}
                </h3>

                {currentQuestionData.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3">
                    {currentQuestionData.options?.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={currentQuestionData.id}
                          value={option}
                          checked={answers[currentQuestionData.id] === option}
                          onChange={(e) =>
                            handleAnswer(currentQuestionData.id, e.target.value)
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestionData.type === 'TRUE_FALSE' && (
                  <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                      <label
                        key={option}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={currentQuestionData.id}
                          value={option}
                          checked={answers[currentQuestionData.id] === option}
                          onChange={(e) =>
                            handleAnswer(currentQuestionData.id, e.target.value)
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {(currentQuestionData.type === 'SHORT_ANSWER' ||
                  currentQuestionData.type === 'ESSAY') && (
                  <textarea
                    value={answers[currentQuestionData.id] || ''}
                    onChange={(e) =>
                      handleAnswer(currentQuestionData.id, e.target.value)
                    }
                    rows={currentQuestionData.type === 'ESSAY' ? 6 : 2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder={
                      currentQuestionData.type === 'ESSAY'
                        ? 'Write your essay here...'
                        : 'Enter your answer...'
                    }
                  />
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentQuestion((prev) => prev - 1)}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentQuestion === quiz.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion((prev) => prev + 1)}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
