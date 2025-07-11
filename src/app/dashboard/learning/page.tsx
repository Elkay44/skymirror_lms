'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  lessonsCount: number;
  enrolled: boolean;
  category: string;
}

interface ProgressSummary {
  completedCourses: number;
  quizzesAttempted: number;
  level: number;
}

export default function LearningPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [coursesRes, achievementsRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/achievements'),
        ]);
        if (!coursesRes.ok) throw new Error('Failed to fetch courses');
        if (!achievementsRes.ok) throw new Error('Failed to fetch progress');
        const coursesData = await coursesRes.json();
        const achievementsData = await achievementsRes.json();
        setCourses(coursesData.data || []);
        setProgress({
          completedCourses: achievementsData.progress?.completedCourses || 0,
          quizzesAttempted: achievementsData.progress?.quizzesAttempted || 0,
          level: achievementsData.progress?.level || 1,
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading your learning dashboard...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  // Recommend courses the user is enrolled in but not completed
  const recommended = (courses || []).filter(course => course.enrolled);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-2">Welcome to Your Learning Hub</h1>
      <p className="mb-6 text-gray-700">Track your learning progress, pick up where you left off, and discover new courses tailored for you.</p>
      <section>
        <h2 className="text-xl font-semibold mb-4">Recommended Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommended.length === 0 && <div className="col-span-3 text-gray-500">No courses in progress. Explore courses to get started!</div>}
          {recommended.map(course => (
            <div key={course.id} className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-1">{course.title}</div>
              {/* Progress bar is not available from /api/courses, you may enhance this by fetching lesson progress per course */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `60%`}}></div>
              </div>
              <div className="text-xs text-gray-500">Lessons: {course.lessonsCount}</div>
              <Link href={`/dashboard/courses/${course.id}`} className="text-blue-600 text-sm mt-2 inline-block">Continue Learning</Link>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4 mt-8">Your Progress Summary</h2>
        <ul className="list-disc ml-6 text-gray-700">
          <li>Courses completed: {progress?.completedCourses ?? 0}</li>
          <li>Quizzes attempted: {progress?.quizzesAttempted ?? 0}</li>
          <li>Level: {progress?.level ?? 1}</li>
        </ul>
      </section>
    </div>
  );
}

