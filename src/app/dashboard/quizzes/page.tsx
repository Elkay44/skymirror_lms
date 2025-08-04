'use client';

import { useEffect, useState } from 'react';

interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  isPassed: boolean;
  completedAt: string;
  quiz?: {
    title: string;
    courseId: string;
    course: {
      title: string;
    };
  };
}

export default function QuizzesPage() {
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/analytics/user');
        if (!res.ok) throw new Error('Failed to fetch quizzes');
        const data = await res.json();
        setQuizAttempts(data.quizPerformance || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchQuizzes();
  }, []);

  if (loading) {
    return <div className="p-8">Loading quizzes...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  if (!quizAttempts || quizAttempts.length === 0) {
    return <div className="p-8">No quiz attempts found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 break-words">Quizzes</h1>
      <table className="min-w-full bg-white rounded shadow overflow-hidden">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Title</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Last Attempt</th>
            <th className="py-2 px-4 border-b">Score</th>
            <th className="py-2 px-4 border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {quizAttempts.map((q) => {
            const status = q.isPassed ? 'Completed' : 'Attempted';
            const lastAttempt = q.completedAt ? new Date(q.completedAt).toLocaleDateString() : '-';
            const score = q.score !== undefined && q.score !== null ? q.score : '-';
            return (
              <tr key={q.id}>
                <td className="py-2 px-4 border-b">{q.quiz?.title || 'Quiz'}</td>
                <td className="py-2 px-4 border-b">{status}</td>
                <td className="py-2 px-4 border-b">{lastAttempt}</td>
                <td className="py-2 px-4 border-b">{score}</td>
                <td className="py-2 px-4 border-b">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 break-words">Retake</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

