"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
  Layers
} from 'lucide-react';

interface Page {
  id: string;
  title: string;
  description: string;
  slug?: string;
  isPublished?: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
  blockCount?: number;
}

export default function PagesListPage() {
  const params = useParams();
  const { courseId, moduleId } = params;

  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<any>(null);

  useEffect(() => {
    fetchPages();
  }, [courseId, moduleId]);

  const fetchPages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/pages`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      if (data.success) {
        setPages(data.data.pages || []);
        setModule(data.data.module);
      } else {
        setError(data.error || 'Failed to load pages');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/pages/${pageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      const data = await response.json();
      if (data.success) {
        await fetchPages(); // Refresh list
      } else {
        setError(data.error || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      setError('Failed to delete page');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4 break-words">{error}</div>
          <Link 
            href={`/dashboard/instructor/courses/${courseId}/modules`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Modules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 min-w-0">
            <div className="flex items-center space-x-4 min-w-0">
              <Link 
                href={`/dashboard/instructor/courses/${courseId}/modules`}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-w-0"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Modules
              </Link>
              <div className="text-gray-300 dark:text-gray-600">|</div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white break-words">
                  Pages
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                  {module?.title || 'Module'}
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/page/create`}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-w-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 break-words">
              No pages yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first page for this module.
            </p>
            <Link
              href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/page/create`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-w-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Page
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            {pages
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((page) => (
                <div
                  key={page.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden"
                >
                  <div className="flex items-start justify-between min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2 min-w-0">
                        <Link
                          href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/pages/${page.id}`}
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 break-words"
                        >
                          {page.title}
                        </Link>
                        
                        {page.isPublished ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 break-words min-w-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 break-words min-w-0">
                            Draft
                          </span>
                        )}

                        {page.order !== undefined && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 break-words min-w-0">
                            Order: {page.order}
                          </span>
                        )}
                      </div>

                      {page.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                          {page.description}
                        </p>
                      )}

                      {page.slug && (
                        <div className="mb-3">
                          <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 break-words min-w-0">
                            <Eye className="h-4 w-4 mr-1" />
                            Slug: {page.slug}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 break-words min-w-0">
                        <div className="flex items-center min-w-0">
                          <Layers className="h-4 w-4 mr-1" />
                          <span>{page.blockCount || 0} content blocks</span>
                        </div>

                        <div className="flex items-center min-w-0">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Created {formatDate(page.createdAt)}</span>
                        </div>

                        <div className="flex items-center min-w-0">
                          <Edit className="h-4 w-4 mr-1" />
                          <span>Updated {formatDate(page.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4 min-w-0">
                      <Link
                        href={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}/pages/${page.id}`}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Edit page"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete page"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
