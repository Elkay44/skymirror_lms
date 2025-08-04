"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  UserCircle, 
  Calendar, 
  Save,
  Edit,
  Mail,
  Briefcase,
  Clock,
  MessageSquare,
  Heart,
  CreditCard,
  Star,
  CheckSquare
} from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      // Don't try to fetch if no session exists
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching mentor profile data for:', session.user.email);
        const response = await fetch('/api/profile/mentor');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Mentor profile data received:', data);
        setUserData(data);
        
        // Initialize form values with fallbacks
        setName(data.name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setSpecialties(data.mentorProfile?.specialties || '');
        setExperience(data.mentorProfile?.experience || '');
        setHourlyRate(data.mentorProfile?.hourlyRate ? data.mentorProfile.hourlyRate.toString() : '');
        setIsActive(data.mentorProfile?.isActive ?? true);
        
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
          // Initialize with some default slots
          setAvailabilitySlots([
            { day: 'Monday', startTime: '09:00', endTime: '17:00' },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Friday', startTime: '09:00', endTime: '17:00' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching mentor profile:', error);
        toast.error('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  const addAvailabilitySlot = () => {
    setAvailabilitySlots([...availabilitySlots, { day: 'Monday', startTime: '09:00', endTime: '17:00' }]);
  };

  const removeAvailabilitySlot = (index: number) => {
    const newSlots = [...availabilitySlots];
    newSlots.splice(index, 1);
    setAvailabilitySlots(newSlots);
  };

  const updateAvailabilitySlot = (index: number, field: keyof AvailabilitySlot, value: string) => {
    const newSlots = [...availabilitySlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setAvailabilitySlots(newSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Serialize availability slots to JSON string
      const availabilityJson = JSON.stringify(availabilitySlots);
      
      const response = await fetch('/api/profile/mentor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bio,
          location,
          mentorProfile: {
            specialties,
            experience,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            availability: availabilityJson,
            isActive,
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
      <div className="p-8 flex justify-center items-center min-w-0">
        <div className="animate-spin h-8 w-8 border-4 border-teal-600 rounded-full border-t-transparent"></div>
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
          <div className="bg-gradient-to-r from-teal-600 to-emerald-700 px-6 py-12 text-white relative">
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
                    alt={userData.name || 'Mentor'} 
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
                  <h3 className="text-lg font-medium text-gray-800 mb-3 break-words">Mentoring Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 mb-1 break-words">Specialties</label>
                      <textarea
                        id="specialties"
                        value={specialties}
                        onChange={(e) => setSpecialties(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="What are your areas of expertise?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1 break-words">Experience</label>
                      <textarea
                        id="experience"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Describe your relevant experience"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1 break-words">Hourly Rate (USD)</label>
                      <input
                        type="number"
                        id="hourlyRate"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 break-words">Accepting New Mentees</label>
                      <div className="flex items-center space-x-2 min-w-0">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="text-gray-700">Yes, I am accepting new mentees</label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-3 min-w-0">
                    <h3 className="text-lg font-medium text-gray-800 break-words">Availability Schedule</h3>
                    <button
                      type="button"
                      onClick={addAvailabilitySlot}
                      className="text-sm px-2 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 break-words"
                    >
                      + Add Slot
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {availabilitySlots.map((slot, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg min-w-0 flex-shrink-0">
                        <div className="w-full sm:w-auto">
                          <label className="text-xs text-gray-500 block sm:hidden">Day</label>
                          <select
                            value={slot.day}
                            onChange={(e) => updateAvailabilitySlot(index, 'day', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded w-full sm:w-auto"
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-full sm:w-auto">
                          <label className="text-xs text-gray-500 block sm:hidden">Start Time</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateAvailabilitySlot(index, 'startTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded w-full sm:w-auto"
                          />
                        </div>
                        
                        <div className="w-full sm:w-auto">
                          <label className="text-xs text-gray-500 block sm:hidden">End Time</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateAvailabilitySlot(index, 'endTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded w-full sm:w-auto"
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeAvailabilitySlot(index)}
                          className="ml-auto text-red-500 hover:text-red-700"
                          aria-label="Remove time slot"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
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
                    className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
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
                  <UserCircle className="w-5 h-5 mr-2 text-teal-600" />
                  About Me
                </h2>
                <p className="text-gray-600">
                  {userData.bio || "No bio information provided yet."}
                </p>
              </div>
              
              {/* Mentor Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-8">
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                  <h3 className="font-medium text-teal-800 mb-3 flex items-center break-words min-w-0">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Specialties
                  </h3>
                  <p className="text-teal-700">
                    {userData.mentorProfile?.specialties || "No specialties information provided yet."}
                  </p>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <h3 className="font-medium text-emerald-800 mb-3 flex items-center break-words min-w-0">
                    <Heart className="w-4 h-4 mr-2" />
                    Experience
                  </h3>
                  <p className="text-emerald-700">
                    {userData.mentorProfile?.experience || "No experience information provided yet."}
                  </p>
                </div>
                
                <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
                  <h3 className="font-medium text-cyan-800 mb-3 flex items-center break-words min-w-0">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Hourly Rate
                  </h3>
                  <p className="text-cyan-700">
                    {userData.mentorProfile?.hourlyRate ? `$${userData.mentorProfile.hourlyRate} USD per hour` : "No rate specified."}
                  </p>
                </div>
              </div>
              
              {/* Availability Schedule */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center break-words min-w-0">
                  <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                  Availability Schedule
                </h2>
                
                {availabilitySlots.length > 0 ? (
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-5 rounded-lg border border-teal-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availabilitySlots.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm min-w-0 overflow-hidden">
                          <Clock className="w-4 h-4 text-teal-500" />
                          <span className="font-medium text-gray-700 break-words">{slot.day}:</span>
                          <span className="text-gray-600">{slot.startTime} - {slot.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-500 italic">No availability schedule provided yet.</p>
                  </div>
                )}
              </div>
              
              {/* Mentoring Stats */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center break-words min-w-0">
                  <CheckSquare className="w-5 h-5 mr-2 text-teal-600" />
                  Mentoring Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-2xl font-bold text-teal-600 break-words">{userData.activeStudents || 0}</div>
                    <div className="text-xs text-gray-500">Active Mentees</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-2xl font-bold text-emerald-600 break-words">{userData.totalSessions || 0}</div>
                    <div className="text-xs text-gray-500">Total Sessions</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center min-w-0">
                      <span className="text-2xl font-bold text-yellow-500 break-words">{userData.averageRating?.toFixed(1) || '0.0'}</span>
                      <Star className="w-5 h-5 text-yellow-500 ml-1" fill="currentColor" />
                    </div>
                    <div className="text-xs text-gray-500">Average Rating</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="text-2xl font-bold text-cyan-600 break-words">{userData.mentorProfile?.isActive ? 'Yes' : 'No'}</div>
                    <div className="text-xs text-gray-500">Accepting Mentees</div>
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
