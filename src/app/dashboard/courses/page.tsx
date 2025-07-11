import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function CoursesRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) {
    // Not authenticated, go to login or home
    redirect('/login');
  }
  if (session.user.role === 'INSTRUCTOR') {
    redirect('/dashboard/instructor/courses');
  } else {
    // Default to student (or mentor etc)
    redirect('/dashboard/student/my-courses');
  }
  // Fallback (should never render)
  return null;
}
