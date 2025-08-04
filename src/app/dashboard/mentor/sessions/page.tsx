"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  Video,
  MessageSquare,
  Check,
  X,
  Plus,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  Edit,
  FileText
} from 'lucide-react';

interface MentorshipSession {
  id: string;
  menteeId: string;
  menteeName: string;
  menteeAvatar?: string;
  date: string;
  duration: number; // in minutes
  topic: string;
  type: 'ONE_ON_ONE' | 'CAREER_PLANNING' | 'PROJECT_REVIEW' | 'GENERAL_GUIDANCE';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export default function SessionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Fetch sessions data
  useEffect(() => {
    const fetchSessions = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/mentor/sessions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        
        const data = await response.json();
        setSessions(data.sessions || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to load sessions. Please try again later.');
        // For demo purposes, set mock data if API fails
        setSessions(mockSessions);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, [session]);
  
  // Handle session cancellation
  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) {
      return;
    }
    
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
      
      // Update the sessions list
      setSessions(prevSessions => {
        return prevSessions.map(s => {
          if (s.id === sessionId) {
            return { ...s, status: 'CANCELLED' };
          }
          return s;
        });
      });
      
      toast.success('Session cancelled successfully');
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session. Please try again.');
    }
  };
  
  // Handle marking session as complete
  const handleCompleteSession = async (sessionId: string) => {
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
      
      // Update the sessions list
      setSessions(prevSessions => {
        return prevSessions.map(s => {
          if (s.id === sessionId) {
            return { ...s, status: 'COMPLETED' };
          }
          return s;
        });
      });
      
      toast.success('Session marked as completed');
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to mark session as completed. Please try again.');
    }
  };
  
  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
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
  
  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };
  
  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'ONE_ON_ONE':
        return 'One-on-One';
      case 'PROJECT_REVIEW':
        return 'Project Review';
      case 'GENERAL_GUIDANCE':
        return 'General Guidance';
      case 'CAREER_PLANNING':
        return 'Career Planning';
      default:
        return type;
    }
  };
  
  const isUpcoming = (dateString: string) => {
    const sessionDate = new Date(dateString);
    const now = new Date();
    return sessionDate > now;
  };
  
  // Sort and filter sessions
  const filteredAndSortedSessions = sessions
    .filter(session => {
      // Apply status filter
      if (statusFilter !== 'all') {
        return session.status === statusFilter;
      }
      return true;
    })
    .filter(session => {
      // Apply search filter
      if (!searchTerm) return true;
      
      const searchTermLower = searchTerm.toLowerCase();
      return (
        session.menteeName.toLowerCase().includes(searchTermLower) ||
        session.topic.toLowerCase().includes(searchTermLower) ||
        getSessionTypeLabel(session.type).toLowerCase().includes(searchTermLower)
      );
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortField === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      
      if (sortField === 'menteeName') {
        return sortDirection === 'asc'
          ? a.menteeName.localeCompare(b.menteeName)
          : b.menteeName.localeCompare(a.menteeName);
      }
      
      if (sortField === 'type') {
        return sortDirection === 'asc'
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      }
      
      return 0;
    });
  
  // Group sessions by month
  const groupedSessions: Record<string, MentorshipSession[]> = {};
  
  filteredAndSortedSessions.forEach(session => {
    const date = new Date(session.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!groupedSessions[monthYear]) {
      groupedSessions[monthYear] = [];
    }
    
    groupedSessions[monthYear].push(session);
  });
  
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center break-words min-w-0">
            <Calendar className="mr-2 h-7 w-7 text-teal-600" />
            Mentorship Sessions
          </h1>
          <p className="mt-1 text-gray-600">
            Manage your scheduled sessions with mentees
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link 
            href="/dashboard/mentor/sessions/schedule"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Schedule Session
          </Link>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 min-w-0">
            <div className="relative flex-grow min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sessions..."
                className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
              >
                <option value="all">All Sessions</option>
                <option value="SCHEDULED">Upcoming</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
        
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="p-6 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">No Sessions Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {statusFilter !== 'all' || searchTerm 
                ? 'No sessions match your current filters. Try adjusting your search or filter criteria.'
                : "You don't have any sessions scheduled yet. Click the button below to schedule your first session."}
            </p>
            {statusFilter === 'all' && !searchTerm && (
              <Link 
                href="/dashboard/mentor/sessions/schedule"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
              >
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Schedule Your First Session
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider break-words">
              <div className="flex items-center min-w-0">
                <button 
                  className="flex items-center cursor-pointer focus:outline-none min-w-0"
                  onClick={() => {
                    if (sortField === 'date') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('date');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Date/Time
                  {sortField === 'date' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {Object.entries(groupedSessions).map(([monthYear, monthSessions]) => (
              <div key={monthYear} className="divide-y divide-gray-100">
                <div className="px-6 py-3 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 break-words">{monthYear}</h3>
                </div>
                
                {monthSessions.map((session) => (
                  <div key={session.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center min-w-0">
                    {/* Date and Time */}
                    <div className="w-full md:w-1/4 mb-3 md:mb-0">
                      <div className="flex items-center min-w-0">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${session.status === 'CANCELLED' ? 'bg-gray-100' : 'bg-teal-100'} flex items-center justify-center mr-3`}>
                          <Calendar className={`h-6 w-6 ${session.status === 'CANCELLED' ? 'text-gray-400' : 'text-teal-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 break-words">{formatDate(session.date)}</p>
                          <p className="text-xs text-gray-500 flex items-center min-w-0">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatTime(session.date)} • {session.duration} min
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Session Details */}
                    <div className="w-full md:w-2/4 mb-3 md:mb-0">
                      <p className="text-sm font-medium text-gray-900 break-words">{session.topic}</p>
                      <div className="flex items-center mt-1 min-w-0">
                        <div className="flex items-center min-w-0">
                          <User className="mr-1 h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">{session.menteeName}</span>
                        </div>
                        <span className="mx-2 text-gray-300">•</span>
                        <div className="flex items-center min-w-0">
                          {getSessionTypeIcon(session.type)}
                          <span className="ml-1 text-xs text-gray-500">{getSessionTypeLabel(session.type)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status and Actions */}
                    <div className="w-full md:w-1/4 flex flex-col md:flex-row items-start md:items-center justify-between min-w-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                        {session.status === 'SCHEDULED' ? 'Upcoming' : session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                      </span>
                      
                      <div className="flex space-x-2 mt-2 md:mt-0 min-w-0">
                        {session.status === 'SCHEDULED' && (
                          <>
                            <button 
                              onClick={() => router.push(`/dashboard/mentor/sessions/${session.id}/edit`)}
                              className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-teal-600 transition-colors"
                              title="Edit Session"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            {isUpcoming(session.date) && (
                              <button 
                                onClick={() => handleCancelSession(session.id)}
                                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                                title="Cancel Session"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            
                            {!isUpcoming(session.date) && (
                              <button 
                                onClick={() => handleCompleteSession(session.id)}
                                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors"
                                title="Mark as Completed"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                        
                        <Link 
                          href={`/dashboard/mentor/sessions/${session.id}`}
                          className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-teal-600 transition-colors"
                          title="View Session Details"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-6 overflow-hidden">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4 min-w-0">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 break-words">Upcoming Sessions</p>
              <p className="text-2xl font-semibold text-gray-900 break-words">
                {sessions.filter(s => s.status === 'SCHEDULED' && isUpcoming(s.date)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-6 overflow-hidden">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-3 mr-4 min-w-0">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 break-words">Completed Sessions</p>
              <p className="text-2xl font-semibold text-gray-900 break-words">
                {sessions.filter(s => s.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-6 overflow-hidden">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-3 mr-4 min-w-0">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 break-words">Cancelled Sessions</p>
              <p className="text-2xl font-semibold text-gray-900 break-words">
                {sessions.filter(s => s.status === 'CANCELLED').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data for testing
const mockSessions: MentorshipSession[] = [
  {
    id: 'session_1',
    menteeId: 'mentee_1',
    menteeName: 'Alex Johnson',
    menteeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    duration: 45,
    topic: 'Career Planning Discussion',
    type: 'CAREER_PLANNING',
    status: 'SCHEDULED',
    notes: 'Discuss long-term career goals and create a roadmap for the next 2 years.'
  },
  {
    id: 'session_2',
    menteeId: 'mentee_2',
    menteeName: 'Sophia Lee',
    menteeAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    duration: 30,
    topic: 'Python Project Review',
    type: 'PROJECT_REVIEW',
    status: 'SCHEDULED',
    notes: 'Review current progress on data analysis project and provide feedback.'
  },
  {
    id: 'session_3',
    menteeId: 'mentee_1',
    menteeName: 'Alex Johnson',
    menteeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    duration: 60,
    topic: 'JavaScript Fundamentals',
    type: 'ONE_ON_ONE',
    status: 'COMPLETED',
    notes: 'Covered core JavaScript concepts including promises, async/await, and closures.'
  },
  {
    id: 'session_4',
    menteeId: 'mentee_2',
    menteeName: 'Sophia Lee',
    menteeAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    duration: 20,
    topic: 'Quick Check-in',
    type: 'GENERAL_GUIDANCE',
    status: 'COMPLETED',
    notes: 'Brief check-in on current progress and answered questions about course material.'
  },
  {
    id: 'session_5',
    menteeId: 'mentee_1',
    menteeName: 'Alex Johnson',
    menteeAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    duration: 45,
    topic: 'Resume Review',
    type: 'CAREER_PLANNING',
    status: 'CANCELLED',
    notes: 'Session cancelled due to scheduling conflict.'
  }
];
