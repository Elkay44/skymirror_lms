import Link from 'next/link';
import { useSession } from 'next-auth/react';

type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'MENTOR';

// Define the session user type with role property
type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
};

type ActionConfig = {
  href: string;
  text: string;
};

type RoleConfig = {
  bgColor: string;
  borderColor: string;
  primaryColor: string;
  secondaryColor: string;
  primaryAction: ActionConfig;
  secondaryAction: ActionConfig;
  description: string;
};

type RoleConfigMap = {
  [key in UserRole]: RoleConfig;
};

export default function RoleWelcomeBanner() {
  const { data: session } = useSession();

  if (!session?.user?.role) return null;

  const roleConfig: RoleConfigMap = {
    STUDENT: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      primaryColor: 'bg-blue-600 hover:bg-blue-700',
      secondaryColor: 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-50',
      primaryAction: {
        href: "/dashboard/courses",
        text: "Resume Learning"
      },
      secondaryAction: {
        href: "/courses",
        text: "Find New Courses"
      },
      description: 'Track your learning progress and explore courses'
    },
    INSTRUCTOR: {
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      primaryColor: 'bg-purple-600 hover:bg-purple-700',
      secondaryColor: 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-50',
      primaryAction: {
        href: "/dashboard/instructor/courses/create",
        text: "Create Course"
      },
      secondaryAction: {
        href: "/dashboard/instructor/students",
        text: "View Students"
      },
      description: 'Manage your courses and engage with students'
    },
    MENTOR: {
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100',
      primaryColor: 'bg-teal-600 hover:bg-teal-700',
      secondaryColor: 'bg-white border border-teal-300 text-teal-700 hover:bg-teal-50',
      primaryAction: {
        href: "/dashboard/mentor/calendar",
        text: "Schedule Session"
      },
      secondaryAction: {
        href: "/dashboard/mentor/mentees",
        text: "View Mentees"
      },
      description: 'Connect with your mentees and manage your sessions'
    }
  };

  // Safely cast the role to our UserRole type and provide default
  const userRole = (session.user.role as UserRole) || 'STUDENT';
  
  // Get the config for this role or default to STUDENT if not found
  const config = roleConfig[userRole] || roleConfig.STUDENT;

  return (
    <div className={`w-full px-6 py-4 mb-6 ${config.bgColor} border-b ${config.borderColor} rounded-lg`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="mb-4 md:mb-0">
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome back, {session.user.name || 'User'}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {config.description}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link 
            href={config.primaryAction.href}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${config.primaryColor}`}
          >
            {config.primaryAction.text}
          </Link>
          <Link 
            href={config.secondaryAction.href}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${config.secondaryColor}`}
          >
            {config.secondaryAction.text}
          </Link>
        </div>
      </div>
    </div>
  );
}
