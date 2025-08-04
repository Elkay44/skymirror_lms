"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, User, Users, HelpCircle, Settings, Mail, Award, Calendar, BookMarked, GraduationCap, Star, Clock, Target, Edit } from 'lucide-react';

interface ProfileLayoutProps {
  children: ReactNode;
  userRole: 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';
  userName: string;
  userImage?: string | null;
  userEmail: string;
  joinDate: string; // ISO string
}

export default function ProfileLayout({
  children,
  userRole,
  userName,
  userImage,
  userEmail,
  joinDate
}: ProfileLayoutProps) {
  const pathname = usePathname();
  
  // Format join date for display
  const formattedJoinDate = new Date(joinDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Map roles to colors and styles
  const roleStyles = getRoleStyles();

  // Map roles to display text
  const roleText = {
    STUDENT: 'Student',
    INSTRUCTOR: 'Instructor',
    MENTOR: 'Mentor'
  };

  // Function to check if a link is active
  const isActiveLink = (href: string) => {
    return pathname === href || pathname.startsWith(href);
  };

  // Link style classes based on role
  const getLinkClasses = (href: string) => {
    const baseClass = "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200";
    const activeClass = `${baseClass} ${roleStyles.activeLinkBg} ${roleStyles.activeTextColor} shadow-sm`;
    const inactiveClass = `${baseClass} text-gray-700 hover:${roleStyles.hoverBg} hover:${roleStyles.hoverTextColor}`;
    
    return isActiveLink(href) ? activeClass : inactiveClass;
  };

  // Function to get role-specific styles
  function getRoleStyles() {
    switch(userRole) {
      case 'STUDENT':
        return {
          primaryColor: 'text-blue-600',
          secondaryColor: 'text-blue-500',
          activeLinkBg: 'bg-blue-50',
          activeTextColor: 'text-blue-700',
          hoverBg: 'bg-gray-50',
          hoverTextColor: 'text-blue-600',
          borderColor: 'border-blue-100',
          gradientBg: 'from-blue-50 to-indigo-50',
          iconColor: 'text-blue-500',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          buttonRing: 'focus:ring-blue-500',
          roleBadge: 'bg-blue-100 text-blue-800'
        };
      case 'INSTRUCTOR':
        return {
          primaryColor: 'text-purple-600',
          secondaryColor: 'text-purple-500',
          activeLinkBg: 'bg-purple-50',
          activeTextColor: 'text-purple-700',
          hoverBg: 'bg-gray-50',
          hoverTextColor: 'text-purple-600',
          borderColor: 'border-purple-100',
          gradientBg: 'from-purple-50 to-pink-50',
          iconColor: 'text-purple-500',
          buttonBg: 'bg-purple-600 hover:bg-purple-700',
          buttonRing: 'focus:ring-purple-500',
          roleBadge: 'bg-purple-100 text-purple-800'
        };
      case 'MENTOR':
        return {
          primaryColor: 'text-teal-600',
          secondaryColor: 'text-teal-500',
          activeLinkBg: 'bg-teal-50',
          activeTextColor: 'text-teal-700',
          hoverBg: 'bg-gray-50',
          hoverTextColor: 'text-teal-600',
          borderColor: 'border-teal-100',
          gradientBg: 'from-teal-50 to-green-50',
          iconColor: 'text-teal-500',
          buttonBg: 'bg-teal-600 hover:bg-teal-700',
          buttonRing: 'focus:ring-teal-500',
          roleBadge: 'bg-teal-100 text-teal-800'
        };
      default:
        return {
          primaryColor: 'text-blue-600',
          secondaryColor: 'text-blue-500',
          activeLinkBg: 'bg-blue-50',
          activeTextColor: 'text-blue-700',
          hoverBg: 'bg-gray-50',
          hoverTextColor: 'text-blue-600',
          borderColor: 'border-blue-100',
          gradientBg: 'from-blue-50 to-indigo-50',
          iconColor: 'text-blue-500',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          buttonRing: 'focus:ring-blue-500',
          roleBadge: 'bg-blue-100 text-blue-800'
        };
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Profile Toggle */}
        <div className="lg:hidden mb-4 bg-white rounded-xl shadow-sm overflow-hidden overflow-hidden">
          <div className="p-4 flex items-center justify-between min-w-0">
            <div className="flex items-center min-w-0">
              {userImage ? (
                <div className="relative h-10 w-10 mr-3">
                  <Image 
                    src={userImage} 
                    alt={userName} 
                    fill
                    className="rounded-full object-cover border-2 border-white"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 min-w-0">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <h2 className="text-sm font-bold text-gray-900 break-words">{userName}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleStyles.roleBadge}`}>
                  {roleText[userRole]}
                </span>
              </div>
            </div>
            <Link 
              href={`/dashboard/settings/${userRole.toLowerCase()}`}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md shadow-sm text-white ${roleStyles.buttonBg} focus:outline-none`}
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Link>
          </div>
        </div>
        
        <div className="lg:flex lg:gap-6 lg:gap-8 min-w-0">
          {/* Left Sidebar with user info and navigation */}
          <div className="lg:w-80 flex-shrink-0 min-w-0">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block sticky top-8 overflow-hidden"
            >
              {/* Profile Header with backdrop */}
              <div className="relative">
                {/* Decorative header background */}
                <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-r ${roleStyles.gradientBg} opacity-70`}></div>
                
                <div className="relative pt-16 pb-6 px-6 flex flex-col items-center min-w-0">
                  {/* Profile Image */}
                  <div className="relative -mt-16 w-24 h-24 mb-3">
                    {userImage ? (
                      <Image 
                        src={userImage} 
                        alt={userName} 
                        fill
                        className="rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-md min-w-0">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <h2 className="text-xl font-bold text-gray-900 break-words">{userName}</h2>
                  <div className="mt-1 flex items-center space-x-1 text-sm text-gray-500 break-words min-w-0">
                    <Mail className="h-3 w-3" />
                    <span>{userEmail}</span>
                  </div>
                  
                  {/* Role Badge */}
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleStyles.roleBadge}`}>
                      {roleText[userRole]}
                    </span>
                  </div>
                  
                  {/* Member Since */}
                  <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500 min-w-0">
                    <Clock className="h-3 w-3" />
                    <span>Member since {formattedJoinDate}</span>
                  </div>
                  
                  {/* Edit Profile Button */}
                  <Link 
                    href={`/dashboard/settings/${userRole.toLowerCase()}`}
                    className={`mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${roleStyles.buttonBg} focus:outline-none focus:ring-2 focus:ring-offset-2 ${roleStyles.buttonRing}`}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Link>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="px-3 py-4">
                <nav className="space-y-4 lg:space-y-6">
                  {/* Main Profile Link */}
                  <div>
                    <Link 
                      href={`/profile/${userRole.toLowerCase()}`}
                      className={getLinkClasses(`/profile/${userRole.toLowerCase()}`)}
                    >
                      <User className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                      My Profile
                    </Link>
                  </div>
                  
                  {/* Role-specific Quick Links */}
                  <div>
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 break-words">
                      Quick Links
                    </h3>
                    
                    {userRole === 'STUDENT' && (
                      <>
                        <Link href="/dashboard/courses" className={getLinkClasses('/dashboard/courses')}>
                          <BookOpen className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          My Courses
                        </Link>
                        <Link href="/dashboard/certificates" className={getLinkClasses('/dashboard/certificates')}>
                          <Award className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          Certificates
                        </Link>
                        <Link href="/dashboard/mentors" className={getLinkClasses('/dashboard/mentors')}>
                          <Users className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          Find Mentors
                        </Link>
                      </>
                    )}
                    
                    {userRole === 'INSTRUCTOR' && (
                      <>
                        <Link href="/dashboard/instructor/courses" className={getLinkClasses('/dashboard/instructor/courses')}>
                          <BookMarked className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          My Courses
                        </Link>
                        <Link href="/dashboard/instructor/students" className={getLinkClasses('/dashboard/instructor/students')}>
                          <GraduationCap className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          My Students
                        </Link>
                        <Link href="/dashboard/instructor/analytics" className={getLinkClasses('/dashboard/instructor/analytics')}>
                          <Star className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          Analytics
                        </Link>
                      </>
                    )}
                    
                    {userRole === 'MENTOR' && (
                      <>
                        <Link href="/dashboard/mentor/mentees" className={getLinkClasses('/dashboard/mentor/mentees')}>
                          <GraduationCap className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          My Mentees
                        </Link>
                        <Link href="/dashboard/mentor/calendar" className={getLinkClasses('/dashboard/mentor/calendar')}>
                          <Calendar className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          Schedule
                        </Link>
                        <Link href="/dashboard/mentor/analytics" className={getLinkClasses('/dashboard/mentor/analytics')}>
                          <Target className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                          Analytics
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {/* Settings Link */}
                  <div>
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 break-words">
                      Settings
                    </h3>
                    <Link 
                      href={`/dashboard/settings/${userRole.toLowerCase()}`}
                      className={getLinkClasses(`/dashboard/settings/${userRole.toLowerCase()}`)}
                    >
                      <Settings className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                      Account Settings
                    </Link>
                  </div>
                  
                  {/* Help and Support */}
                  <div>
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 break-words">
                      Support
                    </h3>
                    <Link href="/help" className={getLinkClasses('/help')}>
                      <HelpCircle className={`mr-3 h-5 w-5 ${roleStyles.iconColor}`} />
                      Help Center
                    </Link>
                  </div>
                </nav>
              </div>
            </motion.div>
          </div>
          
          {/* Main Content Area */}
          <div className="mt-6 lg:mt-0 lg:flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden overflow-hidden"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
