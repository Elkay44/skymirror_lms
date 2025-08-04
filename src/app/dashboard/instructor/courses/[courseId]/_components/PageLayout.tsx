import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  backHref: string;
  actions?: ReactNode;
}

export function PageLayout({ title, description, children, backHref, actions }: PageLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link 
          href={backHref}
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mb-4 break-words min-w-0"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Course
        </Link>
        <div className="flex items-center justify-between min-w-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center space-x-2 min-w-0">{actions}</div>}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden overflow-hidden">
        {children}
      </div>
    </div>
  );
}
