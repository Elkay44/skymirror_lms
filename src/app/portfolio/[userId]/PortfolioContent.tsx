/* eslint-disable */

import { ExternalLink, Award, Tag, Clock, BookOpen, Mail, Linkedin, Globe } from 'lucide-react';
import { Github } from 'lucide-react';
import Image from 'next/image';

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  completedAt: string;
  skills: string[];
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  profile: {
    bio: string | null;
    headline: string | null;
    location: string | null;
    education: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
  } | null;
}

export default function PortfolioContent({ user }: { user: UserProfile }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.name || 'Student'}'s Portfolio
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.profile?.headline || 'SkyMirror Academy Student'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-700">
              {user.profile?.bio || 'No bio available.'}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
