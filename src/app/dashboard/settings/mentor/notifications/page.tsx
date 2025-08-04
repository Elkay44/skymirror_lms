"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Bell, Save } from 'lucide-react';

export default function MentorNotificationsSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    menteeRequests: true,
    sessionBookings: true,
    sessionReminders: true,
    menteeMessages: true,
    adminAnnouncements: true,
    marketingEmails: false
  });

  useEffect(() => {
    // Simulating loading of notification settings
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
    toast.success('Notification settings saved!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 min-w-0">
        <div className="animate-spin h-8 w-8 border-4 border-teal-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 flex items-center break-words min-w-0">
        <Bell className="mr-2 h-5 w-5 text-teal-500" />
        Notification Settings
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
        <div className="space-y-4">
          <div className="bg-teal-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-teal-800 mb-3 break-words">Delivery Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 break-words">Email Notifications</label>
                  <p className="text-xs text-gray-500">Receive notifications to your email address</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.emailNotifications ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
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
                    className={`${notificationSettings.pushNotifications ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
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
                  <label htmlFor="mentee-requests" className="text-sm font-medium text-gray-700 break-words">Mentee Requests</label>
                  <p className="text-xs text-gray-500">When students request mentorship</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.menteeRequests ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('menteeRequests')}
                  >
                    <span className="sr-only">Toggle mentee request notifications</span>
                    <span
                      className={`${notificationSettings.menteeRequests ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="session-bookings" className="text-sm font-medium text-gray-700 break-words">Session Bookings</label>
                  <p className="text-xs text-gray-500">When mentees book mentoring sessions</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.sessionBookings ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('sessionBookings')}
                  >
                    <span className="sr-only">Toggle session booking notifications</span>
                    <span
                      className={`${notificationSettings.sessionBookings ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="session-reminders" className="text-sm font-medium text-gray-700 break-words">Session Reminders</label>
                  <p className="text-xs text-gray-500">Upcoming session notifications</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.sessionReminders ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('sessionReminders')}
                  >
                    <span className="sr-only">Toggle session reminder notifications</span>
                    <span
                      className={`${notificationSettings.sessionReminders ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="mentee-messages" className="text-sm font-medium text-gray-700 break-words">Mentee Messages</label>
                  <p className="text-xs text-gray-500">Messages from your mentees</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.menteeMessages ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('menteeMessages')}
                  >
                    <span className="sr-only">Toggle mentee message notifications</span>
                    <span
                      className={`${notificationSettings.menteeMessages ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="admin-announcements" className="text-sm font-medium text-gray-700 break-words">Admin Announcements</label>
                  <p className="text-xs text-gray-500">Important platform announcements from administrators</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.adminAnnouncements ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('adminAnnouncements')}
                  >
                    <span className="sr-only">Toggle admin announcement notifications</span>
                    <span
                      className={`${notificationSettings.adminAnnouncements ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 min-w-0">
                <div>
                  <label htmlFor="marketing-emails" className="text-sm font-medium text-gray-700 break-words">Marketing Emails</label>
                  <p className="text-xs text-gray-500">Promotions, feature updates, and platform news</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${notificationSettings.marketingEmails ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
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
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
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
