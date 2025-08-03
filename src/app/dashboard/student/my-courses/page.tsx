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
  const [activeTab, setActiveTab] = useState<'my-courses' | 'enroll'>('my-courses');

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

  const renderMyCoursesContent = () => {
    if (loading) {
      return <div className="py-8">Loading your courses...</div>;
    }
    if (error) {
      return <div className="py-8 text-red-600">Error: {error}</div>;
    }
    if (enrollments.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-600 mb-4">You are not enrolled in any courses yet.</p>
          <button
            onClick={() => setActiveTab('enroll')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Browse Available Courses
          </button>
        </div>
      );
    }

    return (
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
    );
  };

  const renderEnrollContent = () => {
    return (
      <div className="py-8 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-semibold mb-4">Ready to Learn Something New?</h3>
          <p className="text-gray-600 mb-6">
            Explore our course catalog and find the perfect course to advance your skills.
          </p>
          <Link
            href="/courses"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Browse All Courses
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">My Learning</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'my-courses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Courses
            {enrollments.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                {enrollments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('enroll')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'enroll'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Enroll in New Courses
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'my-courses' && renderMyCoursesContent()}
        {activeTab === 'enroll' && renderEnrollContent()}
      </div>
    </div>
  );
}
