"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Save } from 'lucide-react';

export default function StudentSettings() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [learningPreferences, setLearningPreferences] = useState({
    preferredLearningStyle: '',
    courseDifficulty: 'intermediate',
    topicsOfInterest: '',
    studyReminderFrequency: 'daily',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/profile/student');
        
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
        
        // Populate learning preferences (if they exist)
        if (data.studentProfile) {
          setLearningPreferences({
            preferredLearningStyle: data.studentProfile.preferredLearningStyle || '',
            courseDifficulty: data.studentProfile.courseDifficulty || 'intermediate',
            topicsOfInterest: data.studentProfile.interests || '',
            studyReminderFrequency: data.studentProfile.studyReminderFrequency || 'daily',
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
      const response = await fetch('/api/profile/student', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          bio,
          location,
          studentProfile: {
            interests: learningPreferences.topicsOfInterest,
            preferredLearningStyle: learningPreferences.preferredLearningStyle,
            courseDifficulty: learningPreferences.courseDifficulty,
            studyReminderFrequency: learningPreferences.studyReminderFrequency,
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
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
              placeholder="Tell us a bit about yourself"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="pt-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4 break-words">Learning Preferences</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="learning-style" className="block text-sm font-medium text-gray-700 break-words">
                Preferred Learning Style
              </label>
              <select
                id="learning-style"
                value={learningPreferences.preferredLearningStyle}
                onChange={(e) => setLearningPreferences({
                  ...learningPreferences,
                  preferredLearningStyle: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
              >
                <option value="">Select a learning style</option>
                <option value="visual">Visual (learn by seeing)</option>
                <option value="auditory">Auditory (learn by hearing)</option>
                <option value="reading">Reading/Writing</option>
                <option value="kinesthetic">Kinesthetic (learn by doing)</option>
                <option value="mixed">Mixed (combination of styles)</option>
              </select>
            </div>

            <div>
              <label htmlFor="course-difficulty" className="block text-sm font-medium text-gray-700 break-words">
                Preferred Course Difficulty
              </label>
              <select
                id="course-difficulty"
                value={learningPreferences.courseDifficulty}
                onChange={(e) => setLearningPreferences({
                  ...learningPreferences,
                  courseDifficulty: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="topics-of-interest" className="block text-sm font-medium text-gray-700 break-words">
                Topics of Interest
              </label>
              <textarea
                id="topics-of-interest"
                value={learningPreferences.topicsOfInterest}
                onChange={(e) => setLearningPreferences({
                  ...learningPreferences,
                  topicsOfInterest: e.target.value
                })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
                placeholder="e.g. Web Development, Machine Learning, Digital Marketing"
              />
            </div>

            <div>
              <label htmlFor="study-reminder" className="block text-sm font-medium text-gray-700 break-words">
                Study Reminder Frequency
              </label>
              <select
                id="study-reminder"
                value={learningPreferences.studyReminderFrequency}
                onChange={(e) => setLearningPreferences({
                  ...learningPreferences,
                  studyReminderFrequency: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekly">Weekly</option>
                <option value="none">Don't Send Reminders</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end min-w-0">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 break-words min-w-0"
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
