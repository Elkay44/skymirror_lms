"use client";


import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Bell, Shield, User, Key, CreditCard, Layout, Fingerprint, Home, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userRole = session?.user?.role || 'STUDENT';
  
  // Define role-specific colors and styling
  const roleColor = userRole === 'STUDENT' ? 'blue' : userRole === 'INSTRUCTOR' ? 'purple' : 'teal';
  
  // Define the tabs available for settings
  const tabs = [
    {
      name: 'Account',
      href: `/dashboard/settings/${userRole.toLowerCase()}`,
      icon: User,
      forRoles: ['STUDENT', 'INSTRUCTOR', 'MENTOR'],
    },
    {
      name: 'Notifications',
      href: `/dashboard/settings/${userRole.toLowerCase()}/notifications`,
      icon: Bell,
      forRoles: ['STUDENT', 'INSTRUCTOR', 'MENTOR'],
    },
    {
      name: 'Security',
      href: `/dashboard/settings/${userRole.toLowerCase()}/security`,
      icon: Shield,
      forRoles: ['STUDENT', 'INSTRUCTOR', 'MENTOR'],
    },
    {
      name: 'Appearance',
      href: `/dashboard/settings/${userRole.toLowerCase()}/appearance`,
      icon: Layout,
      forRoles: ['STUDENT', 'INSTRUCTOR', 'MENTOR'],
    },
    {
      name: 'Billing',
      href: `/dashboard/settings/${userRole.toLowerCase()}/billing`,
      icon: CreditCard,
      forRoles: ['STUDENT', 'INSTRUCTOR', 'MENTOR'],
    },
    {
      name: 'API Keys',
      href: `/dashboard/settings/${userRole.toLowerCase()}/api-keys`,
      icon: Key,
      forRoles: ['INSTRUCTOR', 'MENTOR'],
    },
    {
      name: 'Privacy',
      href: `/dashboard/settings/${userRole.toLowerCase()}/privacy`,
      icon: Fingerprint,
      forRoles: ['STUDENT', 'INSTRUCTOR', 'MENTOR'],
    },
  ];

  // Filter tabs based on the current user's role
  const filteredTabs = tabs.filter(tab => tab.forRoles.includes(userRole));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero header with role-specific styling */}
      <div className={`bg-gradient-to-r from-${roleColor}-600 via-${roleColor}-500 to-${roleColor}-700 rounded-2xl shadow-xl mb-8 overflow-hidden`}>
        <div className="relative px-6 py-10 sm:px-10 sm:py-16 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 404 384" fill="none">
              <defs>
                <pattern id="settings-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" fill="white" />
                </pattern>
              </defs>
              <rect width="404" height="384" fill="url(#settings-pattern)" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between min-w-0">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl break-words">
                Settings
              </h1>
              <p className="mt-2 text-xl text-white opacity-80 break-words">
                Customize your {userRole.toLowerCase()} experience
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-4 py-2 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-blue-600 transition-all shadow-md break-words min-w-0 overflow-hidden"
              >
                <Home className="mr-2 h-5 w-5" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:gap-8">
        {/* Left sidebar - desktop only */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-8">
            <div className={`overflow-hidden bg-white rounded-xl shadow-sm border border-${roleColor}-100`}>
              <div className={`px-6 py-4 bg-${roleColor}-50 border-b border-${roleColor}-100`}>
                <h3 className={`text-lg font-medium text-${roleColor}-800`}>Settings</h3>
              </div>
              <nav className="py-4 px-2">
                <div className="space-y-1">
                  {filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href;
                    return (
                      <Link
                        key={tab.name}
                        href={tab.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive ? 
                          `bg-${roleColor}-50 text-${roleColor}-700` : 
                          'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                      >
                        <Icon className={`mr-3 h-5 w-5 ${isActive ? 
                          `text-${roleColor}-600` : 
                          'text-gray-400 group-hover:text-gray-500'}`} />
                        {tab.name}
                        {isActive && (
                          <svg className={`ml-auto h-5 w-5 text-${roleColor}-500`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Mentor specific links */}
            {userRole === 'MENTOR' && (
              <div className={`mt-6 overflow-hidden bg-white rounded-xl shadow-sm border border-${roleColor}-100`}>
                <div className={`px-6 py-4 bg-${roleColor}-50 border-b border-${roleColor}-100`}>
                  <h3 className={`text-lg font-medium text-${roleColor}-800`}>Mentorship Tools</h3>
                </div>
                <nav className="py-4 px-2">
                  <div className="space-y-1">
                    <Link
                      href="/dashboard/mentor/mentees"
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${pathname.includes('/dashboard/mentor/mentees') ? 
                        `bg-${roleColor}-50 text-${roleColor}-700` : 
                        'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <Users className={`mr-3 h-5 w-5 ${pathname.includes('/dashboard/mentor/mentees') ? 
                        `text-${roleColor}-600` : 
                        'text-gray-400'}`} />
                      Manage Mentees
                    </Link>
                    <Link
                      href="/dashboard/mentor/sessions"
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${pathname.includes('/dashboard/mentor/sessions') ? 
                        `bg-${roleColor}-50 text-${roleColor}-700` : 
                        'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <Calendar className={`mr-3 h-5 w-5 ${pathname.includes('/dashboard/mentor/sessions') ? 
                        `text-${roleColor}-600` : 
                        'text-gray-400'}`} />
                      Sessions
                    </Link>
                  </div>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Mobile tabs - visible on small screens only */}
        <div className="block lg:hidden mb-6 overflow-x-auto">
          <div className="bg-white shadow-sm rounded-xl overflow-hidden overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200">
              <nav className="flex space-x-4 min-w-0">
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = pathname === tab.href;
                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      className={`whitespace-nowrap flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive ? 
                        `bg-${roleColor}-50 text-${roleColor}-700` : 
                        'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Icon className={`mr-2 h-5 w-5 ${isActive ? 
                        `text-${roleColor}-600` : 
                        'text-gray-400'}`} />
                      {tab.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-hidden">
            {/* Section header */}
            <div className={`px-6 py-5 border-b border-${roleColor}-100 bg-gradient-to-r from-${roleColor}-50 to-white`}>
              {filteredTabs.map((tab) => {
                if (pathname === tab.href) {
                  const Icon = tab.icon;
                  return (
                    <div key={tab.name} className="flex items-center min-w-0">
                      <Icon className={`mr-3 h-6 w-6 text-${roleColor}-600`} />
                      <h2 className="text-xl font-semibold text-gray-900 break-words">{tab.name} Settings</h2>
                    </div>
                  );
                }
                return null;
              })}
            </div>
            {/* Content */}
            <div className="px-6 py-6 space-y-4 lg:space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
