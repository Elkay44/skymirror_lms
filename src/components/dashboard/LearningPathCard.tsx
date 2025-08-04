"use client";

import React from 'react';
import Link from 'next/link';

interface LearningPathCardProps {
  pathData: {
    currentPath: string;
    progress: number;
    nextCourse?: string;
    estimatedCompletion?: string;
    totalCourses?: number;
    completedCourses?: number;
  };
}

export default function LearningPathCard({ pathData }: LearningPathCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Top section with gradient background */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 text-white">
        <div className="flex items-center justify-between min-w-0">
          <h3 className="text-lg font-semibold break-words">{pathData.currentPath}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-indigo-800 break-words min-w-0">
            {pathData.progress}% Complete
          </span>
        </div>
        
        <div className="mt-3 bg-white/20 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-white h-2.5 rounded-full overflow-hidden" 
            style={{ width: `${pathData.progress}%` }}
          ></div>
        </div>
        
        {(pathData.totalCourses && pathData.completedCourses) && (
          <p className="mt-2 text-sm text-indigo-100 break-words">
            {pathData.completedCourses}/{pathData.totalCourses} courses completed
          </p>
        )}
      </div>
      
      {/* Content section */}
      <div className="px-4 py-3 lg:px-6 lg:py-4">
        {pathData.nextCourse && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 break-words">Next Course</h4>
            <p className="text-base font-medium text-gray-900 break-words">{pathData.nextCourse}</p>
          </div>
        )}
        
        {pathData.estimatedCompletion && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 break-words">Estimated Completion</h4>
            <p className="text-base font-medium text-gray-900 break-words">{pathData.estimatedCompletion}</p>
          </div>
        )}
      </div>
      
      {/* Footer with action button */}
      <div className="px-6 py-3 bg-gray-50 flex justify-between items-center min-w-0">
        <Link 
          href="/learning-path"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 break-words"
        >
          View full path
        </Link>
        
        <Link 
          href={pathData.nextCourse ? `/courses?path=${encodeURIComponent(pathData.currentPath)}` : '/learning-path'}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words min-w-0"
        >
          {pathData.nextCourse ? 'Continue Learning' : 'Explore Paths'}
        </Link>
      </div>
    </div>
  );
}
