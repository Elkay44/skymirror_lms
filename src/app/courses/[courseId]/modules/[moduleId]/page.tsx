'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  position: number;
  description?: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  type?: string;
}

interface ModuleData {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  resources: Resource[];
}

export default function ModulePage() {
  const params = useParams();
  const { courseId, moduleId } = params as { courseId: string; moduleId: string };
  const [module, setModule] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch module");
        }
        const data = await response.json();
        setModule(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (courseId && moduleId) fetchModule();
  }, [courseId, moduleId]);

  if (loading) {
    return <div className="px-6 py-8">Loading module...</div>;
  }
  if (error) {
    return <div className="px-6 py-8 text-red-600">Error: {error}</div>;
  }
  if (!module) {
    return <div className="px-6 py-8">Module not found.</div>;
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">{module.title}</h1>
      {module.description && <p className="mb-4 text-gray-700">{module.description}</p>}
      <h2 className="text-lg font-semibold mb-2">Lessons</h2>
      <ul className="mb-6">
        {module.lessons.map((lesson) => (
          <li key={lesson.id} className="mb-2">
            <a
              href={`../lessons/${lesson.id}`}
              className="text-blue-600 hover:underline"
            >
              {lesson.title}
            </a>
            {lesson.description && (
              <div className="text-sm text-gray-500">{lesson.description}</div>
            )}
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2">Resources</h2>
      <ul>
        {module.resources.length === 0 && <li className="text-gray-500">No resources for this module.</li>}
        {module.resources.map((resource) => (
          <li key={resource.id} className="mb-2">
            <div className="flex flex-col">
              <span className="font-medium">
                {resource.title}
                {resource.type && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-gray-200 text-xs text-gray-700">
                    {resource.type}
                  </span>
                )}
              </span>
              {resource.description && (
                <span className="text-sm text-gray-600">{resource.description}</span>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  className="text-blue-600 hover:underline text-sm mt-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Resource
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
