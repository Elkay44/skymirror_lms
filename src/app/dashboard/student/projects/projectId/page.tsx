"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  Github,
  CheckCircle,
  Link as LinkIcon,
  Award,
  AlertCircle
} from 'lucide-react';

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
}

export default function ProjectDetail() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get project ID from the URL parameters or search params
  const params = useParams();
  const projectIdFromParams = params?.projectId;
  const projectIdFromSearch = searchParams?.get('id');
  const projectId = projectIdFromParams || projectIdFromSearch;
  
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Submission form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionType, setSubmissionType] = useState<'repository' | 'text' | 'file'>('repository');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user || !projectId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) throw new Error('Failed to fetch project details');
        const projectData = await projectResponse.json();
        
        // Parse skills JSON if needed
        let processedProject = projectData.project;
        if (processedProject.skills && typeof processedProject.skills === 'string') {
          processedProject = {
            ...processedProject,
            skills: JSON.parse(processedProject.skills)
          };
        }
        
        setProject(processedProject);
        
        // Fetch submissions
        const submissionsResponse = await fetch(`/api/projects/${projectId}/submit`);
        if (!submissionsResponse.ok) throw new Error('Failed to fetch submissions');
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions || []);
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session, projectId]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId || !session?.user) {
      setSubmissionError('User session or project ID is missing');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmissionError(null);
      
      let response;
      
      if (submissionType === 'file' && files.length > 0) {
        // File upload submission
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        if (submissionText) {
          formData.append('submissionText', submissionText);
        }
        
        response = await fetch(`/api/projects/${projectId}/submit`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Repository URL or text-based submission
        const submissionData: {
          submissionUrl?: string;
          submissionText?: string;
        } = {};
        
        if (submissionType === 'repository' && submissionUrl) {
          submissionData.submissionUrl = submissionUrl;
        }
        
        if (submissionType === 'text' && submissionText) {
          submissionData.submissionText = submissionText;
        }
        
        response = await fetch(`/api/projects/${projectId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit project');
      }
      
      // Success - update UI and refresh submissions
      setSubmissionSuccess(true);
      
      // Clear form
      setSubmissionUrl('');
      setSubmissionText('');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Fetch updated submissions after a short delay
      setTimeout(async () => {
        const submissionsResponse = await fetch(`/api/projects/${projectId}/submit`);
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setSubmissions(submissionsData.submissions || []);
        }
      }, 1000);
      
    } catch (err: any) {
      console.error('Error submitting project:', err);
      setSubmissionError(err.message || 'An error occurred while submitting your project');
      setSubmissionSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getLatestSubmission = () => {
    if (!submissions || submissions.length === 0) return null;
    return submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Submitted
          </span>
        );
      case 'REVIEWING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            <FileText className="h-3 w-3 mr-1" />
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case 'REVISION_REQUESTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Revision Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  const parseSubmissionFiles = (submissionFiles?: string) => {
    if (!submissionFiles) return [];
    try {
      return JSON.parse(submissionFiles);
    } catch (e) {
      console.error('Error parsing submission files:', e);
      return [];
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/student/projects" className="mr-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold">Loading Project...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/student/projects" className="mr-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold">Project Not Found</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>Error: {error || 'Project not found'}</p>
          <Link 
            href="/dashboard/student/projects" 
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }
  
  const latestSubmission = getLatestSubmission();
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/student/projects" className="mr-2">
          <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold">{project.title}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
                  {project.isRequiredForCertification && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <Award className="h-3 w-3 mr-1" />
                      Required for Certification
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-500 mb-4 space-y-2">
                <p className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Course: {project.course?.title || 'Unknown Course'}
                </p>
                {project.dueDate && (
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due: {new Date(project.dueDate).toLocaleDateString()} at {new Date(project.dueDate).toLocaleTimeString()}
                  </p>
                )}
                <p className="flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Points: {project.pointsValue || 10}
                </p>
              </div>
              
              {project.skills && project.skills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Skills You'll Learn</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.skills.map((skill: string, i: number) => (
                      <span 
                        key={i} 
                        className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {project.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <p>{project.description}</p>
                  </div>
                </div>
              )}
              
              {project.instructions && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Instructions</h3>
                  <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-md">
                    <p>{project.instructions}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Submission Form */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Project</h2>
              
              {latestSubmission && ['APPROVED', 'REVIEWING'].includes(latestSubmission.status) ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800 mb-4">
                  <p className="flex items-center font-medium">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Your project has been submitted and is {latestSubmission.status === 'APPROVED' ? 'approved' : 'under review'}.
                  </p>
                  <p className="mt-2 text-sm">
                    You can view the status and feedback in the submission history section.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission Type
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setSubmissionType('repository')}
                        className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${submissionType === 'repository' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        <Github className="h-4 w-4 mr-2" />
                        Repository URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionType('text')}
                        className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${submissionType === 'text' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Text Submission
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionType('file')}
                        className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${submissionType === 'file' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        File Upload
                      </button>
                    </div>
                  </div>
                  
                  {submissionType === 'repository' && (
                    <div>
                      <label htmlFor="submissionUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Repository URL
                      </label>
                      <div className="flex">
                        <div className="relative flex-grow">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LinkIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="url"
                            id="submissionUrl"
                            value={submissionUrl}
                            onChange={(e) => setSubmissionUrl(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://github.com/username/repository"
                            required={submissionType === 'repository'}
                          />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Provide the URL to your GitHub, GitLab, or other code repository</p>
                    </div>
                  )}
                  
                  {(submissionType === 'text' || submissionType === 'file') && (
                    <div>
                      <label htmlFor="submissionText" className="block text-sm font-medium text-gray-700 mb-1">
                        Project Description
                      </label>
                      <textarea
                        id="submissionText"
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        rows={5}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your project, what you learned, and any challenges you faced..."
                        required={submissionType === 'text'}
                      />
                    </div>
                  )}
                  
                  {submissionType === 'file' && (
                    <div>
                      <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Files
                      </label>
                      <input
                        type="file"
                        id="files"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required={submissionType === 'file' && files.length === 0}
                      />
                      {files.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600 space-y-1">
                          {files.map((file, index) => (
                            <li key={index} className="flex items-center">
                              <FileText className="h-4 w-4 mr-1.5 text-gray-400" />
                              {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  
                  {submissionError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
                      <p className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1.5" />
                        {submissionError}
                      </p>
                    </div>
                  )}
                  
                  {submissionSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-800 text-sm">
                      <p className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Your project has been submitted successfully!
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || (
                        (submissionType === 'repository' && !submissionUrl) ||
                        (submissionType === 'text' && !submissionText) ||
                        (submissionType === 'file' && files.length === 0)
                      )}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Project'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        
        {/* Submission History */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Submission History</h2>
            </div>
            
            {submissions.length === 0 ? (
              <div className="p-5 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-2">No submissions yet</p>
                <p className="text-sm text-gray-500">
                  Submit your project to receive feedback and earn points.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {submissions.map((submission) => (
                  <div key={submission.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                        {submission.reviewedAt && (
                          <p className="text-xs text-gray-500">
                            Reviewed: {new Date(submission.reviewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(submission.status)}
                    </div>
                    
                    {submission.submissionUrl && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Repository:</p>
                        <a 
                          href={submission.submissionUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          {submission.submissionUrl.split('/').slice(-2).join('/')}
                        </a>
                      </div>
                    )}
                    
                    {submission.submissionFiles && parseSubmissionFiles(submission.submissionFiles).length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Files:</p>
                        <ul className="text-sm space-y-1">
                          {parseSubmissionFiles(submission.submissionFiles).map((file: any, index: number) => (
                            <li key={index}>
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                {file.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {submission.feedback && (
                      <div className="mt-3 bg-gray-50 rounded-md p-3">
                        <p className="text-xs text-gray-500 mb-1">Feedback:</p>
                        <p className="text-sm text-gray-700">{submission.feedback}</p>
                      </div>
                    )}
                    
                    {submission.grade !== undefined && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-green-600">
                          Grade: {submission.grade}%
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
