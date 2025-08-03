'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, 
  HelpCircle, 
  Home, 
  User,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Get user role from session
  const userRole = session?.user?.role || 'STUDENT';
  
  // Close the mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:h-screen lg:z-auto`}>
          <div className="flex flex-col h-full">
            {/* Logo and close button */}
            <div className="p-4 border-b flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image
                  src="/logo.svg"
                  alt="Skymirror Academy"
                  width={40}
                  height={40}
                />
                <span className="text-xl font-bold text-gray-900">
                  SkyMirror LMS
                </span>
              </Link>
              
              {/* Close button - mobile only */}
              <button
                className="lg:hidden -mr-1 flex h-10 w-10 items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {userRole === 'STUDENT' && (
                <>
                  <Link 
                    href="/dashboard" 
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Home className="w-5 h-5 mr-3" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    href="/courses" 
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      pathname === '/courses' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 mr-3" />
                    <span>My Courses</span>
                  </Link>
                  <Link 
                    href="/dashboard/mentorship" 
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      pathname === '/dashboard/mentorship' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-5 h-5 mr-3" />
                    <span>Mentorship</span>
                  </Link>
                </>
              )}

              {userRole === 'INSTRUCTOR' && (
                <>
                  <Link 
                    href="/instructor" 
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      pathname === '/instructor' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Home className="w-5 h-5 mr-3" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    href="/instructor/courses" 
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      pathname.startsWith('/instructor/courses') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 mr-3" />
                    <span>My Courses</span>
                  </Link>
                </>
              )}

              <div className="border-t border-gray-200 my-4"></div>
              
              {/* Common Links */}
              <Link 
                href="/dashboard/notifications" 
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  pathname === '/dashboard/notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Bell className="w-5 h-5 mr-3" />
                <span>Notifications</span>
              </Link>
              <Link 
                href="/dashboard/support" 
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  pathname === '/dashboard/support' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                <span>Support</span>
              </Link>
              
              {/* User Profile */}
              <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userRole.toLowerCase()}
                    </p>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="ml-auto p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top navigation */}
          <header className="bg-white shadow-sm z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <button
                    type="button"
                    className="lg:hidden px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 flex items-center md:ml-6">
                    <button
                      type="button"
                      className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <span className="sr-only">View notifications</span>
                      <Bell className="h-6 w-6" aria-hidden="true" />
                    </button>

                    {/* Profile dropdown */}
                    <div className="ml-3 relative">
                      <div>
                        <button
                          type="button"
                          className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          id="user-menu"
                          aria-expanded="false"
                          aria-haspopup="true"
                          onClick={() => setUserMenuOpen(!userMenuOpen)}
                        >
                          <span className="sr-only">Open user menu</span>
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                        </button>
                      </div>

                      {userMenuOpen && (
                        <div
                          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="user-menu"
                        >
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Your Profile
                          </Link>
                          <Link
                            href="/settings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Settings
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                          >
                            Sign out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Page title */}
                <h1 className="text-2xl font-semibold text-gray-900">
                  {pathname === '/dashboard' ? 'Dashboard' : 
                   pathname.startsWith('/courses') ? 'My Courses' :
                   pathname.startsWith('/instructor') ? 'Instructor Dashboard' : ''}
                </h1>
                
                {/* Page content */}
                <div className="py-4">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
