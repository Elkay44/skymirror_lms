'use client';

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
}

export default function AssignmentSubmitPage() {
  const { courseId, assignmentId } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}`);
        if (!response.ok) throw new Error("Failed to fetch assignment details");
        const data = await response.json();
        setAssignment(data.assignment || data); // fallback for direct assignment object
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [courseId, assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError("Please select a file to upload.");
        setSubmitting(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("comment", comment);
      const response = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to submit assignment");
      setSuccess(true);
      setComment("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="px-6 py-8">Loading assignment details...</div>;
  if (error) return <div className="px-6 py-8 text-red-600">Error: {error}</div>;
  if (!assignment) return <div className="px-6 py-8">Assignment not found.</div>;

  return (
    <div className="px-6 py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Submit Assignment</h1>
      <h2 className="text-lg font-semibold mb-1">{assignment.title}</h2>
      {assignment.description && (
        <p className="mb-4 text-gray-700">{assignment.description}</p>
      )}
      {assignment.dueDate && (
        <div className="mb-4 text-sm text-gray-500">Due: {new Date(assignment.dueDate).toLocaleString()}</div>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-medium">Upload File *</label>
          <input ref={fileInputRef} type="file" className="border rounded px-2 py-1 w-full" required disabled={submitting} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Comments</label>
          <textarea
            className="border rounded px-2 py-1 w-full"
            rows={3}
            placeholder="Add any comments..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            disabled={submitting}
          ></textarea>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Assignment"}
        </button>
        {success && <div className="text-green-600 font-medium mt-2">Assignment submitted successfully!</div>}
        {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
      </form>
    </div>
  );
}
