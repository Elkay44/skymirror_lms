import Image from 'next/image';
import { Achievement } from '@prisma/client';

interface AchievementCardProps {
  achievement: Achievement & { earned?: boolean };
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <div className={`relative p-4 rounded-lg border ${
      achievement.earned 
        ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <div className="relative w-16 h-16">
          <Image
            src={achievement.imageUrl}
            alt={achievement.title}
            fill
            className="object-contain"
          />
          {achievement.earned && (
            <div className="absolute -top-2 -right-2">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {achievement.title}
          </h3>
          <p className="text-sm text-gray-600">
            {achievement.description}
          </p>
          <div className="mt-2 flex items-center text-sm">
            <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-yellow-600 font-medium">
              {achievement.points} points
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
