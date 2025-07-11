/**
 * Profile page helpers - Utility functions for profile pages
 */

/**
 * Handle profile API errors consistently across all profile pages
 */
export function handleProfileError(error: unknown): string {
  console.error('Profile error:', error);
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred while loading profile data';
}

/**
 * Get user role color scheme based on role
 */
export function getRoleColorScheme(role: string): {
  primary: string;
  secondary: string;
  gradient: string;
  accent: string;
} {
  const normalizedRole = (role || '').toUpperCase();
  
  switch (normalizedRole) {
    case 'STUDENT':
      return {
        primary: 'blue',
        secondary: 'indigo',
        gradient: 'from-blue-600 to-indigo-700',
        accent: 'blue-600'
      };
    case 'INSTRUCTOR':
      return {
        primary: 'purple',
        secondary: 'indigo',
        gradient: 'from-purple-600 to-indigo-700',
        accent: 'purple-600'
      };
    case 'MENTOR':
      return {
        primary: 'teal',
        secondary: 'emerald',
        gradient: 'from-teal-600 to-emerald-700',
        accent: 'teal-600'
      };
    default:
      return {
        primary: 'gray',
        secondary: 'slate',
        gradient: 'from-gray-600 to-slate-700',
        accent: 'gray-600'
      };
  }
}
