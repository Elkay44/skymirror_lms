"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

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
    return (
      <div className="px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Learning</h1>
          <Link
            href="/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Enroll in New Courses
          </Link>
        </div>
        <div>Loading your courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Learning</h1>
          <Link
            href="/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Enroll in New Courses
          </Link>
        </div>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Learning</h1>
          <Link
            href="/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Enroll in New Courses
          </Link>
        </div>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">No courses enrolled yet</h3>
            <p className="text-gray-600 mb-6">
              Start your learning journey by exploring our course catalog.
            </p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Learning</h1>
        <Link
          href="/courses"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Enroll in New Courses
        </Link>
      </div>
      
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
            <Link
              href={`/courses/${enrollment.course.id}`}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition inline-block text-center"
            >
              Go to Course
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
