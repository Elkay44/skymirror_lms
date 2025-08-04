"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Video,
  User,
  FileText,
  ChevronLeft,
  Check
} from 'lucide-react';

interface Mentee {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface SessionType {
  id: string;
  name: string;
  description: string;
  icon: 'video' | 'message' | 'user';
  duration: number;
}

export default function ScheduleSessionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Form state
  const [selectedMentee, setSelectedMentee] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>('');
  const [sessionTime, setSessionTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<string>('ONE_ON_ONE');
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Data state
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Available session types
  const sessionTypes: SessionType[] = [
    {
      id: 'ONE_ON_ONE',
      name: 'One-on-One Meeting',
      description: 'Personal guidance and feedback session',
      icon: 'user',
      duration: 45
    },
    {
      id: 'CAREER_PLANNING',
      name: 'Career Planning',
      description: 'Long-term career strategy and goal setting',
      icon: 'user',
      duration: 60
    },
    {
      id: 'PROJECT_REVIEW',
      name: 'Project Review',
      description: 'Detailed review of assignments or projects',
      icon: 'video',
      duration: 30
    },
    {
      id: 'GENERAL_GUIDANCE',
      name: 'General Guidance',
      description: 'Quick check-in and general guidance',
      icon: 'message',
      duration: 20
    }
  ];
  
  // Fetch mentees data
  useEffect(() => {
    const fetchMentees = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/mentees');
        
        if (!response.ok) {
          throw new Error('Failed to fetch mentees');
        }
        
        const data = await response.json();
        setMentees(data.mentees);
      } catch (error) {
        console.error('Error fetching mentees:', error);
        toast.error('Failed to load mentees. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMentees();
  }, [session]);
  
  // Set initial session date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSessionDate(tomorrow.toISOString().split('T')[0]);
    
    // Set default time to 10:00 AM
    setSessionTime('10:00');
  }, []);
  
  // Get default duration based on session type
  const getDefaultDuration = () => {
    const selected = sessionTypes.find(type => type.id === sessionType);
    return selected ? selected.duration : 30;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMentee || !sessionDate || !sessionTime || !sessionType || !sessionTopic) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    // Combine date and time into ISO string
    const scheduledDateTime = new Date(`${sessionDate}T${sessionTime}:00`);
    
    try {
      const response = await fetch('/api/mentor/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menteeId: selectedMentee,
          date: scheduledDateTime.toISOString(),
          topic: sessionTopic,
          type: sessionType,
          notes: sessionNotes,
          duration: getDefaultDuration()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule session');
      }
      
      toast.success('Session scheduled successfully!');
      router.push('/dashboard/mentor/sessions');
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast.error('Failed to schedule session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64 min-w-0">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  // Get icon component based on session type
  const getSessionTypeIcon = (iconType: string) => {
    switch (iconType) {
      case 'video':
        return <Video className="h-5 w-5 text-teal-600" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-teal-600" />;
      case 'user':
      default:
        return <User className="h-5 w-5 text-teal-600" />;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-800 mb-4 break-words min-w-0"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 flex items-center break-words min-w-0">
          <Calendar className="mr-2 h-7 w-7 text-teal-600" />
          Schedule a Mentorship Session
        </h1>
        <p className="mt-1 text-gray-600">
          Schedule a new session with one of your mentees
        </p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
        <div className="p-4 lg:p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 lg:space-y-6">
              {/* Mentee Selection */}
              <div>
                <label htmlFor="mentee" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                  Select Mentee <span className="text-red-500">*</span>
                </label>
                {mentees.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mentees.map((mentee) => (
                      <div 
                        key={mentee.id}
                        onClick={() => setSelectedMentee(mentee.id)}
                        className={`cursor-pointer border rounded-lg p-4 transition-colors ${selectedMentee === mentee.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}
                      >
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center mr-3 min-w-0">
                            {mentee.avatar ? (
                              <img src={mentee.avatar} alt={mentee.name} className="h-10 w-10 rounded-full" />
                            ) : (
                              <User className="h-5 w-5 text-teal-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 break-words">{mentee.name}</h3>
                            <p className="text-xs text-gray-500">{mentee.email}</p>
                          </div>
                          {selectedMentee === mentee.id && (
                            <Check className="ml-auto h-5 w-5 text-teal-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">No Mentees Found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      You don't have any mentees assigned yet. Please contact an administrator to assign mentees to you.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Session Type */}
              <div>
                <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                  Session Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionTypes.map((type) => (
                    <div 
                      key={type.id}
                      onClick={() => setSessionType(type.id)}
                      className={`cursor-pointer border rounded-lg p-4 transition-colors ${sessionType === type.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}
                    >
                      <div className="flex items-start min-w-0">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center mr-3 min-w-0">
                          {getSessionTypeIcon(type.icon)}
                        </div>
                        <div>
                          <div className="flex items-center min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 break-words">{type.name}</h3>
                            {sessionType === type.id && (
                              <Check className="ml-2 h-4 w-4 text-teal-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                          <p className="text-xs font-medium text-teal-600 mt-1 break-words">{type.duration} minutes</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <label htmlFor="sessionDate" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="sessionDate"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="sessionTime" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="sessionTime"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Session Topic */}
              <div>
                <label htmlFor="sessionTopic" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                  Session Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sessionTopic"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  placeholder="E.g., Career Planning Discussion, Project Review, etc."
                  className="focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
                  required
                />
              </div>
              
              {/* Session Notes */}
              <div>
                <label htmlFor="sessionNotes" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                  Session Notes (Optional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="sessionNotes"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={4}
                    placeholder="Add any additional information, agenda items, or preparation notes for the session..."
                    className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end min-w-0">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedMentee || !sessionDate || !sessionTime || !sessionType || !sessionTopic}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed break-words min-w-0"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Session
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
