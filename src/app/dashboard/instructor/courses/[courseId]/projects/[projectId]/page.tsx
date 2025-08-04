"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar, 
  Users,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Target,
  Settings
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: string | null;
  pointsValue: number;
  isRequiredForCertification: boolean;
  isPublished: boolean;
  courseId: string;
  moduleId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    submissions: number;
  };
  module?: {
    id: string;
    title: string;
  };
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    pointsValue: 100,
    difficultyLevel: 'Medium',
    estimatedHours: 8,
    technologies: '',
    isRequiredForCertification: true,
    isPublished: false
  });

  useEffect(() => {
    fetchProject();
  }, [courseId, projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      
      const data = await response.json();
      setProject(data.data || data);
      
      // Initialize edit form
      const projectData = data.data || data;
      setEditForm({
        title: projectData.title,
        description: projectData.description || '',
        instructions: projectData.instructions || '',
        dueDate: projectData.dueDate ? new Date(projectData.dueDate).toISOString().split('T')[0] : '',
        pointsValue: projectData.pointsValue,
        difficultyLevel: 'Medium',
        estimatedHours: 8,
        technologies: '',
        isRequiredForCertification: projectData.isRequiredForCertification,
        isPublished: projectData.isPublished
      });
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      await fetchProject();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      router.push(`/dashboard/instructor/courses/${courseId}/projects`);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {error || 'Project not found'}
            </h2>
            <Link
              href={`/dashboard/instructor/courses/${courseId}/projects`}
              className="text-blue-600 hover:text-blue-500"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
              <Link
                href={`/dashboard/instructor/courses/${courseId}/projects`}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="break-words">Back to Projects</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2 flex-shrink-0" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/dashboard/instructor/courses/${courseId}/projects/${project.id}/submissions`}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    View Submissions
                  </Link>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 min-w-0">
            {isEditing ? (
              /* Edit Form */
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 lg:p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Edit className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                      Edit Project
                    </h2>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'details'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span>Details</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('requirements')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'requirements'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 flex-shrink-0" />
                          <span>Requirements</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'settings'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Settings className="h-4 w-4 flex-shrink-0" />
                          <span>Settings</span>
                        </div>
                      </button>
                    </nav>
                  </div>
                  
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Project Title *
                          </label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white break-words"
                            placeholder="Enter a clear, descriptive project title"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-y overflow-hidden break-words"
                            placeholder="Brief overview of what students will accomplish in this project"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Difficulty Level
                          </label>
                          <select
                            value={editForm.difficultyLevel}
                            onChange={(e) => setEditForm({ ...editForm, difficultyLevel: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estimated Hours
                          </label>
                          <input
                            type="number"
                            value={editForm.estimatedHours}
                            onChange={(e) => setEditForm({ ...editForm, estimatedHours: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            min="1"
                            placeholder="8"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Requirements Tab */}
                    {activeTab === 'requirements' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Project Instructions
                          </label>
                          <textarea
                            value={editForm.instructions}
                            onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                            rows={12}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-y overflow-hidden break-words leading-relaxed"
                            placeholder="Provide detailed instructions, requirements, and deliverables for this project..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Technologies/Tools
                          </label>
                          <input
                            type="text"
                            value={editForm.technologies}
                            onChange={(e) => setEditForm({ ...editForm, technologies: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white break-words"
                            placeholder="React, Node.js, MongoDB, etc."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Points Value
                          </label>
                          <input
                            type="number"
                            value={editForm.pointsValue}
                            onChange={(e) => setEditForm({ ...editForm, pointsValue: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            min="0"
                            placeholder="100"
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.isRequiredForCertification}
                              onChange={(e) => setEditForm({ ...editForm, isRequiredForCertification: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 break-words">
                              Required for course certification
                            </span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.isPublished}
                              onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 break-words">
                              Published (visible to students)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-6">
                {/* Project Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words overflow-wrap-anywhere max-w-full">
                      {project.title}
                    </h1>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {project.isPublished ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {project.description && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                      <div className="text-gray-600 dark:text-gray-400 break-words overflow-wrap-anywhere max-w-full">
                        {project.description}
                      </div>
                    </div>
                  )}
                  
                  {project.instructions && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</h3>
                      <div className="w-full overflow-hidden">
                        <div className="text-gray-600 dark:text-gray-400 break-words overflow-wrap-anywhere max-w-full leading-relaxed whitespace-pre-wrap">
                          {project.instructions}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 min-w-0">
            <div className="space-y-4 lg:space-y-6">
              {isEditing ? (
                /* Edit Mode Sidebar */
                <>
                  {/* Project Guidelines */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 overflow-hidden">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 break-words">
                      Project Guidelines
                    </h3>
                    
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="break-words">
                        <strong className="text-gray-900 dark:text-white">Title:</strong> Choose a clear, descriptive title that explains what students will build or accomplish.
                      </div>
                      
                      <div className="break-words">
                        <strong className="text-gray-900 dark:text-white">Description:</strong> Provide a brief overview that helps students understand the project's purpose and scope.
                      </div>
                      
                      <div className="break-words">
                        <strong className="text-gray-900 dark:text-white">Instructions:</strong> Include detailed requirements, deliverables, submission format, and evaluation criteria.
                      </div>
                      
                      <div className="break-words">
                        <strong className="text-gray-900 dark:text-white">Points:</strong> Set point values that reflect the project's complexity and importance in the course.
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 lg:p-6 overflow-hidden">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 break-words">
                      💡 Editing Tips
                    </h3>
                    
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li className="break-words">• Save changes frequently while editing</li>
                      <li className="break-words">• Consider impact on existing submissions</li>
                      <li className="break-words">• Notify students of significant changes</li>
                      <li className="break-words">• Review before publishing updates</li>
                    </ul>
                  </div>
                </>
              ) : (
                /* View Mode Sidebar */
                <>
                  {/* Project Details */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 overflow-hidden">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 break-words">
                      Project Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="break-words">Points: {project.pointsValue}</span>
                      </div>
                      
                      {project.dueDate && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="break-words">
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {project._count && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="break-words">
                            {project._count.submissions} submission{project._count.submissions !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                          Updated: {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Quick Links */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 break-words">
                  Quick Links
                </h3>
                
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/instructor/courses/${courseId}/projects`}
                    className="block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 break-words"
                  >
                    ← Back to Projects
                  </Link>
                  <Link
                    href={`/dashboard/instructor/courses/${courseId}`}
                    className="block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 break-words"
                  >
                    ← Back to Course
                  </Link>
                  {project._count && project._count.submissions > 0 && (
                    <Link
                      href={`/dashboard/instructor/courses/${courseId}/projects/${projectId}/submissions`}
                      className="block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 break-words"
                    >
                      View Submissions →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
