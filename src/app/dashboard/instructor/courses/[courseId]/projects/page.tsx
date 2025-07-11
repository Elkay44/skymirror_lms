import { PageLayout } from '../_components/PageLayout';
import { Plus, FileText, Target, CheckCircle, Clock, Users, GitBranch, GitPullRequest } from 'lucide-react';

export default function ProjectsPage() {
  // Mock data - replace with real data
  const projects = [
    {
      id: 1,
      title: 'E-commerce Website',
      description: 'Build a full-stack e-commerce application with React and Node.js',
      status: 'in-progress',
      dueDate: '2023-12-15',
      submissions: 24,
      averageScore: 85,
      lastCommit: '2h ago',
      pullRequests: 3
    },
    {
      id: 2,
      title: 'Task Management App',
      description: 'Create a task management application with user authentication',
      status: 'not-started',
      dueDate: '2024-01-10',
      submissions: 0,
      averageScore: 0,
      lastCommit: 'No commits yet',
      pullRequests: 0
    },
    {
      id: 3,
      title: 'Portfolio Website',
      description: 'Design and develop a personal portfolio website',
      status: 'completed',
      dueDate: '2023-11-30',
      submissions: 30,
      averageScore: 92,
      lastCommit: '1w ago',
      pullRequests: 5
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Not Started
          </span>
        );
    }
  };

  return (
    <PageLayout
      title="Course Projects"
      description="Manage and track student projects"
      backHref="/dashboard/instructor/courses"
      actions={
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{project.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                </div>
                {getStatusBadge(project.status)}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">{project.submissions} submissions</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Avg: {project.averageScore || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">{project.lastCommit}</span>
                  </div>
                  <div className="flex items-center">
                    <GitPullRequest className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">{project.pullRequests} PRs</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Due: {new Date(project.dueDate).toLocaleDateString()}
                </span>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
