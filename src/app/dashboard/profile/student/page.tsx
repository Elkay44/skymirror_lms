"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  UserCircle, 
  BookOpen, 
  Award, 
  Target, 
  Save,
  Edit,
  Mail,
  Briefcase,
  Lightbulb
} from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState('');
  const [goals, setGoals] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  
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
        
        // Initialize form values with fallbacks
        setName(data.name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setInterests(data.studentProfile?.interests || '');
        setGoals(data.studentProfile?.goals || '');
        setLearningStyle(data.studentProfile?.preferredLearningStyle || '');
      } catch (error) {
        console.error('Error fetching student profile:', error);
        toast.error('Failed to load profile data. Please try again later.');
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
          bio,
          location,
          studentProfile: {
            interests,
            goals,
            preferredLearningStyle: learningStyle,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedData = await response.json();
      setUserData(updatedData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-8">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h2 className="text-red-800 font-medium">Profile Not Found</h2>
          <p className="text-red-600 mt-1">Unable to load your profile information. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-12 text-white relative">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
              aria-label={isEditing ? "Cancel editing" : "Edit profile"}
            >
              {isEditing ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            </button>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center">
                {userData.image ? (
                  <Image 
                    src={userData.image} 
                    alt={userData.name || 'Student'} 
                    width={96} 
                    height={96} 
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  <UserCircle className="h-16 w-16 text-white" />
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{userData.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {userData.email}
                  </div>
                  {userData.location && (
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {userData.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile content */}
          {isEditing ? (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Your Profile</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Learning Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                      <textarea
                        id="interests"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="What topics are you interested in?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-1">Learning Goals</label>
                      <textarea
                        id="goals"
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="What do you want to achieve?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="learningStyle" className="block text-sm font-medium text-gray-700 mb-1">Learning Style</label>
                      <select
                        id="learningStyle"
                        value={learningStyle}
                        onChange={(e) => setLearningStyle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select your preferred learning style</option>
                        <option value="visual">Visual (learn by seeing)</option>
                        <option value="auditory">Auditory (learn by hearing)</option>
                        <option value="reading">Reading/Writing (learn by reading and taking notes)</option>
                        <option value="kinesthetic">Kinesthetic (learn by doing)</option>
                        <option value="mixed">Mixed (combination of styles)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6">
              {/* Bio section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <UserCircle className="w-5 h-5 mr-2 text-blue-600" />
                  About Me
                </h2>
                <p className="text-gray-600">
                  {userData.bio || "No bio information provided yet."}
                </p>
              </div>
              
              {/* Learning Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Interests
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {userData.studentProfile?.interests || "No interests specified yet."}
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <h3 className="font-medium text-indigo-800 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Learning Goals
                  </h3>
                  <p className="text-indigo-700 text-sm">
                    {userData.studentProfile?.goals || "No learning goals specified yet."}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="font-medium text-purple-800 mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Learning Style
                  </h3>
                  <p className="text-purple-700 text-sm">
                    {userData.studentProfile?.preferredLearningStyle 
                      ? formatLearningStyle(userData.studentProfile.preferredLearningStyle)
                      : "No learning style specified yet."}
                  </p>
                </div>
              </div>
              
              {/* Achievement Summary */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" />
                  Achievement Summary
                </h2>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-800 mb-2">
                    You're making great progress on your learning journey!
                  </p>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{userData.level}</div>
                      <div className="text-xs text-gray-500">Current Level</div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-indigo-600">{userData.points}</div>
                      <div className="text-xs text-gray-500">XP Points</div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-xs text-gray-500">Certificates</div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-xs text-gray-500">Completed Courses</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

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
