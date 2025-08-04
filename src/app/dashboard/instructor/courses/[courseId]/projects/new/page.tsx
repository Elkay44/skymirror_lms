"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save,
  X,
  AlertCircle,
  Target,
  FileText,
  Settings,
  CheckSquare
} from 'lucide-react';

export default function NewProjectPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Project title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/courses/${courseId}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const project = await response.json();
      
      // Redirect to the newly created project
      router.push(`/dashboard/instructor/courses/${courseId}/projects/${project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/instructor/courses/${courseId}/projects`);
  };

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
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4 mr-2 flex-shrink-0" />
                Cancel
              </button>
              <button
                type="submit"
                form="project-form"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                    Create New Project
                  </h1>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-4 lg:px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm break-words ${
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
                    className={`py-4 px-1 border-b-2 font-medium text-sm break-words ${
                      activeTab === 'requirements'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-4 w-4 flex-shrink-0" />
                      <span>Requirements</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm break-words ${
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

              {error && (
                <div className="m-4 lg:m-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-300 break-words">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tab Content */}
              <form id="project-form" onSubmit={handleSubmit}>
                <div className="p-4 lg:p-6">
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                        Project Details
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white break-words"
                            placeholder="Enter project title"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Brief Description
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-y overflow-hidden break-words"
                            placeholder="Enter a brief description of this project"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">
                            A short summary that will appear in project listings
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Due Date
                            </label>
                            <input
                              type="datetime-local"
                              value={formData.dueDate}
                              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="yyyy. mm. dd., --:--"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Difficulty Level
                            </label>
                            <select
                              value={formData.difficultyLevel}
                              onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Medium">Medium</option>
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
                              value={formData.estimatedHours}
                              onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              min="1"
                              placeholder="8"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">
                              Approximate time to complete
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Technologies
                          </label>
                          <input
                            type="text"
                            value={formData.technologies}
                            onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white break-words"
                            placeholder="e.g., React, Node.js, Python, TensorFlow"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">
                            Technologies or frameworks used in this project
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'requirements' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                        Project Requirements
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Detailed Instructions
                        </label>
                        <textarea
                          value={formData.instructions}
                          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                          rows={12}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-y overflow-hidden break-words leading-relaxed"
                          placeholder="Detailed project instructions and requirements..."
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                        Project Settings
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Points Value
                          </label>
                          <input
                            type="number"
                            value={formData.pointsValue}
                            onChange={(e) => setFormData({ ...formData, pointsValue: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            min="0"
                            placeholder="100"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isRequiredForCertification}
                            onChange={(e) => setFormData({ ...formData, isRequiredForCertification: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 break-words">
                            Required for course certification
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 break-words">
                            Publish immediately (visible to students)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 min-w-0">
            <div className="space-y-4 lg:space-y-6">
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
                  💡 Tips
                </h3>
                
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="break-words">• Start with a draft and publish when ready</li>
                  <li className="break-words">• Include clear submission guidelines</li>
                  <li className="break-words">• Set realistic due dates</li>
                  <li className="break-words">• Consider prerequisite knowledge</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
