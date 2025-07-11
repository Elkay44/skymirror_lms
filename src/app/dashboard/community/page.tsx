'use client';

import { useEffect, useState } from 'react';

interface Discussion {
  id: string;
  title: string;
  replies: number;
}

export default function CommunityPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiscussions() {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch trending/global forums/discussions
        const res = await fetch('/api/courses?trendingForums=1');
        if (!res.ok) throw new Error('Failed to fetch discussions');
        const data = await res.json();
        // Assume trendingForums is an array of forums/discussions
        const forums = data.trendingForums || [];
        setDiscussions(forums.map((f: any) => ({
          id: f.id,
          title: f.title,
          replies: f.postsCount || 0,
        })));
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchDiscussions();
  }, []);

  if (loading) {
    return <div className="p-8">Loading trending discussions...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!discussions || discussions.length === 0) {
    return <div className="p-8">No trending discussions found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Community</h1>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Trending Discussions</h2>
        <ul className="space-y-2">
          {discussions.map(discussion => (
            <li key={discussion.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <span>{discussion.title}</span>
              <span className="text-xs text-gray-500">{discussion.replies} replies</span>
            </li>
          ))}
        </ul>
      </div>
      <a href="/community/guidelines" className="text-blue-600 hover:underline">View Community Guidelines</a>
    </div>
  );
}

