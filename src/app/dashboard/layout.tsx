"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import NotificationIcon from '@/components/dashboard/NotificationIcon';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  
  // Fetch unread notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          const unreadCount = data.notifications.filter((notification: any) => !notification.isRead).length;
          setUnreadNotificationsCount(unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (session?.user) {
      fetchNotifications();
      
      // Set up interval to periodically check for new notifications
      const intervalId = setInterval(fetchNotifications, 60000); // every minute
      
      return () => clearInterval(intervalId);
    }
  }, [session]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link href="/" className="flex items-center">
                  <span className="font-semibold text-xl tracking-tight text-indigo-600">SkyMirror Academy</span>
                </Link>
              </div>
              <div className="mt-5 flex-1 px-2 bg-white space-y-1">
                {/* This is where we restore the original dashboard navigation */}
                <DashboardNavigation unreadNotificationsCount={unreadNotificationsCount} />
              </div>
            </div>
            {/* Profile section with role badge */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      {session?.user?.image ? (
                        <Image
                          className="inline-block h-9 w-9 rounded-full"
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={36}
                          height={36}
                        />
                      ) : (
                        <div className="inline-block h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex flex-col">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {session?.user?.name || 'User'}
                        </p>
                        {session?.user?.role && (
                          <div className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-md ${
                            session.user.role === 'STUDENT' ? 'bg-blue-100 text-blue-800' : 
                            session.user.role === 'INSTRUCTOR' ? 'bg-purple-100 text-purple-800' : 
                            'bg-teal-100 text-teal-800'
                          }`}>
                            {session.user.role.charAt(0) + session.user.role.slice(1).toLowerCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {session?.user?.email || ''}
                      </p>
                      <div className="flex space-x-3 mt-1.5">
                        <Link href="/profile" className="text-xs font-medium text-gray-500 hover:text-gray-700">
                          Profile
                        </Link>
                        <Link href={`/dashboard/settings/${session?.user?.role?.toLowerCase() || 'student'}`} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                          Settings
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search"
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification icon */}
              <NotificationIcon unreadCount={unreadNotificationsCount} />

              {/* Profile dropdown with role badge */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  {/* Role badge */}
                  {session?.user?.role && (
                    <div className={`mr-2 px-2 py-1 text-xs font-medium rounded-md ${
                      session.user.role === 'STUDENT' ? 'bg-blue-100 text-blue-800' : 
                      session.user.role === 'INSTRUCTOR' ? 'bg-purple-100 text-purple-800' : 
                      'bg-teal-100 text-teal-800'
                    }`}>
                      {session.user.role.charAt(0) + session.user.role.slice(1).toLowerCase()}
                    </div>
                  )}
                  
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      id="user-menu-button"
                      aria-expanded="false"
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      {session?.user?.image ? (
                        <Image
                          className="h-8 w-8 rounded-full"
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </button>
                    <button 
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="ml-2 px-3 py-2 text-sm font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center"
                      aria-label="Sign out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm0 1h12v12H3V4zm7 3a1 1 0 10-2 0v4a1 1 0 102 0V7zm3.707.293a1 1 0 00-1.414 1.414L13.586 10l-1.293 1.293a1 1 0 101.414 1.414l2-2a1 1 0 000-1.414l-2-2z" clipRule="evenodd" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Main Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
