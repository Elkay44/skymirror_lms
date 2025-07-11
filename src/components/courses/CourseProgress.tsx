"use client";

import { useState, useEffect } from 'react';

interface CourseProgressProps {
  progress: number;
  totalLessons: number;
  completedLessons: number;
  estimatedHours?: number;
  className?: string;
}

export default function CourseProgress({
  progress,
  totalLessons,
  completedLessons,
  estimatedHours,
  className = ''
}: CourseProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    // Animate progress bar on mount
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [progress]);
  
  // Calculate remaining minutes as a friendly string
  const getRemainingTimeText = () => {
    if (!estimatedHours) return null;
    
    const totalMinutes = estimatedHours * 60;
    const remainingMinutes = Math.round(totalMinutes * (1 - progress / 100));
    
    if (remainingMinutes <= 0) return 'Complete!';
    
    if (remainingMinutes < 60) {
      return `${remainingMinutes} min left`;
    }
    
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
    }
    
    return `${hours}h ${minutes}m left`;
  };
  
  // Get progress status text
  const getStatusText = () => {
    if (progress === 0) return 'Not started';
    if (progress < 25) return 'Just started';
    if (progress < 50) return 'In progress';
    if (progress < 75) return 'Well along';
    if (progress < 100) return 'Almost there';
    return 'Completed';
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Your progress</h3>
        <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
      </div>
      
      <div className="h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${animatedProgress}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          role="progressbar"
          aria-label={`${progress}% complete`}
        />
      </div>
      
      <div className="flex justify-between text-sm text-gray-500">
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {completedLessons}/{totalLessons} lessons
        </span>
        <span>{getStatusText()}</span>
      </div>
      
      {estimatedHours !== undefined && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-500 flex items-center">
            <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Est. {estimatedHours} {estimatedHours === 1 ? 'hour' : 'hours'} total
          </span>
          <span className="text-xs font-medium text-indigo-600">{getRemainingTimeText()}</span>
        </div>
      )}
    </div>
  );
}
