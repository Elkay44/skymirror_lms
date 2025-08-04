'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Upload, 
  Github,
  CheckCircle,
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
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Get project ID from the URL parameters or search params
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
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setSubmissions(submissionsData.submissions || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to load project details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [projectId, session]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    
    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      const formData = new FormData();
      
      if (submissionType === 'repository') {
        formData.append('submissionUrl', submissionUrl);
      } else if (submissionType === 'text') {
        formData.append('submissionText', submissionText);
      } else if (submissionType === 'file' && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }
      
      const response = await fetch(`/api/projects/${projectId}/submit`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit project');
      }
      
      // Refresh submissions
      const submissionsResponse = await fetch(`/api/projects/${projectId}/submit`);
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions || []);
      }
      
      setSubmissionSuccess(true);
      setSubmissionType('repository');
      setSubmissionUrl('');
      setSubmissionText('');
      setFiles([]);
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmissionSuccess(false), 5000);
    } catch (err) {
      console.error('Error submitting project:', err);
      setSubmissionError(err instanceof Error ? err.message : 'Failed to submit project');
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
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex min-w-0">
            <div className="flex-shrink-0 min-w-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 break-words">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 break-words">Project not found</h3>
          <p className="mt-1 text-sm text-gray-500 break-words">The requested project could not be found.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/student/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words min-w-0"
            >
              <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const latestSubmission = submissions.length > 0 ? submissions[0] : null;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center min-w-0">
          <Link
            href="/dashboard/student/projects"
            className="text-indigo-600 hover:text-indigo-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="ml-2 text-2xl font-bold text-gray-900 break-words">{project.title}</h1>
        </div>
        {project.course && (
          <p className="mt-1 text-sm text-gray-500 break-words">
            Part of: {project.course.title}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 break-words">Project Details</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 break-words">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
                    {project.description || 'No description provided.'}
                  </dd>
                </div>
                
                {project.instructions && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 break-words">Instructions</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line break-words">
                      {project.instructions}
                    </dd>
                  </div>
                )}
                
                {project.dueDate && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 break-words">Due Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
                      {new Date(project.dueDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 break-words">Points</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
                    {project.pointsValue} points
                  </dd>
                </div>
                
                {project.skills && project.skills.length > 0 && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 break-words">Skills</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
                      <div className="flex flex-wrap gap-2 min-w-0">
                        {project.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 break-words min-w-0"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 break-words">Submit Your Work</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {submissionSuccess && (
                <div className="mb-4 rounded-md bg-green-50 p-4">
                  <div className="flex min-w-0">
                    <div className="flex-shrink-0 min-w-0">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 break-words">
                        Your submission has been received!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {submissionError && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="flex min-w-0">
                    <div className="flex-shrink-0 min-w-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 break-words">
                        {submissionError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 break-words">
                    Submission Type
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setSubmissionType('repository')}
                      className={`relative border rounded-lg p-4 flex flex-col items-center justify-center focus:outline-none ${
                        submissionType === 'repository'
                          ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Github className="h-8 w-8 text-gray-700" />
                      <span className="mt-2 block text-sm font-medium text-gray-900 break-words">
                        GitHub Repository
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSubmissionType('text')}
                      className={`relative border rounded-lg p-4 flex flex-col items-center justify-center focus:outline-none ${
                        submissionType === 'text'
                          ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <FileText className="h-8 w-8 text-gray-700" />
                      <span className="mt-2 block text-sm font-medium text-gray-900 break-words">
                        Text Submission
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSubmissionType('file')}
                      className={`relative border rounded-lg p-4 flex flex-col items-center justify-center focus:outline-none ${
                        submissionType === 'file'
                          ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Upload className="h-8 w-8 text-gray-700" />
                      <span className="mt-2 block text-sm font-medium text-gray-900 break-words">
                        File Upload
                      </span>
                    </button>
                  </div>
                </div>
                
                {submissionType === 'repository' && (
                  <div>
                    <label htmlFor="repository-url" className="block text-sm font-medium text-gray-700 break-words">
                      GitHub Repository URL
                    </label>
                    <div className="mt-1">
                      <input
                        type="url"
                        id="repository-url"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md break-words"
                        placeholder="https://github.com/username/repository"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                
                {submissionType === 'text' && (
                  <div>
                    <label htmlFor="submission-text" className="block text-sm font-medium text-gray-700 break-words">
                      Your Submission
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="submission-text"
                        rows={8}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md break-words"
                        placeholder="Paste your submission text here..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                
                {submissionType === 'file' && (
                  <div>
                    <div className="flex justify-between items-center min-w-0">
                      <label className="block text-sm font-medium text-gray-700 break-words">
                        Upload Files
                      </label>
                      <span className="text-xs text-gray-500">
                        {files.length} file{files.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md min-w-0">
                      <div className="space-y-1 text-center">
                        <div className="flex text-sm text-gray-600 break-words min-w-0">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 break-words overflow-hidden"
                          >
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                              multiple
                              ref={fileInputRef}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, ZIP up to 10MB
                        </p>
                      </div>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md min-w-0 flex-shrink-0">
                            <div className="flex items-center min-w-0">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <span className="ml-2 text-sm font-medium text-gray-900 truncate max-w-xs break-words">
                                {file.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = [...files];
                                newFiles.splice(index, 1);
                                setFiles(newFiles);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end min-w-0">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed break-words min-w-0"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Project'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 break-words">Submission Status</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 break-words">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
                    {latestSubmission ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 break-words min-w-0">
                        Submitted
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 break-words min-w-0">
                        Not Submitted
                      </span>
                    )}
                  </dd>
                </div>
                
                {latestSubmission && (
                  <>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500 break-words">Submitted On</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
                        {new Date(latestSubmission.submittedAt).toLocaleString()}
                      </dd>
                    </div>
                    
                    {latestSubmission.status === 'graded' && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 break-words">Grade</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">
                          <span className="font-medium break-words">{latestSubmission.grade}%</span>
                        </dd>
                      </div>
                    )}
                    
                    {latestSubmission.feedback && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 break-words">Feedback</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line break-words">
                          {latestSubmission.feedback}
                        </dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 break-words">Submission History</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              {submissions.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <li key={submission.id} className="py-4 px-6">
                      <div className="flex items-center justify-between min-w-0">
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate break-words">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 break-words">
                            {submission.status === 'submitted' && 'Pending review'}
                            {submission.status === 'graded' && `Graded: ${submission.grade}%`}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex min-w-0">
                          {submission.status === 'graded' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-4 text-center text-sm text-gray-500 break-words">
                  No submissions yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
