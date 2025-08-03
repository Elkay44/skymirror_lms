'use client';

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

interface Project {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
}

export default function ProjectSubmitPage() {
  const { courseId, projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/courses/${courseId}/projects/${projectId}`);
        if (!response.ok) throw new Error("Failed to fetch project details");
        const data = await response.json();
        setProject(data.project || data); // fallback for direct project object
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [courseId, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const files = fileInputRef.current?.files;
      if (!files || files.length === 0) {
        setError("Please select at least one file to upload.");
        setSubmitting(false);
        return;
      }
      const formData = new FormData();
      Array.from(files).forEach((file, _idx) => {
        formData.append("files", file);
      });
      formData.append("description", description);
      const response = await fetch(`/api/courses/${courseId}/projects/${projectId}/submit`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to submit project");
      setSuccess(true);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="px-6 py-8">Loading project details...</div>;
  if (error) return <div className="px-6 py-8 text-red-600">Error: {error}</div>;
  if (!project) return <div className="px-6 py-8">Project not found.</div>;

  return (
    <div className="px-6 py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Submit Project</h1>
      <h2 className="text-lg font-semibold mb-1">{project.title}</h2>
      {project.description && (
        <p className="mb-4 text-gray-700">{project.description}</p>
      )}
      {project.dueDate && (
        <div className="mb-4 text-sm text-gray-500">Due: {new Date(project.dueDate).toLocaleString()}</div>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-medium">Upload Project Files *</label>
          <input ref={fileInputRef} type="file" multiple className="border rounded px-2 py-1 w-full" required disabled={submitting} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Project Description</label>
          <textarea
            className="border rounded px-2 py-1 w-full"
            rows={3}
            placeholder="Describe your project..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={submitting}
          ></textarea>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Project"}
        </button>
        {success && <div className="text-green-600 font-medium mt-2">Project submitted successfully!</div>}
        {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
      </form>
    </div>
  );
}
