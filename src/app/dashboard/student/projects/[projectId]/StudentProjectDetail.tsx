"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  Github,
  CheckCircle,
  AlertCircle,
  Award,
  File as FileIcon
} from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import RichTextEditor from '@/components/ui/RichTextEditor';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  courseId: string;
  course?: {
    title: string;
  };
  dueDate?: string;
  pointsValue: number;
  isRequiredForCertification: boolean;
  skills?: string[];
}

interface Submission {
  id: string;
  status: string;
  submissionUrl?: string;
  submissionText?: string;
  submissionFiles?: string;
  feedback?: string;
  grade?: number;
  submittedAt: string;
  reviewedAt?: string;
  type: 'file' | 'code' | 'text';
}

interface StudentProjectDetailProps {
  projectId: string;
}

export default function StudentProjectDetail({ projectId }: StudentProjectDetailProps) {
  const { data: session } = useSession();
  
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Submission form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionType, setSubmissionType] = useState<'file' | 'code' | 'text'>('file');

  const [submissionText, setSubmissionText] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [commitHash, setCommitHash] = useState('');
  const [branch, setBranch] = useState('main');
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'submit' | 'history'>('details');

  useEffect(() => {
    fetchProjectData();
  }, [projectId, session]);

  const fetchProjectData = async () => {
    if (!session?.user || !projectId) {
      setError('Project ID or user session not available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        const errorData = await projectResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch project details');
      }
      const projectData = await projectResponse.json();
      
      if (!projectData.project) {
        throw new Error('Project not found');
      }
      
      setProject(projectData.project);
      
      // Fetch submissions
      const submissionsResponse = await fetch(`/api/projects/${projectId}/submissions`);
      if (!submissionsResponse.ok) {
        const errorData = await submissionsResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error fetching submissions:', errorData.error);
        // Don't throw error for submissions - just show empty list
        setSubmissions([]);
      } else {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions || []);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project details. Please try again later.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('type', submissionType);
      
      if (submissionType === 'file') {
        if (files.length === 0) {
          toast.error('Please select at least one file to upload');
          setIsSubmitting(false);
          return;
        }
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
        formData.append('fileCount', files.length.toString());
      } else if (submissionType === 'code') {
        if (!repositoryUrl) {
          toast.error('Please provide a repository URL');
          setIsSubmitting(false);
          return;
        }
        formData.append('repositoryUrl', repositoryUrl);
        formData.append('commitHash', commitHash);
        formData.append('branch', branch);
      } else if (submissionType === 'text') {
        if (!submissionText.trim()) {
          toast.error('Please provide submission content');
          setIsSubmitting(false);
          return;
        }
        formData.append('submissionText', submissionText);
      }
      
      const response = await fetch(`/api/projects/${projectId}/submit`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        toast.success('Project submitted successfully!');
        // Reset form
        setFiles([]);
        setRepositoryUrl('');
        setCommitHash('');
        setSubmissionText('');
        // Refresh data
        fetchProjectData();
        setActiveTab('history');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit project');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Project</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchProjectData}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const latestSubmission = submissions.length > 0 ? submissions[0] : null;
  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard/student/projects"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Projects
              </Link>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {project.course?.title} • {project.pointsValue} points
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {project.isRequiredForCertification && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <Award className="h-4 w-4 mr-1" />
                      Required for Certification
                    </span>
                  )}
                  {isOverdue && !latestSubmission && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <Clock className="h-4 w-4 mr-1" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {['details', 'submit', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'details' && (
                  <>
                    <FileText className="h-4 w-4 inline mr-2" />
                    Project Details
                  </>
                )}
                {tab === 'submit' && (
                  <>
                    <Upload className="h-4 w-4 inline mr-2" />
                    Submit Work
                  </>
                )}
                {tab === 'history' && (
                  <>
                    <Clock className="h-4 w-4 inline mr-2" />
                    Submission History
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700">{project.description}</p>
                </div>
                
                {project.instructions && (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">Instructions</h3>
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: project.instructions }} />
                    </div>
                  </>
                )}

                {project.skills && project.skills.length > 0 && (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">Skills Required</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Info</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {project.dueDate 
                        ? new Date(project.dueDate).toLocaleDateString()
                        : 'No due date'
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Points</dt>
                    <dd className="text-sm text-gray-900">{project.pointsValue}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm">
                      {latestSubmission ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Not Submitted
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submit' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Submit Your Work</h2>
              
              {/* Submission Type Selection */}
              <div className="mb-6">
                <label className="text-base font-medium text-gray-900">Submission Type</label>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="file"
                      name="submission-type"
                      type="radio"
                      checked={submissionType === 'file'}
                      onChange={() => setSubmissionType('file')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor="file" className="ml-3 block text-sm font-medium text-gray-700">
                      <FileIcon className="h-4 w-4 inline mr-2" />
                      Upload Files
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="code"
                      name="submission-type"
                      type="radio"
                      checked={submissionType === 'code'}
                      onChange={() => setSubmissionType('code')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor="code" className="ml-3 block text-sm font-medium text-gray-700">
                      <Github className="h-4 w-4 inline mr-2" />
                      Code Repository
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="text"
                      name="submission-type"
                      type="radio"
                      checked={submissionType === 'text'}
                      onChange={() => setSubmissionType('text')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor="text" className="ml-3 block text-sm font-medium text-gray-700">
                      <FileText className="h-4 w-4 inline mr-2" />
                      Text Submission
                    </label>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                {submissionType === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Project Files
                    </label>
                    <FileUpload
                      onFileSelect={(uploadedFiles: File[]) => {
                        setFiles(uploadedFiles);
                      }}
                      acceptedTypes={['*']}
                      maxFileSize={50}
                      maxFiles={10}
                      showPreview={true}
                    />
                  </div>
                )}

                {/* Code Repository */}
                {submissionType === 'code' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="repository-url" className="block text-sm font-medium text-gray-700">
                        Repository URL *
                      </label>
                      <input
                        type="url"
                        id="repository-url"
                        value={repositoryUrl}
                        onChange={(e) => setRepositoryUrl(e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                          Branch
                        </label>
                        <input
                          type="text"
                          id="branch"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="main"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="commit-hash" className="block text-sm font-medium text-gray-700">
                          Commit Hash (optional)
                        </label>
                        <input
                          type="text"
                          id="commit-hash"
                          value={commitHash}
                          onChange={(e) => setCommitHash(e.target.value)}
                          placeholder="abc123..."
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Submission */}
                {submissionType === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission Content
                    </label>
                    <RichTextEditor
                      value={submissionText}
                      onChange={setSubmissionText}
                      placeholder="Describe your solution, approach, and any relevant details..."
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Submission History</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {submissions.length > 0 ? (
                  submissions.map((submission) => (
                    <div key={submission.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {submission.type === 'file' && <FileIcon className="h-5 w-5 text-gray-400" />}
                            {submission.type === 'code' && <Github className="h-5 w-5 text-gray-400" />}
                            {submission.type === 'text' && <FileText className="h-5 w-5 text-gray-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {submission.type === 'file' && 'File Upload'}
                              {submission.type === 'code' && 'Code Repository'}
                              {submission.type === 'text' && 'Text Submission'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {submission.status === 'graded' && submission.grade && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {submission.grade}%
                            </span>
                          )}
                          {submission.status === 'graded' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-400" />
                          )}
                        </div>
                      </div>
                      {submission.feedback && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by submitting your project work.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
