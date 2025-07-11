"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface Mentor {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  bio: string | null;
  specialties: string[];
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  stats: {
    menteeCount: number;
    careerPathsCount: number;
    reviewCount: number;
  };
}

export default function MentorsPage() {
  const { data: session, status } = useSession();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  // Fetch mentors data
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setIsLoading(true);
        let url = '/api/mentors';
        const params = new URLSearchParams();
        
        if (specialty) {
          params.append('specialty', specialty);
        }
        
        if (showAvailableOnly) {
          params.append('available', 'true');
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch mentors');
        }
        
        const data = await response.json();
        setMentors(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching mentors:', err);
        setError('Failed to load mentors. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchMentors();
    } else if (status === 'unauthenticated') {
      setError('Please sign in to view available mentors');
      setIsLoading(false);
    }
  }, [session, status, specialty, showAvailableOnly]);
  
  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)} ({mentors.length > 0 ? mentors[0].reviewCount : 0})</span>
      </div>
    );
  };
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Find a Mentor</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Find a Mentor</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p>{error}</p>
          {status === 'unauthenticated' && (
            <Link href="/login?callbackUrl=/mentors" className="mt-2 inline-block text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5">
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  // Sample specialty options for the filter
  const specialtyOptions = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'UX/UI Design',
    'DevOps',
    'Cloud Computing',
    'Cybersecurity'
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Find a Mentor</h1>
      <p className="text-gray-600 mb-8">Connect with experienced mentors to guide your learning journey</p>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Filter Mentors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
            <select
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Specialties</option>
              {specialtyOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="availableOnly"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="availableOnly" className="ml-2 block text-sm text-gray-700">
              Show available mentors only
            </label>
          </div>
        </div>
      </div>
      
      {/* Mentors Grid */}
      {mentors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No mentors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map(mentor => (
            <div key={mentor.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 mr-4">
                    {mentor.image ? (
                      <Image
                        src={mentor.image}
                        alt={mentor.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold text-lg">
                        {mentor.name?.charAt(0) || 'M'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
                    {renderStars(mentor.rating)}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{mentor.bio || 'No bio available'}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-1">
                    {mentor.specialties.map(specialty => (
                      <span 
                        key={specialty} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {specialty}
                      </span>
                    ))}
                    {mentor.specialties.length === 0 && (
                      <span className="text-sm text-gray-500">No specialties listed</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{mentor.stats.menteeCount}</p>
                    <p className="text-xs text-gray-500">Mentees</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{mentor.yearsExperience}</p>
                    <p className="text-xs text-gray-500">Years Exp.</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{mentor.stats.reviewCount}</p>
                    <p className="text-xs text-gray-500">Reviews</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Link 
                    href={`/mentors/${mentor.id}`}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Become a Mentor CTA */}
      {session?.user?.role === 'INSTRUCTOR' && (
        <div className="mt-12 bg-indigo-50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Want to become a mentor?</h2>
          <p className="text-gray-600 mb-4">Share your knowledge and help others grow in their career</p>
          <Link 
            href="/mentorship/become-mentor"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Become a Mentor
          </Link>
        </div>
      )}
    </div>
  );
}
