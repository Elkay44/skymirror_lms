import React from 'react';
import Image from 'next/image';

interface AchievementCardProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    earnedDate: string;
    points: number;
  };
  compact?: boolean;
}

export default function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const formattedDate = new Date(achievement.earnedDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (compact) {
    return (
      <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex-shrink-0 h-10 w-10 relative">
          {achievement.imageUrl ? (
            <Image 
              src={achievement.imageUrl} 
              alt={achievement.title}
              fill
              className="object-contain"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          )}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{achievement.title}</p>
          <p className="text-xs text-gray-500 truncate">{formattedDate}</p>
        </div>
        <div className="flex-shrink-0 ml-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
            +{achievement.points}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Badge showing points in top-right corner */}
      <div className="absolute top-3 right-3 z-10">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          +{achievement.points} points
        </span>
      </div>
      
      <div className="p-5">
        <div className="flex items-center justify-center mb-4">
          {achievement.imageUrl ? (
            <div className="relative h-20 w-20">
              <Image 
                src={achievement.imageUrl} 
                alt={achievement.title}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">{achievement.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{achievement.description}</p>
          <p className="mt-2 text-xs text-gray-400">Earned on {formattedDate}</p>
        </div>
      </div>
    </div>
  );
}
