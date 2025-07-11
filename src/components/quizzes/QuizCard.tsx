"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Award, FileText, CheckCircle } from 'lucide-react';

interface QuizCardProps {
  id: string;
  title: string;
  description?: string | null;
  timeLimit?: number | null;
  passingScore: number;
  questionCount: number;
  courseId: string;
  moduleId?: string;
  bestScore?: number | null;
  attempts?: number;
  maxAttempts?: number;
  isPassed?: boolean;
  isCompleted?: boolean;
  className?: string;
}

export default function QuizCard({
  id,
  title,
  description,
  timeLimit,
  passingScore,
  questionCount,
  courseId,
  moduleId,
  bestScore,
  attempts = 0,
  maxAttempts = 3,
  isPassed = false,
  isCompleted = false,
  className = '',
}: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine card style based on completion status
  const cardStyle = isPassed
    ? 'border-green-200 bg-green-50'
    : isCompleted && !isPassed
    ? 'border-orange-200 bg-orange-50'
    : 'border-gray-200 bg-white hover:shadow-md';
  
  // Check if user can still attempt the quiz
  const canAttempt = attempts < maxAttempts || maxAttempts === 0;

  return (
    <div
      className={`rounded-xl border ${cardStyle} overflow-hidden transition-all duration-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {isPassed && (
            <span className="flex items-center text-sm font-medium text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Passed
            </span>
          )}
        </div>
        
        {description && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}
        
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-1 text-gray-400" />
            {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Award className="h-4 w-4 mr-1 text-gray-400" />
            Pass: {passingScore}%
          </div>
          
          {timeLimit && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1 text-gray-400" />
              {timeLimit} {timeLimit === 1 ? 'Minute' : 'Minutes'}
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <span className="text-gray-400 mr-1">{attempts}/{maxAttempts === 0 ? '∞' : maxAttempts}</span>
            Attempts
          </div>
        </div>
        
        {bestScore !== undefined && bestScore !== null && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Best Score</span>
              <span className="text-xs font-medium text-gray-700">{bestScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${bestScore >= passingScore ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(bestScore, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
        <Link
          href={`/courses/${courseId}${moduleId ? `/modules/${moduleId}` : ''}/quizzes/${id}`}
          className={`block w-full text-center py-2 px-4 rounded-md text-sm font-medium ${
            canAttempt 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          aria-disabled={!canAttempt}
          onClick={(e) => !canAttempt && e.preventDefault()}
        >
          {isPassed ? 'Review Quiz' : isCompleted ? 'Try Again' : 'Start Quiz'}
        </Link>
      </div>
    </div>
  );
}
