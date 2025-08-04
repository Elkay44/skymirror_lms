"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Save, UserCircle, Calendar, Clock, DollarSign } from 'lucide-react';

export default function MentorSettings() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [mentorDetails, setMentorDetails] = useState({
    specialties: '',
    yearsOfExperience: '',
    mentorshipPhilosophy: '',
    credentials: '',
    hourlyRate: '',
    availabilityPreference: 'weekdays',
    sessionDuration: '60',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/profile/mentor');
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        
        // Populate form values
        setName(data.name || '');
        setEmail(data.email || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setImage(data.image);
        
        // Populate mentor details (if they exist)
        if (data.mentorProfile) {
          setMentorDetails({
            specialties: data.mentorProfile.specialties || '',
            yearsOfExperience: data.mentorProfile.yearsOfExperience || '',
            mentorshipPhilosophy: data.mentorProfile.mentorshipPhilosophy || '',
            credentials: data.mentorProfile.credentials || '',
            hourlyRate: data.mentorProfile.hourlyRate || '',
            availabilityPreference: data.mentorProfile.availabilityPreference || 'weekdays',
            sessionDuration: data.mentorProfile.sessionDuration || '60',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/profile/mentor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          bio,
          location,
          mentorProfile: {
            specialties: mentorDetails.specialties,
            yearsOfExperience: mentorDetails.yearsOfExperience,
            mentorshipPhilosophy: mentorDetails.mentorshipPhilosophy,
            credentials: mentorDetails.credentials,
            hourlyRate: mentorDetails.hourlyRate,
            availabilityPreference: mentorDetails.availabilityPreference,
            sessionDuration: mentorDetails.sessionDuration,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Update the session
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          email,
          image,
        },
      });
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update settings');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 min-w-0">
        <div className="animate-spin h-8 w-8 border-4 border-teal-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>

      
      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 break-words">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 break-words">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 break-words">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              placeholder="Tell mentees about your professional experience and background"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 break-words">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              placeholder="City, Country"
            />
          </div>

          <div>
            <label htmlFor="profile-image" className="block text-sm font-medium text-gray-700 break-words">
              Profile Image URL
            </label>
            <input
              type="text"
              id="profile-image"
              value={image || ''}
              onChange={(e) => setImage(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="pt-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center break-words min-w-0">
            <UserCircle className="mr-2 h-5 w-5 text-teal-500" />
            Mentorship Profile
          </h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 break-words">
                Areas of Specialization
              </label>
              <input
                type="text"
                id="specialties"
                value={mentorDetails.specialties}
                onChange={(e) => setMentorDetails({
                  ...mentorDetails,
                  specialties: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
                placeholder="e.g. Career Guidance, Technical Leadership"
              />
            </div>

            <div>
              <label htmlFor="years-experience" className="block text-sm font-medium text-gray-700 break-words">
                Years of Industry Experience
              </label>
              <input
                type="number"
                id="years-experience"
                value={mentorDetails.yearsOfExperience}
                onChange={(e) => setMentorDetails({
                  ...mentorDetails,
                  yearsOfExperience: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
                min="0"
                placeholder="e.g. 10"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="mentorship-philosophy" className="block text-sm font-medium text-gray-700 break-words">
                Mentorship Philosophy
              </label>
              <textarea
                id="mentorship-philosophy"
                value={mentorDetails.mentorshipPhilosophy}
                onChange={(e) => setMentorDetails({
                  ...mentorDetails,
                  mentorshipPhilosophy: e.target.value
                })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
                placeholder="Share your approach to mentorship and what mentees can expect"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="credentials" className="block text-sm font-medium text-gray-700 break-words">
                Credentials & Relevant Experience
              </label>
              <textarea
                id="credentials"
                value={mentorDetails.credentials}
                onChange={(e) => setMentorDetails({
                  ...mentorDetails,
                  credentials: e.target.value
                })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
                placeholder="List your relevant credentials, positions, and achievements"
              />
            </div>
          </div>
        </div>

        <div className="pt-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center break-words min-w-0">
            <Calendar className="mr-2 h-5 w-5 text-teal-500" />
            Session Preferences
          </h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hourly-rate" className="block text-sm font-medium text-gray-700 break-words">
                Hourly Rate (USD)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="hourly-rate"
                  value={mentorDetails.hourlyRate}
                  onChange={(e) => setMentorDetails({
                    ...mentorDetails,
                    hourlyRate: e.target.value
                  })}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
                  placeholder="e.g. 75"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="availability-preference" className="block text-sm font-medium text-gray-700 break-words">
                Availability Preference
              </label>
              <select
                id="availability-preference"
                value={mentorDetails.availabilityPreference}
                onChange={(e) => setMentorDetails({
                  ...mentorDetails,
                  availabilityPreference: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              >
                <option value="weekdays">Weekdays Only</option>
                <option value="weekends">Weekends Only</option>
                <option value="evenings">Evenings Only</option>
                <option value="mornings">Mornings Only</option>
                <option value="flexible">Flexible Schedule</option>
              </select>
            </div>

            <div>
              <label htmlFor="session-duration" className="block text-sm font-medium text-gray-700 break-words">
                Preferred Session Duration (minutes)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="session-duration"
                  value={mentorDetails.sessionDuration}
                  onChange={(e) => setMentorDetails({
                    ...mentorDetails,
                    sessionDuration: e.target.value
                  })}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end min-w-0">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
