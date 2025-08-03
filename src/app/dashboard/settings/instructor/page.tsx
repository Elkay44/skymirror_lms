"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Save, BookOpen } from 'lucide-react';

export default function InstructorSettings() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [teachingDetails, setTeachingDetails] = useState({
    expertise: '',
    yearsOfExperience: '',
    teachingPhilosophy: '',
    credentials: '',
    preferredCommunicationMethod: 'email',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/profile/instructor');
        
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
        
        // Populate teaching details (if they exist)
        if (data.instructorProfile) {
          setTeachingDetails({
            expertise: data.instructorProfile.expertise || '',
            yearsOfExperience: data.instructorProfile.yearsOfExperience || '',
            teachingPhilosophy: data.instructorProfile.teachingPhilosophy || '',
            credentials: data.instructorProfile.credentials || '',
            preferredCommunicationMethod: data.instructorProfile.preferredCommunicationMethod || 'email',
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
      const response = await fetch('/api/profile/instructor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          bio,
          location,
          instructorProfile: {
            expertise: teachingDetails.expertise,
            yearsOfExperience: teachingDetails.yearsOfExperience,
            teachingPhilosophy: teachingDetails.teachingPhilosophy,
            credentials: teachingDetails.credentials,
            preferredCommunicationMethod: teachingDetails.preferredCommunicationMethod,
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>

      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Tell students about your professional background"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="City, Country"
            />
          </div>

          <div>
            <label htmlFor="profile-image" className="block text-sm font-medium text-gray-700">
              Profile Image URL
            </label>
            <input
              type="text"
              id="profile-image"
              value={image || ''}
              onChange={(e) => setImage(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="pt-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-purple-500" />
            Teaching Profile
          </h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">
                Areas of Expertise
              </label>
              <input
                type="text"
                id="expertise"
                value={teachingDetails.expertise}
                onChange={(e) => setTeachingDetails({
                  ...teachingDetails,
                  expertise: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="e.g. Machine Learning, Web Development"
              />
            </div>

            <div>
              <label htmlFor="years-experience" className="block text-sm font-medium text-gray-700">
                Years of Teaching Experience
              </label>
              <input
                type="number"
                id="years-experience"
                value={teachingDetails.yearsOfExperience}
                onChange={(e) => setTeachingDetails({
                  ...teachingDetails,
                  yearsOfExperience: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                min="0"
                placeholder="e.g. 5"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="teaching-philosophy" className="block text-sm font-medium text-gray-700">
                Teaching Philosophy
              </label>
              <textarea
                id="teaching-philosophy"
                value={teachingDetails.teachingPhilosophy}
                onChange={(e) => setTeachingDetails({
                  ...teachingDetails,
                  teachingPhilosophy: e.target.value
                })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Share your approach to teaching and education"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="credentials" className="block text-sm font-medium text-gray-700">
                Credentials & Certifications
              </label>
              <textarea
                id="credentials"
                value={teachingDetails.credentials}
                onChange={(e) => setTeachingDetails({
                  ...teachingDetails,
                  credentials: e.target.value
                })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="List your relevant credentials, degrees, and certifications"
              />
            </div>

            <div>
              <label htmlFor="communication-preference" className="block text-sm font-medium text-gray-700">
                Preferred Communication Method
              </label>
              <select
                id="communication-preference"
                value={teachingDetails.preferredCommunicationMethod}
                onChange={(e) => setTeachingDetails({
                  ...teachingDetails,
                  preferredCommunicationMethod: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="email">Email</option>
                <option value="messaging">In-platform Messaging</option>
                <option value="video">Video Calls</option>
                <option value="office-hours">Virtual Office Hours</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
