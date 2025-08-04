"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MentorshipStats {
  totalMentorships: number;
  activeMentorships: number;
  unreadMessages: number;
  isMentor?: boolean;
  isStudent?: boolean;
}

interface MentorshipNavCardProps {
  stats?: MentorshipStats;
}

export default function MentorshipNavCard({ stats: propStats }: MentorshipNavCardProps) {
  const [stats, setStats] = useState<MentorshipStats>({
    totalMentorships: 0,
    activeMentorships: 0,
    unreadMessages: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If stats are provided as props, use them
    if (propStats) {
      setStats(propStats);
      setIsLoading(false);
      return;
    }
    
    // Otherwise fetch them from the API
    const fetchMentorshipStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/mentorships/stats');
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching mentorship stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentorshipStats();
  }, [propStats]);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg overflow-hidden">
      <div className="p-5 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center min-w-0">
          <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3 min-w-0">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 break-words">Mentorship</h3>
            <p className="text-sm text-gray-500 break-words">Connect with mentors to accelerate your learning</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white px-5 py-3">
        {isLoading ? (
          <div className="animate-pulse flex space-x-4 min-w-0">
            <div className="flex-1 space-y-4 py-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-gray-900 break-words">{stats.totalMentorships}</p>
              <p className="text-xs text-gray-500">Total Mentorships</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 break-words">{stats.activeMentorships}</p>
              <p className="text-xs text-gray-500">Active Mentorships</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-indigo-600 flex items-center justify-center break-words min-w-0">
                {stats.unreadMessages}
                {stats.unreadMessages > 0 && (
                  <span className="ml-1 flex h-2 w-2 min-w-0">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75 min-w-0"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 min-w-0"></span>
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">Unread Messages</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-5 py-3">
        <div className="flex justify-between items-center text-sm break-words min-w-0">
          <Link href="/mentorship" className="font-medium text-indigo-600 hover:text-indigo-500 break-words">
            View My Mentorships
          </Link>
          <Link href="/mentors" className="font-medium text-indigo-600 hover:text-indigo-500 break-words">
            Find a Mentor
          </Link>
        </div>
      </div>
    </div>
  );
}
