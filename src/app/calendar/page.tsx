"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Video,
  User,
  Plus,
  Check
} from 'lucide-react';

// Event types
type EventType = 'class' | 'assignment' | 'exam' | 'mentoring' | 'other';

interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  courseId?: string;
  courseName?: string;
  instructorName?: string;
  mentorName?: string;
  location?: string;
  description?: string;
  isCompleted?: boolean;
}

// Helper functions
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const daysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const firstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export default function CalendarPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Sample events data
  const sampleEvents: CalendarEvent[] = [
    {
      id: 'event1',
      title: 'UX Design Principles',
      type: 'class',
      date: '2025-05-28',
      startTime: '10:00',
      endTime: '12:00',
      courseId: 'course1',
      courseName: 'UX Design Fundamentals',
      instructorName: 'Sarah Johnson',
      location: 'Virtual Classroom 3'
    },
    {
      id: 'event2',
      title: 'Wireframing Assignment Due',
      type: 'assignment',
      date: '2025-05-30',
      startTime: '23:59',
      endTime: '23:59',
      courseId: 'course1',
      courseName: 'UX Design Fundamentals'
    },
    {
      id: 'event3',
      title: 'Career Planning Session',
      type: 'mentoring',
      date: '2025-05-26',
      startTime: '15:00',
      endTime: '16:00',
      mentorName: 'Alex Rodriguez',
      location: 'Virtual Meeting Room 2',
      description: 'Discuss career path and opportunities in UX design.'
    }
  ];
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Fetch events
    const fetchEvents = async () => {
      try {
        // In a real app, fetch from API
        // const response = await fetch('/api/calendar');
        // const data = await response.json();
        // setEvents(data);
        
        // Using sample data for development
        setTimeout(() => {
          setEvents(sampleEvents);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching events:', error);
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status, router]);
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };
  
  // Filter events for selected date
  const selectedDateEvents = events.filter(event => {
    return event.date === selectedDate.toISOString().split('T')[0];
  });
  
  // Group events by date for the current month
  const eventsByDate: Record<string, number> = {};
  events.forEach(event => {
    const eventDate = new Date(event.date);
    if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
      const day = eventDate.getDate();
      eventsByDate[day] = (eventsByDate[day] || 0) + 1;
    }
  });
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentYear, currentMonth);
    const firstDay = firstDayOfMonth(currentYear, currentMonth);
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 border-b border-r border-gray-200"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const hasEvents = eventsByDate[day] > 0;
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-24 sm:h-32 border-b border-r border-gray-200 p-1 ${isSelected ? 'bg-blue-50' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between">
            <span 
              className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-sm ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
            >
              {day}
            </span>
            {hasEvents && (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-xs text-blue-600 font-medium">
                {eventsByDate[day]}
              </span>
            )}
          </div>
          
          {/* Event indicators */}
          {hasEvents && (
            <div className="mt-1 space-y-1 max-h-16 overflow-hidden">
              {events
                .filter(event => new Date(event.date).getDate() === day && 
                          new Date(event.date).getMonth() === currentMonth && 
                          new Date(event.date).getFullYear() === currentYear)
                .slice(0, 2)
                .map((event, index) => (
                  <div 
                    key={`event-${event.id}-${index}`}
                    className={`text-xs truncate px-1 py-0.5 rounded ${event.type === 'class' ? 'bg-blue-100 text-blue-800' : 
                                              event.type === 'assignment' ? 'bg-yellow-100 text-yellow-800' : 
                                              event.type === 'exam' ? 'bg-red-100 text-red-800' : 
                                              event.type === 'mentoring' ? 'bg-purple-100 text-purple-800' : 
                                              'bg-gray-100 text-gray-800'}`}
                  >
                    {event.title}
                  </div>
                ))}
              {eventsByDate[day] > 2 && (
                <div className="text-xs text-gray-500 pl-1">
                  +{eventsByDate[day] - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };
  
  const getEventTypeIcon = (type: EventType) => {
    switch (type) {
      case 'class':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'assignment':
        return <BookOpen className="h-4 w-4 text-yellow-500" />;
      case 'exam':
        return <BookOpen className="h-4 w-4 text-red-500" />;
      case 'mentoring':
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <CalendarIcon className="h-4 w-4 text-gray-500" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Calendar header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
                <CalendarIcon className="mr-2 h-7 w-7 text-blue-500" />
                Learning Calendar
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <span className="shadow-sm rounded-md">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={goToToday}
                >
                  Today
                </button>
              </span>
              <span className="ml-3 shadow-sm rounded-md">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowEventModal(true)}
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Event
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Calendar View */}
          <div className="lg:flex-1 lg:mr-8 mb-8 lg:mb-0">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Month navigation */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <button
                  className="p-1 rounded-full hover:bg-gray-100"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-6 w-6 text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getMonthName(currentDate)}
                </h2>
                <button
                  className="p-1 rounded-full hover:bg-gray-100"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {generateCalendarDays()}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Event Types</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                  <span className="text-sm text-gray-600">Class</span>
                </div>
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
                  <span className="text-sm text-gray-600">Assignment</span>
                </div>
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                  <span className="text-sm text-gray-600">Exam</span>
                </div>
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
                  <span className="text-sm text-gray-600">Mentoring</span>
                </div>
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-gray-500 mr-2"></span>
                  <span className="text-sm text-gray-600">Other</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Day view */}
          <div className="lg:w-80">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <Clock className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" />
                            <span>
                              {event.startTime} - {event.endTime}
                            </span>
                          </div>
                          {event.courseName && (
                            <div className="mt-1 text-xs text-gray-500">
                              {event.courseName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-gray-500">
                      No events scheduled for this day
                    </p>
                    <button
                      className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setShowEventModal(true)}
                    >
                      <Plus className="-ml-0.5 mr-1 h-4 w-4" />
                      Add Event
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event detail modal */}
      {showEventModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {selectedEvent ? 'Event Details' : 'Add New Event'}
                    </h3>
                    
                    <div className="mt-4">
                      {selectedEvent ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-base font-medium text-gray-900">{selectedEvent.title}</h4>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>
                                {selectedEvent.startTime} - {selectedEvent.endTime}
                              </span>
                            </div>
                          </div>
                          
                          {selectedEvent.courseName && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Course</h4>
                              <p className="mt-1 text-sm text-gray-900">{selectedEvent.courseName}</p>
                            </div>
                          )}
                          
                          {(selectedEvent.instructorName || selectedEvent.mentorName) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">
                                {selectedEvent.type === 'mentoring' ? 'Mentor' : 'Instructor'}
                              </h4>
                              <p className="mt-1 text-sm text-gray-900">
                                {selectedEvent.mentorName || selectedEvent.instructorName}
                              </p>
                            </div>
                          )}
                          
                          {selectedEvent.location && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Location</h4>
                              <p className="mt-1 text-sm text-gray-900">{selectedEvent.location}</p>
                            </div>
                          )}
                          
                          {selectedEvent.description && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Description</h4>
                              <p className="mt-1 text-sm text-gray-900">{selectedEvent.description}</p>
                            </div>
                          )}
                          
                          <div className="border-t border-gray-200 pt-4">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedEvent.type === 'class' ? 'bg-blue-100 text-blue-800' : 
                                          selectedEvent.type === 'assignment' ? 'bg-yellow-100 text-yellow-800' : 
                                          selectedEvent.type === 'exam' ? 'bg-red-100 text-red-800' : 
                                          selectedEvent.type === 'mentoring' ? 'bg-purple-100 text-purple-800' : 
                                          'bg-gray-100 text-gray-800'}`}
                            >
                              {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Event creation form would go here in a real application.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedEvent ? (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setShowEventModal(false)}
                    >
                      Close
                    </button>
                    {selectedEvent.type === 'assignment' && (
                      <button
                        type="button"
                        className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Complete
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setShowEventModal(false)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setShowEventModal(false)}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
