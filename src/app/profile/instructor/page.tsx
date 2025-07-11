"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  UserCircle, 
  BookOpen, 
  Award, 
  Users, 
  Edit,
  Mail,
  Briefcase,
  GraduationCap,
  Star,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  Library,
  BookCheck,
  Medal,
  School
} from 'lucide-react';

import ProfileLayout from '@/components/profile/ProfileLayout';

interface UserData {
  id: string | number;
  name: string;
  email: string;
  image: string | null;
  role: string;
  points: number;
  level: number;
  bio: string | null;
  location: string | null;
  expertise: string | null;
  yearsOfExperience: number | null;
  education: string | null;
  teachingPhilosophy: string | null;
  courseCount: number;
  totalStudents: number;
  averageRating: number;
}

export default function InstructorProfilePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile/instructor');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return (
      <ProfileLayout
        userRole="INSTRUCTOR"
        userName="Loading..."
        userEmail=""
        userImage={null}
        joinDate={new Date().toISOString()}
      >
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 rounded-full border-t-transparent"></div>
        </div>
      </ProfileLayout>
    );
  }

  if (!userData) {
    return (
      <ProfileLayout
        userRole="INSTRUCTOR"
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
      userRole="INSTRUCTOR"
      userName={userData.name}
      userEmail={userData.email}
      userImage={userData.image}
      joinDate={userData.id ? 
        new Date(
          typeof userData.id === 'string' ? 
          parseInt(userData.id.substring(0, 8), 16) * 1000 : 
          userData.id
        ).toISOString() : 
        new Date().toISOString()}
    >
      {/* Main Profile Content */}
      <div className="divide-y divide-gray-100">
        {/* Profile Overview Section */}
        <section className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserCircle className="mr-2 h-6 w-6 text-purple-600" />
              Instructor Profile
            </h1>
            <a
              href="/dashboard/settings/instructor"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Edit className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
              Edit Profile
            </a>
          </div>

          {/* Bio & Location Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {/* Bio Section */}
              <div className="p-6 md:col-span-2">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <UserCircle className="mr-2 h-5 w-5 text-purple-500" />
                  About Me
                </h3>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {userData.bio ? (
                    <p>{userData.bio}</p>
                  ) : (
                    <p className="italic text-gray-400">
                      No bio information provided. Tell students about yourself by updating your profile.
                    </p>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-4">Details</h3>
                <div className="space-y-3">
                  {userData.location && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-xs text-gray-500 mb-1">Location</h4>
                        <p className="text-sm text-gray-900">{userData.location}</p>
                      </div>
                    </div>
                  )}
                  
                  {userData.yearsOfExperience && (
                    <div className="flex items-start">
                      <Briefcase className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-xs text-gray-500 mb-1">Years of Experience</h4>
                        <p className="text-sm text-gray-900">{userData.yearsOfExperience} years</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-xs text-gray-500 mb-1">Joined</h4>
                      <p className="text-sm text-gray-900">
                        {userData.id ? 
                          new Date(
                            typeof userData.id === 'string' ? 
                            parseInt(userData.id.substring(0, 8), 16) * 1000 : 
                            userData.id
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 
                          'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instructor Qualifications Section */}
        <section className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <GraduationCap className="mr-2 h-5 w-5 text-purple-600" />
            Expertise & Qualifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expertise Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-purple-800">Areas of Expertise</h3>
                <Sparkles className="h-6 w-6 text-purple-500 opacity-80" />
              </div>
              <div className="mt-2">
                {userData.expertise ? (
                  <p className="text-purple-700">{userData.expertise}</p>
                ) : (
                  <p className="text-purple-600 opacity-70 italic">No expertise information provided</p>
                )}
              </div>
            </div>
            
            {/* Education Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-indigo-800">Education & Credentials</h3>
                <GraduationCap className="h-6 w-6 text-indigo-500 opacity-80" />
              </div>
              <div className="mt-2">
                {userData.education ? (
                  <p className="text-indigo-700">{userData.education}</p>
                ) : (
                  <p className="text-indigo-600 opacity-70 italic">No education information provided</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Teaching Philosophy */}
          <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <School className="mr-2 h-5 w-5 text-purple-500" />
                Teaching Philosophy
              </h3>
              <div className="prose prose-sm max-w-none text-gray-600 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                {userData.teachingPhilosophy ? (
                  <p className="italic">{userData.teachingPhilosophy}</p>
                ) : (
                  <p className="italic text-gray-400">
                    Share your teaching philosophy to help students understand your approach.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Teaching Statistics Section */}
        <section className="p-4 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Layers className="mr-2 h-5 w-5 text-purple-600" />
            Teaching Statistics
          </h2>

          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-violet-50 rounded-xl p-6 border border-purple-100 shadow-sm">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 text-purple-600 mb-2">
                <Medal className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-purple-800">Distinguished Instructor</h3>
              <div className="flex items-center justify-center mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.round(userData.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-purple-600 ml-2">{userData.averageRating?.toFixed(1) || '0.0'} rating</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{userData.courseCount || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Courses Created</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{userData.totalStudents || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Total Students</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-violet-600">{userData.yearsOfExperience || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Years Teaching</div>
              </div>
            </div>

            {/* Popular Courses Preview */}
            <div className="border-t border-purple-100 pt-4">
              <h4 className="text-sm font-medium text-purple-800 mb-3">Top Courses</h4>
              <div className="grid grid-cols-1 gap-3">
                {/* Show a placeholder if no courses */}
                <div className="flex items-center bg-white p-3 rounded-lg">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <BookCheck className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium">Start creating your first course</h5>
                    <p className="text-xs text-gray-500">Share your knowledge with eager students</p>
                  </div>
                  <div className="ml-4">
                    <a href="/dashboard/instructor/courses/create" className="text-xs font-medium text-purple-600 hover:text-purple-800">
                      Create Now →
                    </a>
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
