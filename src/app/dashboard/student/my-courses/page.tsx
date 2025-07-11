"use client";

import React, { useEffect, useState } from "react";

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    description?: string;
  };
  progress: number;
}

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/enrollment");
        if (!response.ok) {
          throw new Error("Failed to fetch enrollments");
        }
        const data = await response.json();
        setEnrollments(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  if (loading) {
    return <div className="px-6 py-8">Loading your courses...</div>;
  }
  if (error) {
    return <div className="px-6 py-8 text-red-600">Error: {error}</div>;
  }
  if (enrollments.length === 0) {
    return <div className="px-6 py-8">You are not enrolled in any courses yet.</div>;
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">My Courses</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="border rounded-lg p-4 shadow hover:shadow-lg transition duration-200 bg-white"
          >
            <h2 className="text-xl font-semibold mb-2">{enrollment.course.title}</h2>
            <div className="mb-2 text-gray-600">Status: {enrollment.status}</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${enrollment.progress}%` }}
              ></div>
            </div>
            <a
              href={`/courses/${enrollment.course.id}`}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition inline-block text-center"
            >
              Go to Course
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
