"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  UserCircle, 
  BookOpen, 
  Save,
  Edit,
  Mail,
  Briefcase,
  GraduationCap,
  Star,
  Layers
} from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [expertise, setExpertise] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [education, setEducation] = useState('');
  const [teachingPhilosophy, setTeachingPhilosophy] = useState('');
  
  useEffect(() => {
    const fetchUserData = async () => {
      // Don't try to fetch if no session exists
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching instructor profile data for:', session.user.email);
        const response = await fetch('/api/profile/instructor');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Instructor profile data received:', data);
        setUserData(data);
        
        // Initialize form values with fallbacks
        setName(data.name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setExpertise(data.expertise || '');
        setYearsOfExperience(data.yearsOfExperience ? data.yearsOfExperience.toString() : '');
        setEducation(data.education || '');
        setTeachingPhilosophy(data.teachingPhilosophy || '');
      } catch (error) {
        console.error('Error fetching instructor profile:', error);
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
      const response = await fetch('/api/profile/instructor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bio,
          location,
          expertise,
          yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
          education,
          teachingPhilosophy,
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
      <div className="p-8 flex justify-center items-center min-w-0">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-8">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h2 className="text-red-800 font-medium break-words">Profile Not Found</h2>
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-12 text-white relative">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors overflow-hidden flex-shrink-0"
              aria-label={isEditing ? "Cancel editing" : "Edit profile"}
            >
              {isEditing ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            </button>
            
            <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6 min-w-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center min-w-0">
                {userData.image ? (
                  <Image 
                    src={userData.image} 
                    alt={userData.name || 'Instructor'} 
                    width={96} 
                    height={96} 
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  <UserCircle className="h-16 w-16 text-white" />
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold mb-1 break-words">{userData.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm break-words min-w-0">
                  <div className="flex items-center min-w-0">
                    <Mail className="h-4 w-4 mr-1" />
                    {userData.email}
                  </div>
                  {userData.location && (
                    <div className="flex items-center min-w-0">
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
            <div className="p-4 lg:p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 break-words">Edit Your Profile</h2>
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 break-words">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1 break-words">Bio</label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1 break-words">Location</label>
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
                  <h3 className="text-lg font-medium text-gray-800 mb-3 break-words">Teaching Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="expertise" className="block text-sm font-medium text-gray-700 mb-1 break-words">Areas of Expertise</label>
                      <textarea
                        id="expertise"
                        value={expertise}
                        onChange={(e) => setExpertise(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="What are your areas of expertise?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1 break-words">Education Background</label>
                      <textarea
                        id="education"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="What is your educational background?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1 break-words">Years of Experience</label>
                      <input
                        type="number"
                        id="yearsOfExperience"
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="teachingPhilosophy" className="block text-sm font-medium text-gray-700 mb-1 break-words">Teaching Philosophy</label>
                      <textarea
                        id="teachingPhilosophy"
                        value={teachingPhilosophy}
                        onChange={(e) => setTeachingPhilosophy(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="What is your approach to teaching?"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4 lg:p-6">
              {/* Bio section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center break-words min-w-0">
                  <UserCircle className="w-5 h-5 mr-2 text-purple-600" />
                  About Me
                </h2>
                <p className="text-gray-600">
                  {userData.bio || "No bio information provided yet."}
                </p>
              </div>
              
              {/* Instructor Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-8">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="font-medium text-purple-800 mb-3 flex items-center break-words min-w-0">
                    <Star className="w-4 h-4 mr-2" />
                    Areas of Expertise
                  </h3>
                  <p className="text-purple-700">
                    {userData.expertise || "No expertise information provided yet."}
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <h3 className="font-medium text-indigo-800 mb-3 flex items-center break-words min-w-0">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Education
                  </h3>
                  <p className="text-indigo-700">
                    {userData.education || "No education information provided yet."}
                  </p>
                </div>
              </div>
              
              {/* Teaching Philosophy */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center break-words min-w-0">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                  Teaching Philosophy
                </h2>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-lg border border-purple-100">
                  <p className="text-gray-700 italic">
                    {userData.teachingPhilosophy || "No teaching philosophy provided yet."}
                  </p>
                </div>
              </div>
              
              {/* Teaching Stats */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center break-words min-w-0">
                  <Layers className="w-5 h-5 mr-2 text-purple-600" />
                  Teaching Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-2xl font-bold text-purple-600 break-words">{userData.courseCount || 0}</div>
                    <div className="text-xs text-gray-500">Courses Created</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-2xl font-bold text-indigo-600 break-words">{userData.totalStudents || 0}</div>
                    <div className="text-xs text-gray-500">Total Students</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center min-w-0">
                      <span className="text-2xl font-bold text-yellow-500 break-words">{userData.averageRating?.toFixed(1) || '0.0'}</span>
                      <Star className="w-5 h-5 text-yellow-500 ml-1" fill="currentColor" />
                    </div>
                    <div className="text-xs text-gray-500">Average Rating</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-2xl font-bold text-green-600 break-words">{userData.yearsOfExperience || 0}</div>
                    <div className="text-xs text-gray-500">Years of Experience</div>
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
