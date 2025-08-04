'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Target, CheckCircle, Clock, Users, Loader2 } from 'lucide-react';
import { PageLayout } from '../_components/PageLayout';
import { getProjects } from '@/lib/api/projects';
import { Project } from '@/types/module';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await getProjects(courseId);
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [courseId]);

  const handleCreateProject = () => {
    router.push(`/dashboard/instructor/courses/${courseId}/project/new`);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 break-words min-w-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'in_progress':
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 break-words min-w-0">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 break-words min-w-0">
            Not Started
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <PageLayout
        title="Loading Projects..."
        description="Please wait while we load your projects"
        backHref="/dashboard/instructor/courses"
      >
        <div className="flex items-center justify-center h-64 min-w-0">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Error Loading Projects"
        description={error}
        backHref="/dashboard/instructor/courses"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Course Projects"
      description="Manage and track student projects"
      backHref="/dashboard/instructor/courses"
      actions={
        <button 
          onClick={handleCreateProject}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words min-w-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </button>
      }
    >
      <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden"
            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/projects/${project.id}`)}
          >
            <div className="p-4 lg:p-6">
              <div className="flex items-start justify-between min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white break-words">{project.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 break-words">{project.description}</p>
                </div>
                {getStatusBadge(project.status || 'not_started')}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm break-words">
                  <div className="flex items-center min-w-0">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {project.submissions?.length || 0} submissions
                    </span>
                  </div>
                  {project.dueDate && (
                    <div className="flex items-center min-w-0">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Due {formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white break-words">No projects</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
              Get started by creating a new project.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCreateProject}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words min-w-0"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Project
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
