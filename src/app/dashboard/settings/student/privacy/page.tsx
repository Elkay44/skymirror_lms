"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Fingerprint, Save, Download, Shield } from 'lucide-react';

export default function StudentPrivacySettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'all_platform_users',
    showEnrolledCourses: true,
    showAchievements: true,
    showLearningActivity: true,
    allowMentorRecommendations: true,
    allowCourseRecommendations: true,
    allowForumTagging: true,
    allowProfileSearching: true
  });

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/privacy');
        
        if (!response.ok) {
          throw new Error('Failed to fetch privacy settings');
        }
        
        const data = await response.json();
        setPrivacySettings(data.privacySettings);
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
        toast.error('Failed to load privacy settings');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchPrivacySettings();
    }
  }, [session]);

  const handleToggle = (setting: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleSelectChange = (setting: string, value: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privacySettings }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }
      
      const data = await response.json();
      // Update local state with validated settings from server
      setPrivacySettings(data.privacySettings);
      toast.success('Privacy settings saved!');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to save privacy settings');
    }
  };

  const downloadData = async () => {
    try {
      const response = await fetch('/api/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'requestDataExport' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to request data export');
      }
      
      const data = await response.json();
      toast.success('Your data export request has been received. You will be notified when it\'s ready.');
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast.error('Failed to request data export');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Privacy */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Profile Privacy</h3>
            <p className="mt-1 text-sm text-gray-500">Control who can see your profile information</p>
          </div>
          
          <div className="px-4 py-5 space-y-6">
            <div>
              <label htmlFor="profile-visibility" className="block text-sm font-medium text-gray-700">Profile Visibility</label>
              <select
                id="profile-visibility"
                value={privacySettings.profileVisibility}
                onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all_platform_users">All SkyMirror Academy Users</option>
                <option value="classmates_only">Classmates Only</option>
                <option value="instructors_and_mentors">Instructors and Mentors Only</option>
                <option value="private">Private (Only You)</option>
              </select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="show-enrolled-courses" className="text-sm font-medium text-gray-700">Show Enrolled Courses</label>
                  <p className="text-xs text-gray-500">Allow others to see what courses you're enrolled in</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${privacySettings.showEnrolledCourses ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showEnrolledCourses')}
                  >
                    <span className="sr-only">Toggle enrolled courses visibility</span>
                    <span
                      className={`${privacySettings.showEnrolledCourses ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="show-achievements" className="text-sm font-medium text-gray-700">Show Achievements</label>
                  <p className="text-xs text-gray-500">Display your badges, certificates, and awards on your profile</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${privacySettings.showAchievements ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showAchievements')}
                  >
                    <span className="sr-only">Toggle achievements visibility</span>
                    <span
                      className={`${privacySettings.showAchievements ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="show-learning-activity" className="text-sm font-medium text-gray-700">Show Learning Activity</label>
                  <p className="text-xs text-gray-500">Share your learning progress and recent activity</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${privacySettings.showLearningActivity ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showLearningActivity')}
                  >
                    <span className="sr-only">Toggle learning activity visibility</span>
                    <span
                      className={`${privacySettings.showLearningActivity ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Platform Interactions */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Platform Interactions</h3>
            <p className="mt-1 text-sm text-gray-500">Manage how you interact with other users and the platform</p>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-mentor-recommendations" className="text-sm font-medium text-gray-700">Mentor Recommendations</label>
                <p className="text-xs text-gray-500">Allow the platform to suggest mentors based on your learning goals</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${privacySettings.allowMentorRecommendations ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowMentorRecommendations')}
                >
                  <span className="sr-only">Toggle mentor recommendations</span>
                  <span
                    className={`${privacySettings.allowMentorRecommendations ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-course-recommendations" className="text-sm font-medium text-gray-700">Course Recommendations</label>
                <p className="text-xs text-gray-500">Receive personalized course suggestions based on your activity</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${privacySettings.allowCourseRecommendations ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowCourseRecommendations')}
                >
                  <span className="sr-only">Toggle course recommendations</span>
                  <span
                    className={`${privacySettings.allowCourseRecommendations ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-forum-tagging" className="text-sm font-medium text-gray-700">Forum Tagging</label>
                <p className="text-xs text-gray-500">Allow other users to tag you in forum discussions</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${privacySettings.allowForumTagging ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowForumTagging')}
                >
                  <span className="sr-only">Toggle forum tagging</span>
                  <span
                    className={`${privacySettings.allowForumTagging ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-profile-searching" className="text-sm font-medium text-gray-700">Profile Searching</label>
                <p className="text-xs text-gray-500">Allow your profile to appear in search results</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${privacySettings.allowProfileSearching ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowProfileSearching')}
                >
                  <span className="sr-only">Toggle profile searching</span>
                  <span
                    className={`${privacySettings.allowProfileSearching ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data Management */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-500" />
              Data Management
            </h3>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Download Your Data</h4>
              <p className="text-sm text-gray-500 mb-3">
                You can request a copy of all the data we have stored about you, including your profile information, course progress, and activity history.
              </p>
              <button
                type="button"
                onClick={downloadData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="mr-2 h-4 w-4 text-gray-500" />
                Request Data Export
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-red-600 mb-2">Delete Account</h4>
              <p className="text-sm text-gray-500 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => toast.error('Please contact support to delete your account.')}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Privacy Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
