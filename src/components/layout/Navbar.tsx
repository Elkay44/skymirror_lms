import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';


export default function Navbar() {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'ADMIN';
  const isInstructor = session?.user?.role === 'INSTRUCTOR' || isAdmin;
  const isMentor = session?.user?.role === 'MENTOR' || isAdmin;

  const dashboardLinks = [
    ...(isAdmin ? [{ name: 'Admin', href: '/admin/dashboard' }] : []),
    ...(isInstructor ? [{ name: 'Instructor', href: '/dashboard/instructor' }] : []),
    ...(isMentor ? [{ name: 'Mentor', href: '/dashboard/mentor' }] : []),
    ...(session ? [{ name: 'Student', href: '/dashboard/student' }] : []),
  ];

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 min-w-0">
          <div className="flex min-w-0">
            <Link href="/" className="flex items-center min-w-0">
              <span className="text-xl font-bold break-words">SkyMirror LMS</span>
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:ml-6 min-w-0">
            <div className="ml-3 relative">
              {session ? (
                <div className="flex items-center space-x-4 min-w-0">
                  {/* Dashboard dropdown menu for all roles */}
                  <div className="relative group">
                    <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center focus:outline-none break-words min-w-0">
                      Dashboard
                      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className="absolute left-0 z-10 mt-2 w-48 bg-white text-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity overflow-hidden">
                      {(() => {
                        const role = session?.user?.role;
                        if (role === 'INSTRUCTOR') {
                          return (
                            <div className="py-1">
                              <Link href="/dashboard/instructor" className="block px-4 py-2 hover:bg-gray-100">Main Dashboard</Link>
                              <Link href="/courses" className="block px-4 py-2 hover:bg-gray-100">My Courses</Link>
                              <Link href="/dashboard/achievements" className="block px-4 py-2 hover:bg-gray-100">Achievements</Link>
                              <Link href="/dashboard/certificates" className="block px-4 py-2 hover:bg-gray-100">Certificates</Link>
                              <Link href="/dashboard/mentorship" className="block px-4 py-2 hover:bg-gray-100">Mentorship</Link>
                              <Link href="/dashboard/support" className="block px-4 py-2 hover:bg-gray-100">Support</Link>
                              <Link href="/dashboard/notifications" className="block px-4 py-2 hover:bg-gray-100">Notifications</Link>
                              <Link href="/dashboard/messages" className="block px-4 py-2 hover:bg-gray-100">Messages</Link>
                            </div>
                          );
                        }
                        if (role === 'STUDENT') {
                          return (
                            <div className="py-1">
                              <Link href="/dashboard/student" className="block px-4 py-2 hover:bg-gray-100">Main Dashboard</Link>
                              <Link href="/courses" className="block px-4 py-2 hover:bg-gray-100">My Courses</Link>
                              <Link href="/dashboard/achievements" className="block px-4 py-2 hover:bg-gray-100">Achievements</Link>
                              <Link href="/dashboard/certificates" className="block px-4 py-2 hover:bg-gray-100">Certificates</Link>
                              <Link href="/dashboard/mentorship" className="block px-4 py-2 hover:bg-gray-100">Mentorship</Link>
                              <Link href="/dashboard/support" className="block px-4 py-2 hover:bg-gray-100">Support</Link>
                              <Link href="/dashboard/notifications" className="block px-4 py-2 hover:bg-gray-100">Notifications</Link>
                              <Link href="/dashboard/messages" className="block px-4 py-2 hover:bg-gray-100">Messages</Link>
                            </div>
                          );
                        }
                        if (role === 'MENTOR') {
                          return (
                            <div className="py-1">
                              <Link href="/dashboard/mentor" className="block px-4 py-2 hover:bg-gray-100">Main Dashboard</Link>
                              <Link href="/dashboard/mentorship" className="block px-4 py-2 hover:bg-gray-100">Mentorship</Link>
                              <Link href="/dashboard/support" className="block px-4 py-2 hover:bg-gray-100">Support</Link>
                              <Link href="/dashboard/notifications" className="block px-4 py-2 hover:bg-gray-100">Notifications</Link>
                              <Link href="/dashboard/messages" className="block px-4 py-2 hover:bg-gray-100">Messages</Link>
                            </div>
                          );
                        }
                        if (role === 'ADMIN') {
                          return (
                            <div className="py-1">
                              <Link href="/admin/dashboard" className="block px-4 py-2 hover:bg-gray-100">Admin Dashboard</Link>
                              <Link href="/dashboard/instructor" className="block px-4 py-2 hover:bg-gray-100">Instructor Dashboard</Link>
                              <Link href="/dashboard/student" className="block px-4 py-2 hover:bg-gray-100">Student Dashboard</Link>
                              <Link href="/dashboard/mentor" className="block px-4 py-2 hover:bg-gray-100">Mentor Dashboard</Link>
                              <Link href="/courses" className="block px-4 py-2 hover:bg-gray-100">My Courses</Link>
                              <Link href="/dashboard/achievements" className="block px-4 py-2 hover:bg-gray-100">Achievements</Link>
                              <Link href="/dashboard/certificates" className="block px-4 py-2 hover:bg-gray-100">Certificates</Link>
                              <Link href="/dashboard/mentorship" className="block px-4 py-2 hover:bg-gray-100">Mentorship</Link>
                              <Link href="/dashboard/support" className="block px-4 py-2 hover:bg-gray-100">Support</Link>
                              <Link href="/dashboard/notifications" className="block px-4 py-2 hover:bg-gray-100">Notifications</Link>
                              <Link href="/dashboard/messages" className="block px-4 py-2 hover:bg-gray-100">Messages</Link>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Main Navigation Items */}
                  {dashboardLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link href="/courses" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">My Courses</Link>
                  <Link href="/dashboard/achievements" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">Achievements</Link>
                  <Link href="/dashboard/certificates" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">Certificates</Link>
                  <Link href="/dashboard/mentorship" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">Mentorship</Link>
                  <Link href="/dashboard/support" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">Support</Link>
                  <Link href="/dashboard/notifications" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">Notifications</Link>
                  <Link href="/dashboard/messages" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">Messages</Link>

                  <Link href="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">
                    Profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 min-w-0">
                  <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">
                    Login
                  </Link>
                  <Link href="/register" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 break-words">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
