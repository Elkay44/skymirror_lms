"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  UserCircle, 
  Calendar, 
  Award, 
  Users, 
  Edit,
  Mail,
  Briefcase,
  Clock,
  MessageSquare,
  Heart,
  CreditCard,
  CheckSquare,
  Star,
  MapPin,
  CalendarDays,
  Sparkles,
  Compass,
  GraduationCap,
  Handshake,
  BadgeCheck
} from 'lucide-react';

import ProfileLayout from '@/components/profile/ProfileLayout';

interface MentorProfile {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string | null;
  experience: string | null;
  availability: string | null;
  hourlyRate: number | null;
  isActive: boolean;
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
  mentorProfile: MentorProfile | null;
  activeStudents: number;
  totalSessions: number;
  averageRating: number;
}

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export default function MentorProfilePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile/mentor');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setUserData(data);
        
        // Parse availability from JSON string
        if (data.mentorProfile?.availability) {
          try {
            const parsedAvailability = JSON.parse(data.mentorProfile.availability);
            setAvailabilitySlots(parsedAvailability);
          } catch (e) {
            console.error('Error parsing availability JSON:', e);
            setAvailabilitySlots([]);
          }
        } else {
          // Initialize with some default slots for display
          setAvailabilitySlots([
            { day: 'Monday', startTime: '09:00', endTime: '17:00' },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Friday', startTime: '09:00', endTime: '17:00' }
          ]);
        }
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
        userRole="MENTOR"
        userName="Loading..."
        userEmail=""
        userImage={null}
        joinDate={new Date().toISOString()}
      >
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 rounded-full border-t-transparent"></div>
        </div>
      </ProfileLayout>
    );
  }

  if (!userData) {
    return (
      <ProfileLayout
        userRole="MENTOR"
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
      userRole="MENTOR"
      userName={userData.name}
      userEmail={userData.email}
      userImage={userData.image}
      joinDate={userData.id ? new Date(parseInt(userData.id.substring(0, 8), 16) * 1000).toISOString() : new Date().toISOString()}
    >
      {/* Main Profile Content */}
      <div className="divide-y divide-gray-100">
        {/* Profile Overview Section */}
        <section className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserCircle className="mr-2 h-6 w-6 text-teal-600" />
              Mentor Profile
            </h1>
            <a
              href="/dashboard/settings/mentor"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <Edit className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
              Edit Profile
            </a>
          </div>

          {/* Bio & Location Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {/* Bio Section */}
              <div className="p-6 md:col-span-2">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <UserCircle className="mr-2 h-5 w-5 text-teal-500" />
                  About Me
                </h3>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {userData.bio ? (
                    <p>{userData.bio}</p>
                  ) : (
                    <p className="italic text-gray-400">
                      No bio information provided. Tell mentees about yourself by updating your profile.
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
                  
                  {userData.mentorProfile?.hourlyRate && (
                    <div className="flex items-start">
                      <CreditCard className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-xs text-gray-500 mb-1">Hourly Rate</h4>
                        <p className="text-sm text-gray-900">${userData.mentorProfile.hourlyRate} USD</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-xs text-gray-500 mb-1">Joined</h4>
                      <p className="text-sm text-gray-900">
                        {userData.id ? 
                          new Date(parseInt(userData.id.substring(0, 8), 16) * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 
                          'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckSquare className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-xs text-gray-500 mb-1">Status</h4>
                      <p className="text-sm text-gray-900">
                        {userData.mentorProfile?.isActive ? 
                          'Accepting new mentees' : 
                          'Not accepting new mentees'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mentor Specialties Section */}
        <section className="p-4 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-teal-600" />
            Mentorship Focus
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Specialties Card */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-teal-800">Areas of Specialization</h3>
                <Compass className="h-6 w-6 text-teal-500 opacity-80" />
              </div>
              <div className="mt-2">
                {userData.mentorProfile?.specialties ? (
                  <p className="text-teal-700">{userData.mentorProfile.specialties}</p>
                ) : (
                  <p className="text-teal-600 opacity-70 italic">No specialties information provided</p>
                )}
              </div>
            </div>
            
            {/* Experience Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-6 border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-emerald-800">Professional Experience</h3>
                <Briefcase className="h-6 w-6 text-emerald-500 opacity-80" />
              </div>
              <div className="mt-2">
                {userData.mentorProfile?.experience ? (
                  <p className="text-emerald-700">{userData.mentorProfile.experience}</p>
                ) : (
                  <p className="text-emerald-600 opacity-70 italic">No experience information provided</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Availability Schedule Section */}
        <section className="p-4 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-teal-600" />
            Availability Schedule
          </h2>

          {availabilitySlots.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availabilitySlots.map((slot, index) => (
                    <div key={index} className="flex items-center p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                      <div className="mr-4 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{slot.day}</h4>
                        <p className="text-sm text-gray-600">{slot.startTime} - {slot.endTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-t border-teal-100">
                <p className="text-sm text-teal-700 flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Schedule a mentoring session during these availability windows
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Availability Set</h3>
              <p className="text-gray-500 mb-4">This mentor hasn't specified their availability yet.</p>
            </div>
          )}
        </section>

        {/* Mentoring Statistics Section */}
        <section className="p-4 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="mr-2 h-5 w-5 text-teal-600" />
            Mentoring Statistics
          </h2>

          <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 rounded-xl p-6 border border-teal-100 shadow-sm">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 text-teal-600 mb-2">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-teal-800">Experienced Mentor</h3>
              <div className="flex items-center justify-center mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.round(userData.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-teal-600 ml-2">{userData.averageRating?.toFixed(1) || '0.0'} rating</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-teal-600">{userData.activeStudents || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Active Mentees</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{userData.totalSessions || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Sessions Completed</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-cyan-600">
                  {userData.mentorProfile?.hourlyRate ? `$${userData.mentorProfile.hourlyRate}` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Hourly Rate (USD)</div>
              </div>
            </div>

            {/* Featured Testimonial */}
            <div className="border-t border-teal-100 pt-4">
              <h4 className="text-sm font-medium text-teal-800 mb-3">Success Stories</h4>
              {userData.totalSessions > 0 ? (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center mb-3">
                    <div className="mr-3 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm font-medium">JD</span>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium">Jane Doe</h5>
                      <div className="flex text-yellow-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    "Working with this mentor helped me advance my career and develop crucial skills. Their guidance was invaluable!"
                  </p>
                </div>
              ) : (
                <div className="flex items-center bg-white p-4 rounded-lg">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-teal-600" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">Start mentoring today</h5>
                    <p className="text-xs text-gray-500">Create impact by guiding the next generation of professionals</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </ProfileLayout>
  );
}
