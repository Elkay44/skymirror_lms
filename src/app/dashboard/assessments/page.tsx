'use client';

import { useEffect, useState } from 'react';

interface Assessment {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  courseId?: string;
  courseName?: string;
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssessments() {
      setLoading(true);
      setError(null);
      try {
        // For demo, use mentees API and extract upcomingAssignments
        const res = await fetch('/api/mentees');
        if (!res.ok) throw new Error('Failed to fetch assessments');
        const data = await res.json();
        // Assume the user is a student and extract upcomingAssignments from the first mentee object
        const mentee = Array.isArray(data) ? data[0] : data;
        const upcomingAssignments = mentee?.upcomingAssignments || [];
        setAssessments(upcomingAssignments.map((a: any) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          status: 'Pending',
          courseId: a.courseId,
          courseName: a.courseName,
        })));
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchAssessments();
  }, []);

  if (loading) {
    return <div className="p-8">Loading assessments...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!assessments || assessments.length === 0) {
    return <div className="p-8">No upcoming assessments found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 break-words">Assessments</h1>
      <table className="min-w-full bg-white rounded shadow overflow-hidden">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Title</th>
            <th className="py-2 px-4 border-b">Due Date</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map(a => (
            <tr key={a.id}>
              <td className="py-2 px-4 border-b">{a.title}</td>
              <td className="py-2 px-4 border-b">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-'}</td>
              <td className="py-2 px-4 border-b">{a.status}</td>
              <td className="py-2 px-4 border-b">
                <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 break-words">Submit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

