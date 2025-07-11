"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface Mentorship {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  mentor: {
    id: string;
    name: string;
    image: string | null;
    specialties: string[];
    rating: number;
  };
  conversations: {
    id: string;
    topic: string;
    lastActivity: string;
    unreadCount: number;
  }[];
}

export default function MentorshipDashboardPage() {
  const { data: session, status } = useSession();
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch mentorships data
  useEffect(() => {
    const fetchMentorships = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/mentorships');
        
        if (!response.ok) {
          throw new Error('Failed to fetch mentorships');
        }
        
        const data = await response.json();
        setMentorships(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching mentorships:', err);
        setError('Failed to load mentorships. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchMentorships();
    } else if (status === 'unauthenticated') {
      setError('Please sign in to view your mentorships');
      setIsLoading(false);
    }
  }, [session, status]);
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    let color = 'gray';
    
    switch (status) {
      case 'ACTIVE':
        color = 'green';
        break;
      case 'PENDING':
        color = 'yellow';
        break;
      case 'COMPLETED':
        color = 'blue';
        break;
      case 'DECLINED':
      case 'CANCELLED':
        color = 'red';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Mentorships</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Mentorships</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p>{error}</p>
          {status === 'unauthenticated' && (
            <Link href="/login?callbackUrl=/mentorship" className="mt-2 inline-block text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5">
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Mentorships</h1>
        <Link 
          href="/mentors"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Find a Mentor
        </Link>
      </div>
      
      {mentorships.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No mentorships yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by finding a mentor to help with your learning journey.</p>
          <div className="mt-6">
            <Link 
              href="/mentors"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Mentors
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {mentorships.map((mentorship) => (
              <li key={mentorship.id} className="p-6 hover:bg-gray-50">
                <div className="md:flex md:items-center md:justify-between">
                  <div className="md:flex md:items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 mr-4 flex-shrink-0">
                      {mentorship.mentor.image ? (
                        <Image
                          src={mentorship.mentor.image}
                          alt={mentorship.mentor.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold text-lg">
                          {mentorship.mentor.name?.charAt(0) || 'M'}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Link href={`/mentorship/${mentorship.id}`} className="text-lg font-medium text-gray-900 hover:text-indigo-600">
                        {mentorship.mentor.name}
                      </Link>
                      <div className="mt-1 flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(mentorship.mentor.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-xs text-gray-600">{mentorship.mentor.rating.toFixed(1)}</span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {renderStatusBadge(mentorship.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:flex md:flex-col md:items-end">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Started:</span> {formatDate(mentorship.startDate) || 'Not started yet'}
                    </div>
                    {mentorship.status === 'ACTIVE' && (
                      <div className="mt-2 flex">
                        <Link 
                          href={`/mentorship/${mentorship.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-500 mr-4"
                        >
                          View Details
                        </Link>
                        <Link 
                          href={`/mentorship/${mentorship.id}/messages`}
                          className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
                        >
                          Messages
                          {mentorship.conversations.some(c => c.unreadCount > 0) && (
                            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                              {mentorship.conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
                            </span>
                          )}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recent Conversations */}
                {mentorship.status === 'ACTIVE' && mentorship.conversations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500">Recent Conversations</h3>
                    <ul className="mt-2 divide-y divide-gray-200 border-t border-gray-200">
                      {mentorship.conversations.map(conversation => (
                        <li key={conversation.id} className="py-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <Link href={`/conversations/${conversation.id}`} className="text-sm text-gray-900 hover:text-indigo-600">
                              {conversation.topic || 'General Discussion'}
                            </Link>
                          </div>
                          <div className="flex items-center">
                            {conversation.unreadCount > 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white mr-2">
                                {conversation.unreadCount}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(conversation.lastActivity).toLocaleDateString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Specialties */}
                <div className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {mentorship.mentor.specialties.map(specialty => (
                      <span 
                        key={specialty} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
