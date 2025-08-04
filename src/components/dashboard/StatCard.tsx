import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  className?: string;
  suffix?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading = false,
  className = '',
  suffix,
}: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md ${className}`}>
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
          <div className="h-8 w-16 bg-gray-300 rounded mb-2"></div>
          {description && <div className="h-4 w-32 bg-gray-200 rounded"></div>}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start min-w-0">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 break-words">{title}</p>
              <h3 className="text-2xl font-bold text-gray-900 break-words">{value}{suffix && ` ${suffix}`}</h3>
              {description && <p className="text-sm text-gray-500 mt-1 break-words">{description}</p>}
            </div>
            {icon && (
              <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 flex-shrink-0">
                {icon}
              </div>
            )}
          </div>
          
          {trend && (
            <div className="mt-3 flex items-center min-w-0">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {trend.isPositive ? (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-2">from last month</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
