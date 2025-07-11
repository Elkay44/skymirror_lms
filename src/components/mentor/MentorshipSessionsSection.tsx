import React, { useState } from 'react';
import { Calendar, Clock, Video, MessageSquare, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MentorshipSession {
  id: string;
  date: string;
  duration: number;
  topic: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  feedbackProvided?: boolean;
  medium?: 'video' | 'chat' | 'in-person';
  recordingUrl?: string;
}

interface MentorshipSessionsSectionProps {
  sessions: MentorshipSession[];
}

const MentorshipSessionsSection: React.FC<MentorshipSessionsSectionProps> = ({ sessions }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get icon based on session medium
  const getMediumIcon = (medium: string | undefined) => {
    switch (medium) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'chat':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };
  
  // Filter sessions based on status
  const filteredSessions = sessions.filter(session => {
    if (statusFilter === 'all') return true;
    return session.status === statusFilter;
  }).sort((a, b) => {
    // Sort sessions by date (upcoming first, then past)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Group sessions by month
  const groupedSessions: Record<string, MentorshipSession[]> = {};
  filteredSessions.forEach(session => {
    const date = new Date(session.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!groupedSessions[monthYear]) {
      groupedSessions[monthYear] = [];
    }
    
    groupedSessions[monthYear].push(session);
  });
  
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Sessions Scheduled</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          There are no mentorship sessions scheduled or recorded for this mentee yet.
        </p>
        <button
          onClick={() => toast.success('Session scheduling feature coming soon!')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Schedule a Session
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Mentorship Sessions</h3>
          <p className="text-sm text-gray-500">Track and manage your mentoring sessions</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">All Sessions</option>
            <option value="scheduled">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button
            onClick={() => toast.success('Session scheduling feature coming soon!')}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Plus className="mr-1 h-4 w-4" />
            New Session
          </button>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-gray-200">
          {Object.keys(groupedSessions).length > 0 ? (
            Object.entries(groupedSessions).map(([monthYear, monthSessions]) => (
              <div key={monthYear} className="space-y-4 p-4">
                <h4 className="text-md font-medium text-gray-900 sticky top-0 bg-white py-2">{monthYear}</h4>
                
                <div className="space-y-4">
                  {monthSessions.map((session) => {
                    const sessionDate = new Date(session.date);
                    const isUpcoming = sessionDate > new Date();
                    
                    return (
                      <div 
                        key={session.id} 
                        className={`flex p-4 rounded-lg border ${session.status === 'completed' ? 'border-green-200 bg-green-50' : session.status === 'cancelled' ? 'border-gray-200 bg-gray-50' : 'border-teal-200 bg-teal-50'}`}
                      >
                        <div className="flex-shrink-0 mr-4">
                          <div 
                            className={`flex items-center justify-center h-12 w-12 rounded-lg ${session.status === 'completed' ? 'bg-green-100' : session.status === 'cancelled' ? 'bg-gray-100' : 'bg-teal-100'}`}
                          >
                            {session.status === 'completed' ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : session.status === 'cancelled' ? (
                              <AlertCircle className="h-6 w-6 text-gray-400" />
                            ) : (
                              getMediumIcon(session.medium)
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">
                                {session.topic}
                              </h5>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span>{formatDate(session.date)} at {formatTime(session.date)}</span>
                                <span className="mx-2">•</span>
                                <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span>{session.duration} minutes</span>
                              </div>
                            </div>
                            
                            <div className="mt-2 md:mt-0">
                              <div className="flex space-x-2">
                                {isUpcoming && session.status === 'scheduled' && (
                                  <button
                                    onClick={() => toast.success('Join meeting feature coming soon!')}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                  >
                                    Join Meeting
                                  </button>
                                )}
                                
                                {session.status === 'completed' && !session.feedbackProvided && (
                                  <button
                                    onClick={() => toast.success('Feedback feature coming soon!')}
                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                  >
                                    Provide Feedback
                                  </button>
                                )}
                                
                                {session.recordingUrl && (
                                  <button
                                    onClick={() => window.open(session.recordingUrl, '_blank')}
                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                  >
                                    View Recording
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {session.notes && (
                            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md text-sm text-gray-700">
                              {session.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No sessions match the selected filter.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700">Session Summary</h4>
        <div className="mt-2 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-teal-600">{sessions.filter(s => s.status === 'scheduled').length}</p>
            <p className="text-xs text-gray-500">Upcoming</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{sessions.filter(s => s.status === 'completed').length}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{sessions.filter(s => s.status === 'cancelled').length}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorshipSessionsSection;
