import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface ActivityItem {
  id: string;
  type: 'course_progress' | 'certificate' | 'achievement' | 'forum' | 'mentorship' | 'assessment';
  title: string;
  description?: string;
  timestamp: string;
  link?: string;
  user?: {
    name: string;
    avatar?: string;
  };
  relatedItem?: {
    id: string;
    title: string;
    image?: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  emptyMessage?: string;
  maxItems?: number;
  className?: string;
}

export default function ActivityFeed({
  activities,
  title = 'Recent Activity',
  emptyMessage = 'No recent activity to display',
  maxItems = 5,
  className = ''
}: ActivityFeedProps) {
  // Limit the number of activities to display
  const displayActivities = activities.slice(0, maxItems);
  
  // Get activity icon based on type
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'course_progress':
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case 'certificate':
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        );
      case 'achievement':
        return (
          <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      case 'forum':
        return (
          <div className="p-2 rounded-full bg-purple-100 text-purple-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      case 'mentorship':
        return (
          <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'assessment':
        return (
          <div className="p-2 rounded-full bg-red-100 text-red-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-100 text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return activityTime.toLocaleDateString();
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      {displayActivities.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              {/* Activity icon */}
              <div className="flex-shrink-0 mr-4">
                {getActivityIcon(activity.type)}
              </div>
              
              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <span className="text-sm text-gray-500">{formatRelativeTime(activity.timestamp)}</span>
                </div>
                
                {activity.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                )}
                
                {/* Related item (course, achievement, etc.) */}
                {activity.relatedItem && (
                  <div className="mt-2 flex items-center bg-gray-50 rounded-lg p-2">
                    {activity.relatedItem.image && (
                      <div className="flex-shrink-0 h-10 w-10 mr-3 relative rounded overflow-hidden">
                        <Image 
                          src={activity.relatedItem.image} 
                          alt={activity.relatedItem.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{activity.relatedItem.title}</p>
                    </div>
                  </div>
                )}
                
                {/* Link to related item */}
                {activity.link && (
                  <div className="mt-2">
                    <Link 
                      href={activity.link}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View details
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* View all link */}
          {activities.length > maxItems && (
            <div className="pt-2 text-center">
              <Link 
                href="/activities"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                View all activities
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
