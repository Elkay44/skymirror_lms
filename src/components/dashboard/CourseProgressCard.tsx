import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CourseProgressCardProps {
  course: {
    id: string;
    title: string;
    progress: number;
    imageUrl: string;
    lastActivity?: string;
    nextModule?: string;
  };
}

export default function CourseProgressCard({ course }: CourseProgressCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="relative h-36 w-full">
        <Image 
          src={course.imageUrl} 
          alt={course.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="bg-white/90 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 break-words">{course.title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-500 break-words min-w-0">
          <span>{course.progress}% complete</span>
          {course.lastActivity && (
            <span>Last active: {course.lastActivity}</span>
          )}
        </div>
        
        {course.nextModule && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between min-w-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Next up:</p>
                <p className="text-sm font-medium text-gray-700 truncate break-words">{course.nextModule}</p>
              </div>
              <Link
                href={`/courses/${course.id}`}
                className="flex-shrink-0 ml-2 p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 min-w-0 flex-shrink-0"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
