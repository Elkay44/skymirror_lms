"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Save, Moon, Sun, Monitor } from 'lucide-react';

export default function MentorAppearanceSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Appearance settings
  const [themePreference, setThemePreference] = useState('system');
  const [fontSize, setFontSize] = useState('medium');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [colorScheme, setColorScheme] = useState('default');

  useEffect(() => {
    // Simulating loading of appearance settings
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [session]);

  const handleToggle = (setting: string) => {
    if (setting === 'reducedMotion') {
      setReducedMotion(!reducedMotion);
    } else if (setting === 'highContrast') {
      setHighContrast(!highContrast);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Appearance settings saved!');
    
    // In a real app, you would update localStorage or cookies
    // and apply the theme immediately
    if (themePreference === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (themePreference === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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

      
      <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
        {/* Theme Settings */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 break-words">Theme Settings</h3>
          </div>
          
          <div className="px-4 py-5 space-y-4 lg:space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 break-words">Theme Mode</label>
              <p className="text-xs text-gray-500 mb-3">Choose how SkyMirror Academy appears to you</p>
              
              <div className="grid grid-cols-3 gap-3">
                <div 
                  onClick={() => setThemePreference('light')}
                  className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all ${themePreference === 'light' ? 'bg-teal-50 border-2 border-teal-500' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                >
                  <Sun className="h-8 w-8 text-amber-500 mb-2" />
                  <span className="text-sm font-medium break-words">Light</span>
                </div>
                
                <div 
                  onClick={() => setThemePreference('dark')}
                  className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all ${themePreference === 'dark' ? 'bg-teal-50 border-2 border-teal-500' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                >
                  <Moon className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-sm font-medium break-words">Dark</span>
                </div>
                
                <div 
                  onClick={() => setThemePreference('system')}
                  className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all ${themePreference === 'system' ? 'bg-teal-50 border-2 border-teal-500' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                >
                  <Monitor className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="text-sm font-medium break-words">System</span>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="font-size" className="block text-sm font-medium text-gray-700 break-words">Font Size</label>
              <p className="text-xs text-gray-500 mb-3">Adjust the text size throughout the platform</p>
              
              <select
                id="font-size"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              >
                <option value="small">Small</option>
                <option value="medium">Medium (Default)</option>
                <option value="large">Large</option>
                <option value="x-large">Extra Large</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="color-scheme" className="block text-sm font-medium text-gray-700 break-words">Color Scheme</label>
              <p className="text-xs text-gray-500 mb-3">Choose your preferred accent color</p>
              
              <select
                id="color-scheme"
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm break-words"
              >
                <option value="default">Teal (Default)</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="cyan">Cyan</option>
                <option value="emerald">Emerald</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Accessibility Settings */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 break-words">Accessibility</h3>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div className="flex items-center justify-between min-w-0">
              <div>
                <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-700 break-words">Reduced Motion</label>
                <p className="text-xs text-gray-500">Minimize animations throughout the interface</p>
              </div>
              <div className="ml-4 flex-shrink-0 min-w-0">
                <button
                  type="button"
                  className={`${reducedMotion ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('reducedMotion')}
                >
                  <span className="sr-only">Toggle reduced motion</span>
                  <span
                    className={`${reducedMotion ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between min-w-0">
              <div>
                <label htmlFor="high-contrast" className="text-sm font-medium text-gray-700 break-words">High Contrast</label>
                <p className="text-xs text-gray-500">Increase contrast for better readability</p>
              </div>
              <div className="ml-4 flex-shrink-0 min-w-0">
                <button
                  type="button"
                  className={`${highContrast ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  onClick={() => handleToggle('highContrast')}
                >
                  <span className="sr-only">Toggle high contrast</span>
                  <span
                    className={`${highContrast ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
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
              Save Appearance Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
