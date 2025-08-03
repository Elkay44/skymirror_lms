"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Save, Key, Lock, Eye, EyeOff } from 'lucide-react';

export default function StudentSecuritySettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Security form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  useEffect(() => {
    // Simulating loading of security settings
    // In a real app, you would fetch from API
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [session]);

  const handleToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password validation
    if (newPassword && newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // In a real app, you would save to API
    toast.success('Security settings saved!');
    
    // Reset password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
        {/* Password Management */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Key className="mr-2 h-5 w-5 text-blue-500" />
              Password Management
            </h3>
          </div>
          <div className="px-4 py-5 space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters and include a mix of letters, numbers, and special characters.
              </p>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Security Settings */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Lock className="mr-2 h-5 w-5 text-blue-500" />
              Additional Security
            </h3>
          </div>
          <div className="px-4 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="two-factor" className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className={`${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={handleToggle}
                >
                  <span className="sr-only">Toggle two-factor authentication</span>
                  <span
                    className={`${twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700">
                Session Timeout (minutes)
              </label>
              <select
                id="session-timeout"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                How long before your session automatically logs out due to inactivity.
              </p>
            </div>
            
            <div className="pt-4">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                onClick={() => toast.success('Security log viewed!')}
              >
                View recent login activity
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
              Save Security Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
