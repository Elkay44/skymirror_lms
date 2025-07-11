"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Users, Clock } from 'lucide-react';

interface ForumCardProps {
  id: string;
  title: string;
  description?: string | null;
  courseId: string;
  isGlobal?: boolean;
  postsCount: number;
  lastPostAt?: string | null;
  lastPostAuthor?: string | null;
  className?: string;
}

export default function ForumCard({
  id,
  title,
  description,
  courseId,
  isGlobal = false,
  postsCount,
  lastPostAt,
  lastPostAuthor,
  className = '',
}: ForumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const formattedDate = lastPostAt 
    ? new Date(lastPostAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white hover:shadow-md overflow-hidden transition-all duration-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          {isGlobal && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Global
            </span>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <MessageSquare className="h-4 w-4 mr-1 text-gray-400" />
              {postsCount} {postsCount === 1 ? 'Post' : 'Posts'}
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1 text-gray-400" />
              {isGlobal ? 'All Students' : 'Course Students'}
            </div>
          </div>
          
          {lastPostAt && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last post: {formattedDate} by {lastPostAuthor || 'Anonymous'}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <Link
          href={`/courses/${courseId}/forums/${id}`}
          className="block w-full text-center py-2 px-4 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          View Forum
        </Link>
      </div>
    </div>
  );
}
