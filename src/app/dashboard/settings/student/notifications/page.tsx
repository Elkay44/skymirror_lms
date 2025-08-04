"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Save } from 'lucide-react';

export default function StudentNotificationsSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    courseUpdates: true,
    forumReplies: true,
    upcomingDeadlines: true,
    mentorMessages: true,
    weeklyDigest: true,
    marketingEmails: false
  });

  useEffect(() => {
    // Simulating loading of notification settings
    // In a real app, you would fetch from API
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [session]);

  const handleToggle = (setting: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would save to API
    toast.success('Notification settings saved!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 min-w-0">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>

      
      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-3 break-words">Delivery Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 break-words">Email Notifications</label>
                  <p className="text-xs text-gray-500">Receive notifications to your email address</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('emailNotifications')}
                  >
                    <span className="sr-only">Toggle email notifications</span>
                    <span
                      className={`${notificationSettings.emailNotifications ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <label htmlFor="push-notifications" className="text-sm font-medium text-gray-700 break-words">Push Notifications</label>
                  <p className="text-xs text-gray-500">Receive notifications in your browser</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('pushNotifications')}
                  >
                    <span className="sr-only">Toggle push notifications</span>
                    <span
                      className={`${notificationSettings.pushNotifications ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <h3 className="text-sm font-medium text-gray-700 p-4 border-b border-gray-200 break-words">Notification Types</h3>
            <div className="divide-y divide-gray-200">
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="course-updates" className="text-sm font-medium text-gray-700 break-words">Course Updates</label>
                  <p className="text-xs text-gray-500">New lessons, materials, and announcements</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.courseUpdates ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('courseUpdates')}
                  >
                    <span className="sr-only">Toggle course update notifications</span>
                    <span
                      className={`${notificationSettings.courseUpdates ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="forum-replies" className="text-sm font-medium text-gray-700 break-words">Forum Replies</label>
                  <p className="text-xs text-gray-500">Responses to your forum posts and mentions</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.forumReplies ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('forumReplies')}
                  >
                    <span className="sr-only">Toggle forum reply notifications</span>
                    <span
                      className={`${notificationSettings.forumReplies ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="upcoming-deadlines" className="text-sm font-medium text-gray-700 break-words">Upcoming Deadlines</label>
                  <p className="text-xs text-gray-500">Reminders about assignments and quiz deadlines</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.upcomingDeadlines ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('upcomingDeadlines')}
                  >
                    <span className="sr-only">Toggle deadline notifications</span>
                    <span
                      className={`${notificationSettings.upcomingDeadlines ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="mentor-messages" className="text-sm font-medium text-gray-700 break-words">Mentor Messages</label>
                  <p className="text-xs text-gray-500">Messages from your mentors</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.mentorMessages ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('mentorMessages')}
                  >
                    <span className="sr-only">Toggle mentor message notifications</span>
                    <span
                      className={`${notificationSettings.mentorMessages ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="weekly-digest" className="text-sm font-medium text-gray-700 break-words">Weekly Digest</label>
                  <p className="text-xs text-gray-500">Weekly summary of your learning progress</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.weeklyDigest ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('weeklyDigest')}
                  >
                    <span className="sr-only">Toggle weekly digest notifications</span>
                    <span
                      className={`${notificationSettings.weeklyDigest ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="marketing-emails" className="text-sm font-medium text-gray-700 break-words">Marketing Emails</label>
                  <p className="text-xs text-gray-500">Promotions, new courses, and platform updates</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('marketingEmails')}
                  >
                    <span className="sr-only">Toggle marketing email notifications</span>
                    <span
                      className={`${notificationSettings.marketingEmails ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end min-w-0">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 break-words min-w-0"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
