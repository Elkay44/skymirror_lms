"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

interface MentorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  specialties: string[];
  yearsExperience: number;
  availableHours: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  stats: {
    menteeCount: number;
    careerPathsCount: number;
    reviewCount: number;
  };
  activeMentees: {
    mentorshipId: string;
    name: string;
    image: string | null;
    startDate: string | null;
  }[];
  recentReviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }[];
  careerPaths: {
    id: string;
    name: string;
    description: string | null;
    estimatedTime: string | null;
    studentCount: number;
  }[];
  currentMentorship?: {
    id: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
  } | null;
}

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingMentorship, setRequestingMentorship] = useState(false);
  const [mentorshipNote, setMentorshipNote] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  
  // Fetch mentor profile data
  useEffect(() => {
    const fetchMentorProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/mentors/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Mentor not found');
          } else {
            throw new Error('Failed to fetch mentor profile');
          }
        }
        
        const data = await response.json();
        setMentor(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching mentor profile:', err);
        setError(err.message || 'Failed to load mentor profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session && params.id) {
      fetchMentorProfile();
    } else if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/mentors/${params.id}`);
    }
  }, [params.id, session, status, router]);
  
  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  // Handle mentorship request
  const handleRequestMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/mentorships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorId: mentor?.id,
          notes: mentorshipNote,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request mentorship');
      }
      
      setRequestSuccess(true);
      setMentorshipNote('');
      setShowRequestForm(false);
      
      // If the mentor profile includes currentMentorship, update it
      if (mentor) {
        setMentor({
          ...mentor,
          currentMentorship: {
            id: data.mentorship.id,
            status: data.mentorship.status,
            startDate: data.mentorship.startDate,
            endDate: data.mentorship.endDate
          }
        });
      }
    } catch (err: any) {
      console.error('Error requesting mentorship:', err);
      setError(err.message || 'Failed to request mentorship');
    } finally {
      setSubmitting(false);
      setRequestingMentorship(false);
    }
  };
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>{error}</p>
          <Link href="/mentors" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
            ← Back to mentors
          </Link>
        </div>
      </div>
    );
  }
  
  if (!mentor) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/mentors" className="text-indigo-600 hover:text-indigo-700 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to mentors
        </Link>
      </div>
      
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="md:flex">
          <div className="md:flex-shrink-0 p-6 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100">
              {mentor.image ? (
                <Image
                  src={mentor.image}
                  alt={mentor.name}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-4xl font-semibold">
                  {mentor.name?.charAt(0) || 'M'}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 md:p-8 md:flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{mentor.name}</h1>
                <div className="mt-1 flex items-center">
                  {renderStars(mentor.rating)}
                  <span className="ml-2 text-sm text-gray-500">{mentor.reviewCount} reviews</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                {mentor.currentMentorship ? (
                  <div className="bg-gray-100 rounded-md px-4 py-2">
                    <p className="text-sm font-medium">
                      Mentorship Status: 
                      <span className={`ml-1 ${mentor.currentMentorship.status === 'ACTIVE' ? 'text-green-600' : mentor.currentMentorship.status === 'PENDING' ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {mentor.currentMentorship.status.charAt(0) + mentor.currentMentorship.status.slice(1).toLowerCase()}
                      </span>
                    </p>
                    
                    {mentor.currentMentorship.status === 'PENDING' && (
                      <p className="text-xs text-gray-500 mt-1">Your request is being reviewed</p>
                    )}
                    
                    {mentor.currentMentorship.status === 'ACTIVE' && (
                      <Link 
                        href={`/mentorship/${mentor.currentMentorship.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                      >
                        View mentorship →
                      </Link>
                    )}
                  </div>
                ) : (
                  mentor.isAvailable ? (
                    <button
                      onClick={() => setShowRequestForm(!showRequestForm)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Request Mentorship
                    </button>
                  ) : (
                    <span className="inline-block px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-50">
                      Currently Unavailable
                    </span>
                  )
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {mentor.specialties.map(specialty => (
                  <span 
                    key={specialty} 
                    className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {specialty}
                  </span>
                ))}
                {mentor.specialties.length === 0 && (
                  <span className="text-sm text-gray-500">No specialties listed</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{mentor.stats.menteeCount}</p>
                <p className="text-xs text-gray-500">Active Mentees</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{mentor.yearsExperience}</p>
                <p className="text-xs text-gray-500">Years Experience</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{mentor.availableHours}</p>
                <p className="text-xs text-gray-500">Hours Available/Week</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{mentor.stats.careerPathsCount}</p>
                <p className="text-xs text-gray-500">Career Paths</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h2>
              <p className="text-gray-600">{mentor.bio || 'No bio information available.'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mentorship Request Form */}
      {showRequestForm && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Request Mentorship</h2>
            <form onSubmit={handleRequestMentorship}>
              <div className="mb-4">
                <label htmlFor="mentorshipNote" className="block text-sm font-medium text-gray-700 mb-1">
                  Introduction Message (Optional)
                </label>
                <textarea
                  id="mentorshipNote"
                  rows={4}
                  value={mentorshipNote}
                  onChange={(e) => setMentorshipNote(e.target.value)}
                  placeholder="Introduce yourself and explain what you're hoping to learn from this mentor..."
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {requestSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-8">
          <p className="font-medium">Mentorship request sent successfully!</p>
          <p className="mt-1 text-sm">Your request has been sent to {mentor.name}. You'll receive a notification when they respond.</p>
        </div>
      )}
      
      {/* Two Column Layout for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Career Paths */}
          {mentor.careerPaths && mentor.careerPaths.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Career Paths</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {mentor.careerPaths.map(path => (
                    <div key={path.id} className="border rounded-lg p-4 hover:border-indigo-200 transition-colors">
                      <h3 className="text-lg font-medium text-gray-900">{path.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{path.description}</p>
                      <div className="mt-3 flex items-center text-sm text-gray-500 space-x-4">
                        {path.estimatedTime && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {path.estimatedTime}
                          </span>
                        )}
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {path.studentCount} students
                        </span>
                      </div>
                      <div className="mt-4">
                        <Link 
                          href={`/career-paths/${path.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View Career Path →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Reviews */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Reviews</h2>
            </div>
            <div className="p-6">
              {mentor.recentReviews && mentor.recentReviews.length > 0 ? (
                <div className="space-y-6">
                  {mentor.recentReviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{review.comment || 'No comment provided.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          {/* Active Mentees */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Active Mentees</h2>
            </div>
            <div className="p-6">
              {mentor.activeMentees && mentor.activeMentees.length > 0 ? (
                <div className="space-y-4">
                  {mentor.activeMentees.map(mentee => (
                    <div key={mentee.mentorshipId} className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 mr-3">
                        {mentee.image ? (
                          <Image
                            src={mentee.image}
                            alt={mentee.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold">
                            {mentee.name?.charAt(0) || 'S'}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{mentee.name}</h3>
                        {mentee.startDate && (
                          <p className="text-xs text-gray-500">
                            Since {new Date(mentee.startDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No active mentees at the moment.</p>
              )}
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Contact</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                To contact this mentor, please request mentorship first. Once your request is accepted, you'll be able to message them directly.
              </p>
              
              {mentor.currentMentorship && mentor.currentMentorship.status === 'ACTIVE' && (
                <Link 
                  href={`/mentorship/${mentor.currentMentorship.id}/messages`}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Send Message
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
