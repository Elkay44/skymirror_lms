'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

interface QuizPerformance {
  quizId: string;
  score: number;
  isPassed: boolean;
  completedAt: string;
  quiz?: {
    title: string;
  };
}

export default function LearningAnalyticsPage() {
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformance[]>([]);
  const [completedCourses, setCompletedCourses] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/analytics/user');
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setQuizPerformance(data.quizPerformance || []);
        setCompletedCourses(data.courseStats?.filter((c: any) => c.status === 'completed').length || 0);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  const quizzesAttempted = quizPerformance.length;
  const averageScore = quizzesAttempted > 0
    ? Math.round(quizPerformance.reduce((sum, q) => sum + (q.score || 0), 0) / quizzesAttempted)
    : 0;
  const quizScores = quizPerformance.map(q => ({
    name: q.quiz?.title || 'Quiz',
    score: q.score,
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 break-words">Learning Analytics</h1>
      <div className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-blue-100 rounded p-4 text-center">
            <div className="text-lg font-semibold break-words">Courses Completed</div>
            <div className="text-2xl font-bold break-words">{completedCourses}</div>
          </div>
          <div className="bg-green-100 rounded p-4 text-center">
            <div className="text-lg font-semibold break-words">Quizzes Attempted</div>
            <div className="text-2xl font-bold break-words">{quizzesAttempted}</div>
          </div>
          <div className="bg-yellow-100 rounded p-4 text-center">
            <div className="text-lg font-semibold break-words">Average Score</div>
            <div className="text-2xl font-bold break-words">{averageScore}%</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded shadow p-6 overflow-hidden">
        <h2 className="text-lg font-semibold mb-4 break-words">Quiz Scores</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quizScores} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

