"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  UserCircle, 
  BookOpen, 
  Award, 
  Target, 
  Lightbulb,
  Edit,
  MapPin,
  Calendar,
  BookmarkCheck,
  Trophy,
  BadgeCheck
} from 'lucide-react';

import ProfileLayout from '@/components/profile/ProfileLayout';

interface StudentProfile {
  id: string;
  userId: string;
  interests: string;
  goals: string;
  preferredLearningStyle: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  points: number;
  level: number;
  bio: string | null;
  location: string | null;
  studentProfile: StudentProfile | null;
}

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinDateStr, setJoinDateStr] = useState<string>(new Date().toISOString());
  
  // Safely extract date from user ID (handles various formats and types)
  const safelyExtractDateFromId = (id: any): string => {
    if (!id) return new Date().toISOString();
    
    try {
      // If id is a string and looks like a MongoDB ObjectId/CUID (24 hex chars)
      if (typeof id === 'string' && /^[0-9a-f]{24}$|^c[0-9a-zA-Z]{23}$/.test(id)) {
        // MongoDB ObjectId: first 4 bytes (8 hex chars) represent timestamp
        return new Date(parseInt(id.substring(0, 8), 16) * 1000).toISOString();
      } 
      // If id is a number, treat it as a timestamp
      else if (typeof id === 'number') {
        return new Date(id).toISOString();
      }
      // If id contains a UUID format string
      else if (typeof id === 'string' && id.includes('-')) {
        // UUIDs don't contain timestamps, use current date
        return new Date().toISOString();
      }
      // If id is a non-standard object with a toString method
      else if (id && typeof id.toString === 'function') {
        const idStr = id.toString();
        // If convertible to string and looks like hex, try parsing first 8 chars
        if (/^[0-9a-f]{8,}/.test(idStr)) {
          return new Date(parseInt(idStr.substring(0, 8), 16) * 1000).toISOString();
        }
      }
    } catch (e) {
      console.error('Error parsing ID for date:', e);
    }
    
    // Fallback to current date if all else fails
    return new Date().toISOString();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      // Don't try to fetch if no session exists
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching student profile data for:', session.user.email);
        const response = await fetch('/api/profile/student');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Student profile data received:', data);
        setUserData(data);
        
        // Safely extract and set join date
        if (data && data.id) {
          const extractedDate = safelyExtractDateFromId(data.id);
          setJoinDateStr(extractedDate);
          console.log('Parsed join date from ID:', extractedDate);
        }
      } catch (error) {
        console.error('Error fetching student profile:', error);
        toast.error('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  // Helper function to format learning style for display
  function formatLearningStyle(style: string): string {
    const styles: Record<string, string> = {
      visual: 'Visual (learn by seeing)',
      auditory: 'Auditory (learn by hearing)',
      reading: 'Reading/Writing (learn by reading and taking notes)',
      kinesthetic: 'Kinesthetic (learn by doing)',
      mixed: 'Mixed (combination of styles)'
    };
    
    return styles[style] || style;
  }

  if (loading) {
    return (
      <ProfileLayout
        userRole="STUDENT"
        userName="Loading..."
        userEmail=""
        userImage={null}
        joinDate={new Date().toISOString()}
      >
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div>
        </div>
      </ProfileLayout>
    );
  }

  if (!userData) {
    return (
      <ProfileLayout
        userRole="STUDENT"
        userName="Error"
        userEmail=""
        userImage={null}
        joinDate={new Date().toISOString()}
      >
        <div className="p-8">
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
            <h2 className="text-red-800 text-xl font-medium mb-2">Profile Not Found</h2>
            <p className="text-red-600 mb-4">We couldn't load your profile information.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </ProfileLayout>
    );
  }
  
  return (
    <ProfileLayout
      userRole="STUDENT"
      userName={userData?.name || 'Student'}
      userEmail={userData?.email || ''}
      userImage={userData?.image || null}
      joinDate={joinDateStr}
    >
      {/* Main Profile Content */}
      <div className="divide-y divide-gray-100">
        {/* Profile Overview Section */}
        <section className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserCircle className="mr-2 h-6 w-6 text-blue-600" />
              Profile Overview
            </h1>
            <a
              href="/dashboard/settings/student"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
              Edit Profile
            </a>
          </div>

          {/* Bio & Location Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {/* Bio Section */}
              <div className="p-6 md:col-span-2">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <UserCircle className="mr-2 h-5 w-5 text-blue-500" />
                  About Me
                </h3>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {userData?.bio ? (
                    <p>{userData?.bio}</p>
                  ) : (
                    <p className="italic text-gray-400">
                      No bio information provided. Tell others about yourself by updating your profile.
                    </p>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-4">Details</h3>
                <div className="space-y-3">
                  {userData?.location && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-xs text-gray-500 mb-1">Location</h4>
                        <p className="text-sm text-gray-900">{userData?.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-xs text-gray-500 mb-1">Joined</h4>
                      <p className="text-sm text-gray-900">
                        {new Date(joinDateStr).toLocaleDateString('en-US', {
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                          })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Preferences Section */}
        <section className="p-4 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-blue-600" />
            Learning Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Interests Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-800">Interests</h3>
                <Lightbulb className="h-6 w-6 text-blue-500 opacity-80" />
              </div>
              <div className="mt-2">
                {userData?.studentProfile?.interests ? (
                  <p className="text-blue-700">{userData?.studentProfile?.interests}</p>
                ) : (
                  <p className="text-blue-600 opacity-70 italic">No interests specified yet</p>
                )}
              </div>
            </div>
            
            {/* Learning Goals Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-indigo-800">Learning Goals</h3>
                <Target className="h-6 w-6 text-indigo-500 opacity-80" />
              </div>
              <div className="mt-2">
                {userData?.studentProfile?.goals ? (
                  <p className="text-indigo-700">{userData?.studentProfile?.goals}</p>
                ) : (
                  <p className="text-indigo-600 opacity-70 italic">No learning goals specified yet</p>
                )}
              </div>
            </div>
            
            {/* Learning Style Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-purple-800">Learning Style</h3>
                <BookOpen className="h-6 w-6 text-purple-500 opacity-80" />
              </div>
              <div className="mt-2">
                {userData?.studentProfile?.preferredLearningStyle ? (
                  <p className="text-purple-700">
                    {formatLearningStyle(userData?.studentProfile?.preferredLearningStyle || '')}
                  </p>
                ) : (
                  <p className="text-purple-600 opacity-70 italic">No learning style specified yet</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Progress & Achievements Section */}
        <section className="p-4 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="mr-2 h-5 w-5 text-blue-600" />
            Progress & Achievements
          </h2>

          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-2">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-blue-800">Level {userData?.level || 1} Student</h3>
              <p className="text-blue-600 mt-1">You've earned {userData?.points || 0} XP points</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{userData?.level || 1}</div>
                <div className="text-xs text-gray-500 mt-1">Current Level</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{userData?.points || 0}</div>
                <div className="text-xs text-gray-500 mt-1">XP Points</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-xs text-gray-500 mt-1">Certificates</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-gray-500 mt-1">Courses Completed</div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="border-t border-blue-100 pt-4">
              <h4 className="text-sm font-medium text-blue-800 mb-3">Recent Achievements</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center bg-white p-3 rounded-lg">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <BookmarkCheck className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">Getting Started</h5>
                    <p className="text-xs text-gray-500">Completed profile setup</p>
                  </div>
                </div>

                <div className="flex items-center bg-white p-3 rounded-lg">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <BadgeCheck className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">First Steps</h5>
                    <p className="text-xs text-gray-500">Joined the SkyMirror Academy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ProfileLayout>
  );
}
