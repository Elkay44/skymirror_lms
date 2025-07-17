"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  MessageSquare, 
  Calendar, 
  BookOpen, 
  Award, 
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Settings,
  Trash2
} from 'lucide-react';

type NotificationType = 'message' | 'course' | 'deadline' | 'achievement' | 'mentorship' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  isPriority?: boolean;
  relatedItemId?: string;
  relatedItemType?: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | NotificationType>('all');
  const [expandedSettings, setExpandedSettings] = useState(false);
  
  // Sample notification data (commented out for production)
  // const sampleNotifications: Notification[] = [
  //   {
  //     id: 'notif1',
  //     type: 'message',
  //     title: 'New message from Sarah Johnson',
  //     message: 'Hi there! I wanted to follow up on our last session and share some additional resources with you.',
  //     timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  //     isRead: false,
  //     actionUrl: '/dashboard/messages?id=msg123',
  //     actionLabel: 'Reply',
  //     senderId: 'user1',
  //     senderName: 'Sarah Johnson',
  //     senderAvatar: '/images/mentors/sarah-johnson.jpg',
  //     isPriority: true
  //   },
  //   {
  //     id: 'notif2',
  //     type: 'course',
  //     title: 'New lesson available',
  //     message: 'The latest lesson "Advanced React Hooks" in your "React Development Masterclass" course is now available.',
  //     timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  //     isRead: false,
  //     actionUrl: '/courses/react-masterclass/lessons/advanced-hooks',
  //     actionLabel: 'View Lesson',
  //     relatedItemId: 'course2',
  //     relatedItemType: 'course'
  //   },
  //   {
  //     id: 'notif3',
  //     type: 'deadline',
  //     title: 'Assignment due tomorrow',
  //     message: 'Your "Wireframing Project" for the UX Design Fundamentals course is due tomorrow at 11:59 PM.',
  //     timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  //     isRead: true,
  //     actionUrl: '/courses/ux-design/assignments/wireframing',
  //     actionLabel: 'View Assignment',
  //     isPriority: true,
  //     relatedItemId: 'assignment1',
  //     relatedItemType: 'assignment'
  //   },
  //   {
  //     id: 'notif4',
  //     type: 'achievement',
  //     title: 'Achievement unlocked: Fast Learner',
  //     message: 'You\'ve completed 5 lessons in under a week! Keep up the great pace.',
  //     timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  //     isRead: true,
  //     actionUrl: '/dashboard/achievements',
  //     actionLabel: 'View Achievements'
  //   },
  //   {
  //     id: 'notif5',
  //     type: 'mentorship',
  //     title: 'Upcoming mentoring session',
  //     message: 'Reminder: You have a mentoring session with Michael Lee tomorrow at 2:00 PM.',
  //     timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  //     isRead: false,
  //     actionUrl: '/calendar?event=session123',
  //     actionLabel: 'View Details',
  //     senderId: 'mentor2',
  //     senderName: 'Michael Lee',
  //     senderAvatar: '/images/mentors/michael-lee.jpg'
  //   },
  //   {
  //     id: 'notif6',
  //     type: 'system',
  //     title: 'Certificate issued',
  //     message: 'Your certificate for completing "Data Science Fundamentals" has been issued and is now available.',
  //     timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  //     isRead: true,
  //     actionUrl: '/certificates',
  //     actionLabel: 'View Certificate',
  //     relatedItemId: 'cert3',
  //     relatedItemType: 'certificate'
  //   }
  // ];
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        // Fetch notifications from real API
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        // The API now returns the array directly
        setNotifications(Array.isArray(data) ? data : []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status, router]);
  
  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => notification.type === activeTab);
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  // Group notifications by date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  const isYesterday = (date: Date) => {
    return date.getDate() === yesterday.getDate() && 
           date.getMonth() === yesterday.getMonth() && 
           date.getFullYear() === yesterday.getFullYear();
  };
  
  const groupedNotifications: Record<string, Notification[]> = {
    'Today': filteredNotifications.filter(notification => isToday(notification.timestamp)),
    'Yesterday': filteredNotifications.filter(notification => isYesterday(notification.timestamp)),
    'Earlier': filteredNotifications.filter(notification => 
      !isToday(notification.timestamp) && !isYesterday(notification.timestamp)
    )
  };
  
  // Handle mark as read
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };
  
  // Handle mark all as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, isRead: true }))
    );
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to the action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'course':
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      case 'deadline':
        return <Clock className="h-5 w-5 text-red-500" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'mentorship':
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get tab text based on tab type
  const getTabText = (tab: 'all' | NotificationType) => {
    switch (tab) {
      case 'all':
        return 'All';
      case 'message':
        return 'Messages';
      case 'course':
        return 'Courses';
      case 'deadline':
        return 'Deadlines';
      case 'achievement':
        return 'Achievements';
      case 'mentorship':
        return 'Mentorship';
      case 'system':
        return 'System';
      default:
        const tabStr = tab as string;
        return tabStr.charAt(0).toUpperCase() + tabStr.slice(1);
    }
  };
  
  // Format timestamp to relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Bell className="h-6 w-6 text-gray-900" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={markAllAsRead}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Mark all as read
              </button>
              <div className="relative">
                <button
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setExpandedSettings(!expandedSettings)}
                >
                  <Settings className="mr-1.5 h-4 w-4" />
                  Settings
                  <ChevronDown className={`ml-1.5 h-4 w-4 transition-transform ${expandedSettings ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedSettings && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Notification preferences
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Email notifications
                    </a>
                    <button
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={() => {
                        // This would be an API call in a real app
                        setNotifications([]);
                      }}
                    >
                      <Trash2 className="inline-block mr-1.5 h-4 w-4" />
                      Clear all notifications
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'message' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('message')}
              >
                Messages
              </button>
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'course' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('course')}
              >
                Courses
              </button>
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'deadline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('deadline')}
              >
                Deadlines
              </button>
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'achievement' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('achievement')}
              >
                Achievements
              </button>
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'mentorship' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('mentorship')}
              >
                Mentorship
              </button>
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'system' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('system')}
              >
                System
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Notification content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all' 
                ? 'You don\'t have any notifications yet.'
                : `You don\'t have any ${getTabText(activeTab).toLowerCase()} notifications.`}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNotifications).map(([date, notifications]) => (
              notifications.length > 0 && (
                <div key={date}>
                  <h2 className="text-sm font-medium text-gray-500 mb-4">{date}</h2>
                  <div className="space-y-3">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`bg-white shadow rounded-lg overflow-hidden cursor-pointer transition hover:shadow-md ${
                          notification.isRead ? '' : 'border-l-4 border-blue-500'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="p-5">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              {notification.senderAvatar ? (
                                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                                  <img 
                                    src={notification.senderAvatar} 
                                    alt={notification.senderName || ''} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className={`text-sm font-medium ${notification.isRead ? 'text-gray-900' : 'text-blue-600'}`}>
                                  {notification.title}
                                  {notification.isPriority && (
                                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                                      <AlertCircle className="inline-block h-3 w-3 mr-1" />
                                      Priority
                                    </span>
                                  )}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {notification.message}
                              </p>
                              {notification.actionLabel && (
                                <div className="mt-3">
                                  <a 
                                    href={notification.actionUrl} 
                                    className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {notification.actionLabel}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
