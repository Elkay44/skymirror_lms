"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Fingerprint, Save, Download, Shield } from 'lucide-react';

export default function MentorPrivacySettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'all_platform_users',
    showMentorshipStatistics: true,
    showAvailability: true,
    showExpertiseAreas: true,
    allowMenteeMessaging: true,
    allowMenteeReviews: true,
    allowProfileSearching: true,
    visibleToNonMentees: true
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
      <div className="flex justify-center items-center h-64 min-w-0">
        <div className="animate-spin h-8 w-8 border-4 border-teal-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 flex items-center break-words min-w-0">
        <Fingerprint className="mr-2 h-5 w-5 text-teal-500" />
        Privacy Settings
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
        {/* Profile Privacy */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 break-words">Profile Privacy</h3>
            <p className="mt-1 text-sm text-gray-500 break-words">Control who can see your mentor profile information</p>
          </div>
          
          <div className="px-4 py-5 space-y-4 lg:space-y-6">
            <div>
              <label htmlFor="profile-visibility" className="block text-sm font-medium text-gray-700 break-words">Profile Visibility</label>
              <select
                id="profile-visibility"
                value={privacySettings.profileVisibility}
                onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              >
                <option value="all_platform_users">All SkyMirror Academy Users</option>
                <option value="students_only">Students Only</option>
                <option value="mentors_only">Other Mentors Only</option>
                <option value="active_mentees">Only My Active Mentees</option>
                <option value="private">Private (Only You and Admins)</option>
              </select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <label htmlFor="show-mentorship-statistics" className="text-sm font-medium text-gray-700 break-words">Show Mentorship Statistics</label>
                  <p className="text-xs text-gray-500">Display statistics about your mentorship sessions and success stories</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${privacySettings.showMentorshipStatistics ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showMentorshipStatistics')}
                  >
                    <span className="sr-only">Toggle mentorship statistics visibility</span>
                    <span
                      className={`${privacySettings.showMentorshipStatistics ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <label htmlFor="show-availability" className="text-sm font-medium text-gray-700 break-words">Show Availability Schedule</label>
                  <p className="text-xs text-gray-500">Display your mentoring availability calendar publicly</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${privacySettings.showAvailability ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showAvailability')}
                  >
                    <span className="sr-only">Toggle availability visibility</span>
                    <span
                      className={`${privacySettings.showAvailability ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <label htmlFor="show-expertise-areas" className="text-sm font-medium text-gray-700 break-words">Show Expertise Areas</label>
                  <p className="text-xs text-gray-500">Display your areas of expertise and specialization</p>
                </div>
                <div className="ml-4 flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    className={`${privacySettings.showExpertiseAreas ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    onClick={() => handleToggle('showExpertiseAreas')}
                  >
                    <span className="sr-only">Toggle expertise areas visibility</span>
                    <span
                      className={`${privacySettings.showExpertiseAreas ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mentorship Privacy and Communication */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 break-words">Mentorship & Communication</h3>
            <p className="mt-1 text-sm text-gray-500 break-words">Manage how students and potential mentees interact with you</p>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <label htmlFor="allow-mentee-messaging" className="text-sm font-medium text-gray-700 break-words">Mentee Direct Messaging</label>
                <p className="text-xs text-gray-500">Allow students to send you direct messages</p>
              </div>
              <div className="ml-4 flex-shrink-0 min-w-0">
                <button
                  type="button"
                  className={`${privacySettings.allowMenteeMessaging ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowMenteeMessaging')}
                >
                  <span className="sr-only">Toggle mentee messaging</span>
                  <span
                    className={`${privacySettings.allowMenteeMessaging ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between min-w-0">
              <div>
                <label htmlFor="allow-mentee-reviews" className="text-sm font-medium text-gray-700 break-words">Mentee Reviews</label>
                <p className="text-xs text-gray-500">Allow mentees to leave reviews and ratings about your mentorship</p>
              </div>
              <div className="ml-4 flex-shrink-0 min-w-0">
                <button
                  type="button"
                  className={`${privacySettings.allowMenteeReviews ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowMenteeReviews')}
                >
                  <span className="sr-only">Toggle mentee reviews</span>
                  <span
                    className={`${privacySettings.allowMenteeReviews ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between min-w-0">
              <div>
                <label htmlFor="allow-profile-searching" className="text-sm font-medium text-gray-700 break-words">Profile Searching</label>
                <p className="text-xs text-gray-500">Allow your profile to appear in mentor search results</p>
              </div>
              <div className="ml-4 flex-shrink-0 min-w-0">
                <button
                  type="button"
                  className={`${privacySettings.allowProfileSearching ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('allowProfileSearching')}
                >
                  <span className="sr-only">Toggle profile searching</span>
                  <span
                    className={`${privacySettings.allowProfileSearching ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between min-w-0">
              <div>
                <label htmlFor="visible-to-non-mentees" className="text-sm font-medium text-gray-700 break-words">Visible to Non-Mentees</label>
                <p className="text-xs text-gray-500">Allow students who aren't your current mentees to view your profile and request mentorship</p>
              </div>
              <div className="ml-4 flex-shrink-0 min-w-0">
                <button
                  type="button"
                  className={`${privacySettings.visibleToNonMentees ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('visibleToNonMentees')}
                >
                  <span className="sr-only">Toggle visibility to non-mentees</span>
                  <span
                    className={`${privacySettings.visibleToNonMentees ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data Management */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center break-words min-w-0">
              <Shield className="mr-2 h-5 w-5 text-teal-500" />
              Data Management
            </h3>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 break-words">Download Your Data</h4>
              <p className="text-sm text-gray-500 mb-3 break-words">
                You can request a copy of all the data we have stored about you, including your profile information, mentorship history, communication records, and analytics.
              </p>
              <button
                type="button"
                onClick={downloadData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
              >
                <Download className="mr-2 h-4 w-4 text-gray-500" />
                Request Data Export
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-red-600 mb-2 break-words">Delete Account</h4>
              <p className="text-sm text-gray-500 mb-3 break-words">
                Permanently delete your account and all associated data. This action cannot be undone. Note that your active mentorships will be reassigned to other mentors to ensure continuity for your mentees.
              </p>
              <button
                type="button"
                onClick={() => toast.error('Please contact support to delete your account.')}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 break-words min-w-0"
              >
                Delete My Account
              </button>
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
              Save Privacy Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
