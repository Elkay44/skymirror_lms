"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  FileText,
  Users,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

// Status configuration for styling
const statusConfig = {
  SUBMITTED: { 
    icon: <Clock className="h-5 w-5 text-blue-500" />, 
    color: 'bg-blue-100 text-blue-800', 
    label: 'Submitted'
  },
  REVIEWING: { 
    icon: <MessageSquare className="h-5 w-5 text-indigo-500" />, 
    color: 'bg-indigo-100 text-indigo-800', 
    label: 'Under Review'
  },
  APPROVED: { 
    icon: <CheckCircle className="h-5 w-5 text-green-500" />, 
    color: 'bg-green-100 text-green-800',
    label: 'Approved'
  },
  REJECTED: { 
    icon: <XCircle className="h-5 w-5 text-red-500" />, 
    color: 'bg-red-100 text-red-800',
    label: 'Rejected'
  },
  REVISION_REQUESTED: { 
    icon: <AlertCircle className="h-5 w-5 text-amber-500" />, 
    color: 'bg-amber-100 text-amber-800',
    label: 'Revision Requested'
  }
};

// Types
interface Student {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Submission {
  id: string;
  submissionUrl?: string;
  submissionText?: string;
  submissionFiles?: string; // JSON array of file URLs
  status: 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  grade?: number;
  feedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  revisionCount: number;
  student: Student;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  courseId: string;
  course?: {
    title: string;
  };
  pointsValue: number;
  dueDate?: string;
  isRequiredForCertification: boolean;
}

export default function ProjectSubmissions() {
  const { data: session } = useSession();

  const { projectId } = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected submission for review
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [reviewStatus, setReviewStatus] = useState('REVIEWING');
  const [submitting, setSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) throw new Error('Failed to fetch project details');
        const projectData = await projectResponse.json();
        setProject(projectData.project);
        
        // Fetch submissions
        const submissionsResponse = await fetch(`/api/projects/${projectId}/submissions`);
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
  
  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    // Pre-populate form with existing data if available
    setFeedback(submission.feedback || '');
    setGrade(submission.grade !== undefined ? submission.grade : '');
    setReviewStatus(submission.status === 'SUBMITTED' ? 'REVIEWING' : submission.status);
    setReviewSuccess(false); // Reset success state
  };
  
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/projects/submissions/${selectedSubmission.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feedback,
          grade: grade !== '' ? Number(grade) : undefined,
          status: reviewStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
      
      // Update the submission in the list
      await response.json();
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === selectedSubmission.id 
            ? { 
                ...sub, 
                status: reviewStatus as 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED', 
                feedback, 
                grade: grade !== '' ? Number(grade) : undefined, 
                reviewedAt: new Date().toISOString() 
              }
            : sub
        )
      );
      
      setReviewSuccess(true);
      
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
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
        <div className="flex items-center mb-6 min-w-0">
          <Link href="/dashboard/instructor/projects" className="mr-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold break-words">Loading Project Submissions...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6 min-w-0">
          <Link href="/dashboard/instructor/projects" className="mr-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold break-words">Project Submissions</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline break-words"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6 min-w-0">
          <Link href="/dashboard/instructor/projects" className="mr-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold break-words">Project Not Found</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <p>The project could not be found. It may have been deleted or you don't have permission to access it.</p>
          <Link 
            href="/dashboard/instructor/projects" 
            className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline break-words"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center mb-2 min-w-0">
        <Link href="/dashboard/instructor/projects" className="mr-2">
          <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold break-words">{project.title}</h1>
      </div>
      
      <div className="mb-6 text-sm text-gray-500 break-words">
        <p className="flex items-center mb-1 min-w-0">
          <FileText className="h-4 w-4 mr-1.5" />
          Course: {project.course?.title || 'Unknown Course'}
        </p>
        {project.dueDate && (
          <p className="flex items-center mb-1 min-w-0">
            <Calendar className="h-4 w-4 mr-1.5" />
            Due: {new Date(project.dueDate).toLocaleDateString()}
          </p>
        )}
        <p className="flex items-center min-w-0">
          <Users className="h-4 w-4 mr-1.5" />
          Submissions: {submissions.length}
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-w-0">
        {/* Submissions List */}
        <div className="w-full lg:w-2/5">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 break-words">Student Submissions</h2>
            </div>
            
            {submissions.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-2">No submissions yet</p>
                <p className="text-sm text-gray-500 break-words">
                  Students haven't submitted this project yet.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[600px]">
                {submissions.map((submission) => (
                  <div 
                    key={submission.id} 
                    onClick={() => handleSelectSubmission(submission)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${selectedSubmission?.id === submission.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2 min-w-0">
                      <div className="flex items-center min-w-0">
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex-shrink-0 min-w-0">
                          {submission.student.image ? (
                            <Image
                              src={submission.student.image}
                              alt={submission.student.name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold break-words min-w-0">
                              {submission.student.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 break-words">{submission.student.name}</h3>
                          <p className="text-xs text-gray-500">{submission.student.email}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[submission.status].color}`}>
                        {statusConfig[submission.status].label}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                      {submission.reviewedAt && (
                        <p>
                          Reviewed: {new Date(submission.reviewedAt).toLocaleString()}
                        </p>
                      )}
                      {submission.revisionCount > 0 && (
                        <p>
                          Revisions: {submission.revisionCount}
                        </p>
                      )}
                      {submission.grade !== undefined && (
                        <p className="font-medium text-green-600 break-words">
                          Grade: {submission.grade}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Submission Details & Review Form */}
        <div className="w-full lg:w-3/5">
          {selectedSubmission ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 break-words">
                  Submission Details
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedSubmission.status].color}`}>
                  {statusConfig[selectedSubmission.status].label}
                </span>
              </div>
              
              <div className="p-5">
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 break-words">
                    Student Information
                  </h3>
                  <div className="flex items-center min-w-0">
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex-shrink-0 min-w-0">
                      {selectedSubmission.student.image ? (
                        <Image
                          src={selectedSubmission.student.image}
                          alt={selectedSubmission.student.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold break-words min-w-0">
                          {selectedSubmission.student.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 break-words">{selectedSubmission.student.name}</h3>
                      <p className="text-xs text-gray-500">{selectedSubmission.student.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 break-words">
                    Submission Details
                  </h3>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 break-words">
                      <p className="mb-1">Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                      {selectedSubmission.reviewedAt && (
                        <p className="mb-1">Last reviewed: {new Date(selectedSubmission.reviewedAt).toLocaleString()}</p>
                      )}
                      {selectedSubmission.revisionCount > 0 && (
                        <p>Revision count: {selectedSubmission.revisionCount}</p>
                      )}
                    </div>
                    
                    {selectedSubmission.submissionUrl && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Project URL</h4>
                        <a 
                          href={selectedSubmission.submissionUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 flex items-center min-w-0"
                        >
                          {selectedSubmission.submissionUrl}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    )}
                    
                    {selectedSubmission.submissionText && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Project Description</h4>
                        <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 break-words">
                          {selectedSubmission.submissionText}
                        </div>
                      </div>
                    )}
                    
                    {selectedSubmission.submissionFiles && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Submitted Files</h4>
                        <ul className="space-y-1">
                          {parseSubmissionFiles(selectedSubmission.submissionFiles).map((file: any, index: number) => (
                            <li key={index} className="text-sm break-words">
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:text-blue-800 flex items-center min-w-0"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                {file.name}
                                <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(2)} KB)</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 break-words">
                    Review & Feedback
                  </h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                        Feedback
                      </label>
                      <textarea
                        id="feedback"
                        name="feedback"
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="border border-gray-300 rounded-md w-full px-3 py-2"
                        placeholder="Provide detailed feedback for the student"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                          Grade (0-100)
                        </label>
                        <input
                          type="number"
                          id="grade"
                          name="grade"
                          min="0"
                          max="100"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
                          className="border border-gray-300 rounded-md w-full px-3 py-2"
                          placeholder="e.g. 85"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1 break-words">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={reviewStatus}
                          onChange={(e) => setReviewStatus(e.target.value)}
                          className="border border-gray-300 rounded-md w-full px-3 py-2"
                          required
                        >
                          <option value="REVIEWING">Under Review</option>
                          <option value="APPROVED">Approve</option>
                          <option value="REVISION_REQUESTED">Request Revision</option>
                          <option value="REJECTED">Reject</option>
                        </select>
                      </div>
                    </div>
                    
                    {reviewSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-800 text-sm break-words">
                        <p className="flex items-center min-w-0">
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Review submitted successfully!
                        </p>
                      </div>
                    )}
                    
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm break-words">
                        <p className="flex items-center min-w-0">
                          <XCircle className="h-4 w-4 mr-1.5" />
                          {error}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-end min-w-0">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full flex items-center justify-center p-8 min-w-0 overflow-hidden">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2 break-words">No Submission Selected</h3>
                <p className="text-gray-600 max-w-md">
                  Select a student submission from the list to view details and provide feedback.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
