"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Bell, Save } from 'lucide-react';

export default function InstructorNotificationsSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    courseEnrollments: true,
    studentQuestions: true,
    courseFeedback: true,
    forumActivity: true,
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800 mb-3">Delivery Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="text-xs text-gray-500">Receive notifications to your email address</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${notificationSettings.emailNotifications ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('emailNotifications')}
                  >
                    <span className="sr-only">Toggle email notifications</span>
                    <span
                      className={`${notificationSettings.emailNotifications ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="push-notifications" className="text-sm font-medium text-gray-700">Push Notifications</label>
                  <p className="text-xs text-gray-500">Receive notifications in your browser</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${notificationSettings.pushNotifications ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
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
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 p-4 border-b border-gray-200">Notification Types</h3>
            <div className="divide-y divide-gray-200">
              <div className="flex items-center justify-between p-4">
                <div>
                  <label htmlFor="course-enrollments" className="text-sm font-medium text-gray-700">Course Enrollments</label>
                  <p className="text-xs text-gray-500">When students enroll in your courses</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${notificationSettings.courseEnrollments ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('courseEnrollments')}
                  >
                    <span className="sr-only">Toggle course enrollment notifications</span>
                    <span
                      className={`${notificationSettings.courseEnrollments ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div>
                  <label htmlFor="student-questions" className="text-sm font-medium text-gray-700">Student Questions</label>
                  <p className="text-xs text-gray-500">When students ask questions about your courses</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${notificationSettings.studentQuestions ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('studentQuestions')}
                  >
                    <span className="sr-only">Toggle student question notifications</span>
                    <span
                      className={`${notificationSettings.studentQuestions ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div>
                  <label htmlFor="course-feedback" className="text-sm font-medium text-gray-700">Course Feedback</label>
                  <p className="text-xs text-gray-500">Reviews and ratings on your courses</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${notificationSettings.courseFeedback ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('courseFeedback')}
                  >
                    <span className="sr-only">Toggle course feedback notifications</span>
                    <span
                      className={`${notificationSettings.courseFeedback ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div>
                  <label htmlFor="forum-activity" className="text-sm font-medium text-gray-700">Forum Activity</label>
                  <p className="text-xs text-gray-500">Activity in your course forums</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${notificationSettings.forumActivity ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('forumActivity')}
                  >
                    <span className="sr-only">Toggle forum activity notifications</span>
                    <span
                      className={`${notificationSettings.forumActivity ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div>
                  <label htmlFor="admin-announcements" className="text-sm font-medium text-gray-700">Admin Announcements</label>
                  <p className="text-xs text-gray-500">Important platform announcements from administrators</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${notificationSettings.adminAnnouncements ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('adminAnnouncements')}
                  >
                    <span className="sr-only">Toggle admin announcement notifications</span>
                    <span
                      className={`${notificationSettings.adminAnnouncements ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div>
                  <label htmlFor="marketing-emails" className="text-sm font-medium text-gray-700">Marketing Emails</label>
                  <p className="text-xs text-gray-500">Promotions, feature updates, and platform news</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${notificationSettings.marketingEmails ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
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
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
