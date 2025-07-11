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
  MessageSquare,
  Video,
  FileText,
  ChevronLeft,
  Edit,
  Trash2,
  Check,
  X,
  Download,
  ExternalLink,
  Mail,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

interface SessionDetails {
  id: string;
  menteeId: string;
  menteeName: string;
  menteeAvatar: string;
  menteeEmail: string;
  date: string;
  duration: number;
  topic: string;
  type: string;
  status: string;
  notes: string;
  preparationMaterials?: {
    id: string;
    title: string;
    type: string;
    url: string;
  }[];
  menteeProgress?: {
    completedCourses: number;
    activeCourses: number;
    averageGrade: string;
    lastActive: string;
  };
}

export default function SessionDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingSession, setCancellingSession] = useState<boolean>(false);
  const [completingSession, setCompletingSession] = useState<boolean>(false);
  
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
      } catch (error) {
        console.error('Error fetching session details:', error);
        toast.error('Failed to load session details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionDetails();
  }, [session, sessionId]);
  
  // Handle session cancellation
  const handleCancelSession = async () => {
    if (!confirm('Are you sure you want to cancel this session?')) {
      return;
    }
    
    setCancellingSession(true);
    
    try {
      const response = await fetch(`/api/mentor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel session');
      }
      
      const data = await response.json();
      setSessionDetails(data.session);
      toast.success('Session cancelled successfully');
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session. Please try again.');
    } finally {
      setCancellingSession(false);
    }
  };
  
  // Handle marking session as complete
  const handleCompleteSession = async () => {
    setCompletingSession(true);
    
    try {
      const response = await fetch(`/api/mentor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark session as completed');
      }
      
      const data = await response.json();
      setSessionDetails(data.session);
      toast.success('Session marked as completed');
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to mark session as completed. Please try again.');
    } finally {
      setCompletingSession(false);
    }
  };
  
  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'ONE_ON_ONE':
        return <User className="h-5 w-5" />;
      case 'PROJECT_REVIEW':
        return <Video className="h-5 w-5" />;
      case 'GENERAL_GUIDANCE':
        return <MessageSquare className="h-5 w-5" />;
      case 'CAREER_PLANNING':
        return <FileText className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };
  
  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'ONE_ON_ONE':
        return 'One-on-One Meeting';
      case 'PROJECT_REVIEW':
        return 'Project Review';
      case 'GENERAL_GUIDANCE':
        return 'General Guidance';
      case 'CAREER_PLANNING':
        return 'Career Planning';
      default:
        return type.replace(/_/g, ' ');
    }
  };
  
  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  const isUpcoming = (dateString: string) => {
    if (!dateString) return false;
    const sessionDate = new Date(dateString);
    const now = new Date();
    return sessionDate > now;
  };
  
  const canModify = (status: string) => {
    return status === 'SCHEDULED';
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  // Render error state if session details not found
  if (!sessionDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Session Not Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            The session you are looking for does not exist or you don't have access to view it.
          </p>
          <Link
            href="/dashboard/mentor/sessions"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/dashboard/mentor/sessions" 
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-800 mb-4"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to All Sessions
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{sessionDetails.topic}</h1>
          
          <div className="mt-2 md:mt-0">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionStatusColor(sessionDetails.status)}`}>
              {sessionDetails.status === 'SCHEDULED' ? 'Upcoming' : 
               sessionDetails.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Session Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                  {getSessionTypeIcon(sessionDetails.type)}
                </div>
                <div>
                  <h2 className="text-xl font-medium text-gray-900">{sessionDetails.topic}</h2>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">{getSessionTypeLabel(sessionDetails.type)}</span>
                    <span className="mx-2 text-gray-300">u2022</span>
                    <span className="text-sm text-gray-500">{sessionDetails.duration} minutes</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Date</h3>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(sessionDetails.date)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Time</h3>
                    <p className="text-sm text-gray-500 mt-1">{formatTime(sessionDetails.date)}</p>
                  </div>
                </div>
              </div>
              
              {sessionDetails.notes && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Session Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                    {sessionDetails.notes}
                  </div>
                </div>
              )}
              
              {sessionDetails.preparationMaterials && sessionDetails.preparationMaterials.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Preparation Materials</h3>
                  <div className="space-y-3">
                    {sessionDetails.preparationMaterials.map((material) => (
                      <a 
                        key={material.id}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          {material.type === 'DOCUMENT' ? (
                            <FileText className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ExternalLink className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{material.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{material.type.replace(/_/g, ' ')}</p>
                        </div>
                        <div>
                          {material.type === 'DOCUMENT' ? (
                            <Download className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Session Actions */}
              {canModify(sessionDetails.status) && (
                <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
                  <Link
                    href={`/dashboard/mentor/sessions/${sessionDetails.id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    <Edit className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
                    Edit Session
                  </Link>
                  
                  {isUpcoming(sessionDetails.date) && (
                    <button
                      onClick={handleCancelSession}
                      disabled={cancellingSession}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {cancellingSession ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="-ml-1 mr-2 h-4 w-4 text-red-500" />
                          Cancel Session
                        </>
                      )}
                    </button>
                  )}
                  
                  {!isUpcoming(sessionDetails.date) && (
                    <button
                      onClick={handleCompleteSession}
                      disabled={completingSession}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {completingSession ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Completing...
                        </>
                      ) : (
                        <>
                          <Check className="-ml-1 mr-2 h-4 w-4 text-green-500" />
                          Mark as Completed
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mentee Information */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Mentee Information</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 mr-4">
                  {sessionDetails.menteeAvatar ? (
                    <img 
                      src={sessionDetails.menteeAvatar} 
                      alt={sessionDetails.menteeName} 
                      className="h-16 w-16 rounded-full border border-gray-200" 
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-teal-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">{sessionDetails.menteeName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{sessionDetails.menteeEmail}</p>
                  <a 
                    href={`mailto:${sessionDetails.menteeEmail}`}
                    className="inline-flex items-center mt-2 text-xs font-medium text-teal-600 hover:text-teal-700"
                  >
                    <Mail className="mr-1 h-3 w-3" />
                    Send Email
                  </a>
                </div>
              </div>
              
              {sessionDetails.menteeProgress && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Learning Progress</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">Active Courses</span>
                      </div>
                      <span className="text-sm font-medium">{sessionDetails.menteeProgress.activeCourses}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">Completed Courses</span>
                      </div>
                      <span className="text-sm font-medium">{sessionDetails.menteeProgress.completedCourses}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">Average Grade</span>
                      </div>
                      <span className="text-sm font-medium">{sessionDetails.menteeProgress.averageGrade}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">Last Active</span>
                      </div>
                      <span className="text-sm font-medium">
                        {new Date(sessionDetails.menteeProgress.lastActive).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <Link
                  href={`/dashboard/mentor/mentees/${sessionDetails.menteeId}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  View Full Mentee Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
