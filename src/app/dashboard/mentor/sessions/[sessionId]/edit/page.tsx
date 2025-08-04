"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  FileText,
  ChevronLeft,
  Save,
  AlertTriangle
} from 'lucide-react';

interface SessionDetails {
  id: string;
  menteeId: string;
  menteeName: string;
  menteeAvatar?: string;
  date: string;
  duration: number;
  topic: string;
  type: string;
  status: string;
  notes?: string;
}

export default function EditSessionPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  // Form state
  const [sessionDate, setSessionDate] = useState<string>('');
  const [sessionTime, setSessionTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<string>('');
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState<number>(30);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  
  // Session type options
  const sessionTypes = [
    { id: 'ONE_ON_ONE', name: 'One-on-One Meeting', description: 'Personal guidance and feedback session' },
    { id: 'CAREER_PLANNING', name: 'Career Planning', description: 'Long-term career strategy and goal setting' },
    { id: 'PROJECT_REVIEW', name: 'Project Review', description: 'Detailed review of assignments or projects' },
    { id: 'GENERAL_GUIDANCE', name: 'General Guidance', description: 'Quick check-in and general guidance' }
  ];
  
  // Fetch session details
  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/mentor/sessions/${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch session details');
        }
        
        const data = await response.json();
        setSessionDetails(data.session);
        
        // Extract date and time from the session date
        const sessionDateTime = new Date(data.session.date);
        const dateString = sessionDateTime.toISOString().split('T')[0];
        const timeString = sessionDateTime.toTimeString().substring(0, 5);
        
        // Set form values
        setSessionDate(dateString);
        setSessionTime(timeString);
        setSessionType(data.session.type || 'ONE_ON_ONE');
        setSessionTopic(data.session.topic || '');
        setSessionNotes(data.session.notes || '');
        setSessionDuration(data.session.duration || 30);
      } catch (error) {
        console.error('Error fetching session details:', error);
        toast.error('Failed to load session details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionDetails();
  }, [session, sessionId]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionDate || !sessionTime || !sessionType || !sessionTopic) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    
    // Combine date and time into ISO string
    const scheduledDateTime = new Date(`${sessionDate}T${sessionTime}:00`);
    
    try {
      const response = await fetch(`/api/mentor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: scheduledDateTime.toISOString(),
          topic: sessionTopic,
          type: sessionType,
          notes: sessionNotes,
          duration: sessionDuration
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update session');
      }
      
      toast.success('Session updated successfully!');
      router.push(`/dashboard/mentor/sessions/${sessionId}`);
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle session type change
  const handleSessionTypeChange = (typeId: string) => {
    setSessionType(typeId);
    
    // Update duration based on session type
    const selectedType = sessionTypes.find(type => type.id === typeId);
    if (selectedType) {
      switch (typeId) {
        case 'ONE_ON_ONE':
          setSessionDuration(45);
          break;
        case 'CAREER_PLANNING':
          setSessionDuration(60);
          break;
        case 'PROJECT_REVIEW':
          setSessionDuration(30);
          break;
        case 'GENERAL_GUIDANCE':
          setSessionDuration(20);
          break;
        default:
          setSessionDuration(30);
      }
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
  
  // Render error state if session details not found
  if (!sessionDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center overflow-hidden">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">Session Not Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            The session you are trying to edit does not exist or you don't have access to modify it.
          </p>
          <Link
            href="/dashboard/mentor/sessions"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }
  
  // Don't allow editing completed or cancelled sessions
  if (sessionDetails.status !== 'SCHEDULED') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center overflow-hidden">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">Cannot Edit This Session</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {sessionDetails.status === 'COMPLETED' ? 
              'This session has already been completed and cannot be modified.' : 
              'This session has been cancelled and cannot be modified.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3 min-w-0">
            <Link
              href={`/dashboard/mentor/sessions/${sessionId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Session Details
            </Link>
            
            <Link
              href="/dashboard/mentor/sessions"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
            >
              View All Sessions
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={`/dashboard/mentor/sessions/${sessionId}`} 
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-800 mb-4 break-words min-w-0"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Session Details
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900 flex items-center break-words min-w-0">
          <Calendar className="mr-2 h-7 w-7 text-teal-600" />
          Edit Session
        </h1>
        <p className="mt-1 text-gray-600">
          Update the details of your mentorship session with {sessionDetails.menteeName}
        </p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-4 min-w-0">
              {sessionDetails.menteeAvatar ? (
                <img 
                  src={sessionDetails.menteeAvatar} 
                  alt={sessionDetails.menteeName} 
                  className="h-10 w-10 object-cover" 
                />
              ) : (
                <div className="h-10 w-10 bg-teal-100 flex items-center justify-center rounded-full min-w-0">
                  <User className="h-5 w-5 text-teal-600" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-md font-medium text-gray-900 break-words">Session with {sessionDetails.menteeName}</h2>
              <p className="text-sm text-gray-500 break-words">ID: {sessionId}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 lg:space-y-6">
              {/* Session Type */}
              <div>
                <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                  Session Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionTypes.map((type) => (
                    <div 
                      key={type.id}
                      onClick={() => handleSessionTypeChange(type.id)}
                      className={`cursor-pointer border rounded-lg p-4 transition-colors ${sessionType === type.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}
                    >
                      <div className="flex items-center min-w-0">
                        <input
                          type="radio"
                          id={`type-${type.id}`}
                          name="sessionType"
                          value={type.id}
                          checked={sessionType === type.id}
                          onChange={() => handleSessionTypeChange(type.id)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                        />
                        <label htmlFor={`type-${type.id}`} className="ml-3 cursor-pointer">
                          <span className="block text-sm font-medium text-gray-900 break-words">{type.name}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{type.description}</span>
                        </label>
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
              
              {/* Duration */}
              <div>
                <label htmlFor="sessionDuration" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="sessionDuration"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(parseInt(e.target.value, 10))}
                    min={15}
                    max={120}
                    step={5}
                    className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Recommended duration: 15-120 minutes</p>
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
                <div className="flex space-x-3 min-w-0">
                  <Link
                    href={`/dashboard/mentor/sessions/${sessionId}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
                  >
                    Cancel
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={saving || !sessionDate || !sessionTime || !sessionType || !sessionTopic}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed break-words min-w-0"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
