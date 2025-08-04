'use client';

import { useEffect, useState } from 'react';

interface Forum {
  id: string;
  name: string;
  topics: number;
}

export default function ForumsPage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForums() {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch global forums
        let res = await fetch('/api/courses?globalForums=1');
        if (!res.ok) {
          // fallback: try /api/forums/global
          res = await fetch('/api/forums/global');
        }
        if (!res.ok) throw new Error('Failed to fetch forums');
        const data = await res.json();
        // Assume globalForums or forums is an array
        const globalForums = data.globalForums || data.forums || [];
        setForums(globalForums.map((f: any) => ({
          id: f.id,
          name: f.title || f.name,
          topics: f.topics || f.postsCount || 0,
        })));
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchForums();
  }, []);

  if (loading) {
    return <div className="p-8">Loading forums...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!forums || forums.length === 0) {
    return <div className="p-8">No forums found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 break-words">Forums</h1>
      <div className="mb-4 flex items-center gap-2 min-w-0">
        <input type="text" placeholder="Search forums..." className="border rounded px-3 py-2 w-full max-w-md" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Create New Post</button>
      </div>
      <ul className="space-y-2">
        {forums.map(forum => (
          <li key={forum.id} className="bg-white p-4 rounded shadow flex justify-between items-center min-w-0 overflow-hidden">
            <span>{forum.name}</span>
            <span className="text-xs text-gray-500">{forum.topics} topics</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

