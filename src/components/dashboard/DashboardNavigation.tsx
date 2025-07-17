"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Award, 
  MessageSquare, 
  Bell, 
  BarChart2, 
  BookOpen, 
  Trophy, 
  Award as Certificate, 
  Clock, 
  Users, 
  MessageCircle, 
  FileText, 
  Calendar, 
  BookMarked, 
  PenTool, 
  GraduationCap,
  FileQuestion,
  Target,
  Database,
  Home,
  UserPlus
} from 'lucide-react';

interface DashboardNavigationProps {
  unreadNotificationsCount?: number;
}

export default function DashboardNavigation({ unreadNotificationsCount = 0 }: DashboardNavigationProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'STUDENT';
  
  // Log the detected role for debugging
  console.log('DashboardNavigation detected role:', userRole, 'from session:', session?.user);
  
  // Define the active class styling for consistency across all links
  const activeLinkClass = (role: string) => {
    const baseClass = "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50";
    
    if (role === 'STUDENT') {
      return `${baseClass} text-blue-700 hover:text-blue-800`;
    } else if (role === 'INSTRUCTOR') {
      return `${baseClass} text-purple-700 hover:text-purple-800`;
    } else {
      return `${baseClass} text-teal-700 hover:text-teal-800`;
    }
  };
  
  // Define icon color class based on role
  const iconColorClass = (role: string) => {
    if (role === 'STUDENT') {
      return "text-blue-500";
    } else if (role === 'INSTRUCTOR') {
      return "text-purple-500";
    } else {
      return "text-teal-500";
    }
  };
  
  // Standard link class for inactive links
  const linkClass = "flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900";

  // Shared navigation items that appear for all roles
  const sharedNavItems = (
    <>
      {/* Notifications - important for all roles */}
      <Link
        href="/dashboard/notifications"
        className={linkClass}
      >
        <Bell className={`mr-3 h-5 w-5 ${iconColorClass(userRole)}`} />
        Notifications
        {unreadNotificationsCount > 0 && (
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {unreadNotificationsCount}
          </span>
        )}
      </Link>
      
      {/* Messages - for direct communication and notifications */}
      <Link
        href="/dashboard/messages"
        className={linkClass}
      >
        <MessageSquare className={`mr-3 h-5 w-5 ${iconColorClass(userRole)}`} />
        Messages
      </Link>
    </>
  );

  // Student-specific navigation items
  const studentNavItems = (
    <>
      {/* Overview - Main dashboard for students */}
      <Link
        href="/dashboard/student"
        className={activeLinkClass('STUDENT')}
      >
        <Home className={`mr-3 h-5 w-5 ${iconColorClass('STUDENT')}`} />
        Overview
      </Link>
      {/* My Courses - Core functionality for students */}
      <Link
        href="/dashboard/courses"
        className={activeLinkClass('STUDENT')}
      >
        <BookOpen className={`mr-3 h-5 w-5 ${iconColorClass('STUDENT')}`} />
        My Courses
      </Link>

      <div className="pt-5 pb-2">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Achievements
        </p>
      </div>

      {/* Certificates - Important credentials */}
      <Link
        href="/dashboard/certificates"
        className={linkClass}
      >
        <Certificate className={`mr-3 h-5 w-5 ${iconColorClass('STUDENT')}`} />
        Certificates
      </Link>
      
      {/* Achievements - Gamification element */}
      <Link
        href="/dashboard/achievements"
        className={linkClass}
      >
        <Trophy className={`mr-3 h-5 w-5 ${iconColorClass('STUDENT')}`} />
        Achievements
      </Link>

      {/* Mentorship - Student mentorship program */}
      <Link
        href="/dashboard/student/mentorship"
        className={linkClass}
      >
        <UserPlus className={`mr-3 h-5 w-5 ${iconColorClass('STUDENT')}`} />
        Mentorship
      </Link>

      <div className="pt-5 pb-2">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Support
        </p>
      </div>
      
      {/* Support - New section */}
      <Link
        href="/dashboard/support"
        className={linkClass}
      >
        <MessageSquare className={`mr-3 h-5 w-5 ${iconColorClass('STUDENT')}`} />
        Support
      </Link>

      {sharedNavItems}
    </>
  );

  // Instructor-specific navigation items
  const instructorNavItems = (
    <>
      {/* Overview - Main dashboard for instructors */}
      <Link
        href="/dashboard/instructor"
        className={activeLinkClass('INSTRUCTOR')}
      >
        <Home className={`mr-3 h-5 w-5 ${iconColorClass('INSTRUCTOR')}`} />
        Overview
      </Link>
      <div className="pt-5 pb-2">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Teaching
        </p>
      </div>
      
      {/* My Courses - Primary entry point for all course activities including creation */}
      <Link
        href="/dashboard/instructor/courses"
        className={activeLinkClass('INSTRUCTOR')}
      >
        <BookMarked className={`mr-3 h-5 w-5 ${iconColorClass('INSTRUCTOR')}`} />
        My Courses
      </Link>
      
      {/* Certificates - Access to certificate management */}
      <Link
        href="/dashboard/instructor/certificates"
        className={linkClass}
      >
        <Certificate className={`mr-3 h-5 w-5 ${iconColorClass('INSTRUCTOR')}`} />
        Certificates
      </Link>

      <div className="pt-5 pb-2">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Schedule & Analytics
        </p>
      </div>

      {/* Calendar for scheduling all teaching sessions */}
      <Link
        href="/calendar"
        className={linkClass}
      >
        <Calendar className={`mr-3 h-5 w-5 ${iconColorClass('INSTRUCTOR')}`} />
        Calendar
      </Link>
      
      {/* Analytics for overall teaching performance */}
      <Link
        href="/dashboard/instructor/analytics"
        className={linkClass}
      >
        <BarChart2 className={`mr-3 h-5 w-5 ${iconColorClass('INSTRUCTOR')}`} />
        Analytics
      </Link>
      
      {sharedNavItems}
    </>
  );

  // Mentor-specific navigation items
  const mentorNavItems = (
    <>
      {/* Overview - Main dashboard for mentors */}
      <Link
        href="/dashboard/mentor"
        className={activeLinkClass('MENTOR')}
      >
        <Home className={`mr-3 h-5 w-5 ${iconColorClass('MENTOR')}`} />
        Overview
      </Link>
      <div className="pt-5 pb-2">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Mentorship
        </p>
      </div>
      
      {/* My Mentees - Connected to /api/mentees endpoint */}
      <Link
        href="/dashboard/mentor/mentees"
        className={activeLinkClass('MENTOR')}
      >
        <GraduationCap className={`mr-3 h-5 w-5 ${iconColorClass('MENTOR')}`} />
        My Mentees
      </Link>

      {/* Sessions - Connected to /api/mentor/sessions endpoint */}
      <Link
        href="/dashboard/mentor/sessions"
        className={linkClass}
      >
        <Clock className={`mr-3 h-5 w-5 ${iconColorClass('MENTOR')}`} />
        Sessions
      </Link>
      
      {/* Schedule Session */}
      <Link
        href="/calendar"
        className={linkClass}
      >
        <Calendar className={`mr-3 h-5 w-5 ${iconColorClass('MENTOR')}`} />
        Schedule Session
      </Link>
      
      {/* Resource Library */}
      <Link
        href="/resources"
        className={linkClass}
      >
        <Database className={`mr-3 h-5 w-5 ${iconColorClass('MENTOR')}`} />
        Resource Library
      </Link>

      <div className="pt-5 pb-2">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Career Development
        </p>
      </div>
      
      {/* Career Paths */}
      <Link
        href="/dashboard/mentor/career-paths"
        className={linkClass}
      >
        <Target className={`mr-3 h-5 w-5 ${iconColorClass('MENTOR')}`} />
        Career Paths
      </Link>
      
      {/* Mentee Analytics */}
      <Link
        href="/dashboard/mentor/analytics"
        className={linkClass}
      >
        <BarChart2 className={`mr-3 h-5 w-5 ${iconColorClass('MENTOR')}`} />
        Mentee Analytics
      </Link>
      
      {sharedNavItems}
    </>
  );

  // Navigation section title
  const navTitle = (
    <div className="px-3 pt-4 pb-2">
      <span className="uppercase text-xs text-gray-400 font-semibold tracking-wider">Dashboard</span>
    </div>
  );

  // Display different navigation based on user role
  return (
    <nav className="space-y-1" aria-label="Sidebar">
      {navTitle}
      {userRole === 'STUDENT' && studentNavItems}
      {userRole === 'INSTRUCTOR' && instructorNavItems}
      {userRole === 'MENTOR' && mentorNavItems}
    </nav>
  );
}
