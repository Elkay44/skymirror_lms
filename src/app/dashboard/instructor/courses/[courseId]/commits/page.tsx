'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '../_components/PageLayout';
import { GitCommit, GitBranch, GitPullRequest, Code, User, Search, Filter, Download, Loader2 } from 'lucide-react';

interface CommitData {
  id: string;
  message: string;
  author: string;
  branch: string;
  timestamp: string;
  changes: number;
  additions: number;
  deletions: number;
  pullRequest?: number;
}

export default function CommitsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/instructor/courses/${courseId}/commits`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch commits');
        }
        
        const data = await response.json();
        setCommits(data.commits || []);
      } catch (err) {
        console.error('Error fetching commits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load commits');
        setCommits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommits();
  }, [courseId]);

  if (isLoading) {
    return (
      <PageLayout
        title="Loading Commits..."
        description="Please wait while we load code commits"
        backHref="/dashboard/instructor/courses"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Error Loading Commits"
        description={error}
        backHref="/dashboard/instructor/courses"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </PageLayout>
    );
  }

  // Show empty state if no commits
  if (commits.length === 0) {
    return (
      <PageLayout
        title="Code Commits"
        description="Track student code commits and contributions"
        backHref="/dashboard/instructor/courses"
      >
        <div className="text-center py-12">
          <GitCommit className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No commits yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Student code commits will appear here once they start working on projects.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Code Commits"
      description="Track and review student code submissions"
      backHref="/dashboard/instructor/courses"
      actions={
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      }
    >
      <div className="p-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search commits..."
            />
          </div>
          
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <select
              className="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              defaultValue="all-branches"
            >
              <option value="all-branches">All Branches</option>
              <option value="main">main</option>
              <option value="develop">develop</option>
              <option value="feature">feature/*</option>
              <option value="bugfix">bugfix/*</option>
            </select>
            
            <select
              className="block w-full sm:w-32 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              defaultValue="7-days"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7-days">Last 7 days</option>
              <option value="30-days">Last 30 days</option>
              <option value="all-time">All time</option>
            </select>
          </div>
        </div>

        {/* Commits List */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {commits.map((commit) => (
              <li key={commit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{commit.author}</p>
                        <p className="text-sm text-gray-900 dark:text-white">{commit.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{commit.timestamp}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <GitCommit className="h-3 w-3 mr-1" />
                      <span className="font-mono">{commit.id.substring(0, 7)}</span>
                    </div>
                    <div className="flex items-center">
                      <GitBranch className="h-3 w-3 mr-1" />
                      <span>{commit.branch}</span>
                    </div>
                    <div className="flex items-center">
                      <Code className="h-3 w-3 mr-1" />
                      <span>{commit.changes} files changed</span>
                    </div>
                    {commit.additions > 0 && (
                      <span className="text-green-600 dark:text-green-400">+{commit.additions}</span>
                    )}
                    {commit.deletions > 0 && (
                      <span className="text-red-600 dark:text-red-400">-{commit.deletions}</span>
                    )}
                    {commit.pullRequest && (
                      <div className="flex items-center">
                        <GitPullRequest className="h-3 w-3 mr-1 text-purple-600 dark:text-purple-400" />
                        <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                          #{commit.pullRequest}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Pagination */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </a>
              <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </a>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
                  <span className="font-medium">24</span> commits
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <span className="sr-only">Previous</span>
                    <span className="h-5 w-5">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </a>
                  <a
                    href="#"
                    aria-current="page"
                    className="z-10 bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500 text-indigo-600 dark:text-indigo-300 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="bg-white dark:bg-gray-700 border-gray-300 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    2
                  </a>
                  <a
                    href="#"
                    className="bg-white dark:bg-gray-700 border-gray-300 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    3
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <span className="sr-only">Next</span>
                    <span className="h-5 w-5">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
