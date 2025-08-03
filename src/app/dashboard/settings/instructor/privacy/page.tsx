"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Save, Download, Shield } from 'lucide-react';

export default function InstructorPrivacySettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'all_platform_users',
    showCourseStatistics: true,
    showRatings: true,
    showTeachingHistory: true,
    allowStudentMessaging: true,
    allowCourseFeedback: true,
    allowProfileSearching: true,
    allowOtherInstructorsToViewMaterials: false
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
      
      toast.success('Your data export request has been received. You will be notified when it\'s ready.');
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast.error('Failed to request data export');
    }
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
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Privacy */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Profile Privacy</h3>
            <p className="mt-1 text-sm text-gray-500">Control who can see your instructor profile information</p>
          </div>
          
          <div className="px-4 py-5 space-y-6">
            <div>
              <label htmlFor="profile-visibility" className="block text-sm font-medium text-gray-700">Profile Visibility</label>
              <select
                id="profile-visibility"
                value={privacySettings.profileVisibility}
                onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="all_platform_users">All SkyMirror Academy Users</option>
                <option value="students_only">Students Only</option>
                <option value="instructors_only">Other Instructors Only</option>
                <option value="enrolled_students">Only Students Enrolled in My Courses</option>
                <option value="private">Private (Only You and Admins)</option>
              </select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="show-course-statistics" className="text-sm font-medium text-gray-700">Show Course Statistics</label>
                  <p className="text-xs text-gray-500">Display statistics about your courses and student numbers</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${privacySettings.showCourseStatistics ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showCourseStatistics')}
                  >
                    <span className="sr-only">Toggle course statistics visibility</span>
                    <span
                      className={`${privacySettings.showCourseStatistics ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="show-ratings" className="text-sm font-medium text-gray-700">Show Ratings</label>
                  <p className="text-xs text-gray-500">Display your course ratings and student feedback</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${privacySettings.showRatings ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showRatings')}
                  >
                    <span className="sr-only">Toggle ratings visibility</span>
                    <span
                      className={`${privacySettings.showRatings ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="show-teaching-history" className="text-sm font-medium text-gray-700">Show Teaching History</label>
                  <p className="text-xs text-gray-500">Display your previous teaching experience and history</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className={`${privacySettings.showTeachingHistory ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showTeachingHistory')}
                  >
                    <span className="sr-only">Toggle teaching history visibility</span>
                    <span
                      className={`${privacySettings.showTeachingHistory ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Course Privacy and Communication */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Course Privacy & Communication</h3>
            <p className="mt-1 text-sm text-gray-500">Manage how students and other instructors interact with you and your content</p>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-student-messaging" className="text-sm font-medium text-gray-700">Student Direct Messaging</label>
                <p className="text-xs text-gray-500">Allow students to send you direct messages</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${privacySettings.allowStudentMessaging ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowStudentMessaging')}
                >
                  <span className="sr-only">Toggle student messaging</span>
                  <span
                    className={`${privacySettings.allowStudentMessaging ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-course-feedback" className="text-sm font-medium text-gray-700">Course Feedback</label>
                <p className="text-xs text-gray-500">Allow students to provide feedback and ratings on your courses</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${privacySettings.allowCourseFeedback ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowCourseFeedback')}
                >
                  <span className="sr-only">Toggle course feedback</span>
                  <span
                    className={`${privacySettings.allowCourseFeedback ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-profile-searching" className="text-sm font-medium text-gray-700">Profile Searching</label>
                <p className="text-xs text-gray-500">Allow your profile to appear in instructor search results</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${privacySettings.allowProfileSearching ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowProfileSearching')}
                >
                  <span className="sr-only">Toggle profile searching</span>
                  <span
                    className={`${privacySettings.allowProfileSearching ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="allow-other-instructors-to-view-materials" className="text-sm font-medium text-gray-700">Content Sharing with Instructors</label>
                <p className="text-xs text-gray-500">Allow other instructors to view your course materials for reference</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${privacySettings.allowOtherInstructorsToViewMaterials ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowOtherInstructorsToViewMaterials')}
                >
                  <span className="sr-only">Toggle content sharing with instructors</span>
                  <span
                    className={`${privacySettings.allowOtherInstructorsToViewMaterials ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
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
              <Shield className="mr-2 h-5 w-5 text-purple-500" />
              Data Management
            </h3>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Download Your Data</h4>
              <p className="text-sm text-gray-500 mb-3">
                You can request a copy of all the data we have stored about you, including your profile information, course content, student interactions, and analytics.
              </p>
              <button
                type="button"
                onClick={downloadData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Download className="mr-2 h-4 w-4 text-gray-500" />
                Request Data Export
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-red-600 mb-2">Delete Account</h4>
              <p className="text-sm text-gray-500 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone. Note that course content you've created will remain available to enrolled students unless you explicitly request content removal.
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
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
