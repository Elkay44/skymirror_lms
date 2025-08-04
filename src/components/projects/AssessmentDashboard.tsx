"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Award,
  ChevronRight,
  ChevronDown,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

// Types
interface Submission {
  id: string;
  status: 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
  submittedAt: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    image?: string;
  };
  projectId: string;
  project: {
    id: string;
    title: string;
    courseId: string;
    course: {
      id: string;
      title: string;
    };
  };
  submissionUrl?: string;
  repositoryUrl?: string;
  grade?: number;
  feedback?: string;
  reviewedAt?: string;
}

interface AssessmentDashboardProps {
  courseId?: string; // Optional - to filter by course
}

// Status configuration for styling
const statusConfig = {
  SUBMITTED: { icon: <Clock className="h-5 w-5 text-blue-500" />, color: 'bg-blue-100 text-blue-800' },
  REVIEWING: { icon: <Clock className="h-5 w-5 text-indigo-500" />, color: 'bg-indigo-100 text-indigo-800' },
  APPROVED: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: 'bg-green-100 text-green-800' },
  REVISION_REQUESTED: { icon: <AlertCircle className="h-5 w-5 text-amber-500" />, color: 'bg-amber-100 text-amber-800' },
  REJECTED: { icon: <XCircle className="h-5 w-5 text-red-500" />, color: 'bg-red-100 text-red-800' }
};

export default function AssessmentDashboard({ courseId }: AssessmentDashboardProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  
  // Fetch submissions on component mount
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Construct URL with optional courseId filter
        let url = '/api/projects/submissions';
        if (courseId) {
          url += `?courseId=${courseId}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [courseId]);
  
  // Filter submissions based on current filter
  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    if (filter === 'pending') {
      return ['SUBMITTED', 'REVIEWING'].includes(submission.status);
    }
    if (filter === 'reviewed') {
      return ['APPROVED', 'REVISION_REQUESTED', 'REJECTED'].includes(submission.status);
    }
    return true;
  });
  
  // Handle navigation to review page
  const handleReviewSubmission = (submissionId: string) => {
    router.push(`/dashboard/instructor/projects/review?submissionId=${submissionId}`);
  };
  
  // Toggle expanded view for a submission
  const toggleExpand = (submissionId: string) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
    } else {
      setExpandedSubmission(submissionId);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse inline-block h-8 w-8 rounded-full bg-blue-200"></div>
        <p className="mt-2 text-gray-600">Loading submissions...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (filteredSubmissions.length === 0) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 break-words">No submissions to review</h3>
          <p className="mt-1 text-gray-500">
            {filter === 'pending' 
              ? 'There are no pending submissions to review at this time.'
              : filter === 'reviewed'
                ? 'You haven\'t reviewed any submissions yet.'
                : 'There are no submissions to display.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 break-words">Project Submissions</h2>
          
          <div className="flex space-x-2 min-w-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === 'all' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('reviewed')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === 'reviewed' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
            >
              Reviewed
            </button>
          </div>
        </div>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {filteredSubmissions.map((submission) => (
          <li key={submission.id} className="hover:bg-gray-50 transition-colors">
            <div className="p-4">
              <div className="flex items-start justify-between min-w-0">
                <div className="flex items-start space-x-3 min-w-0">
                  {submission.student.image ? (
                    <img 
                      src={submission.student.image} 
                      alt={submission.student.name}
                      className="h-10 w-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center min-w-0">
                      <span className="text-blue-800 font-medium break-words">
                        {submission.student.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 break-words">{submission.student.name}</h3>
                    <p className="text-sm text-gray-500 break-words">{submission.project.course.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[submission.status].color}`}>
                    {statusConfig[submission.status].icon}
                    <span className="ml-1">{submission.status.replace('_', ' ')}</span>
                  </span>
                  
                  <button
                    onClick={() => toggleExpand(submission.id)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Toggle details"
                  >
                    {expandedSubmission === submission.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-900 break-words">{submission.project.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
              
              {expandedSubmission === submission.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 pt-3 border-t border-gray-100"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {submission.submissionUrl && (
                      <a
                        href={submission.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 break-words min-w-0"
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        View Submission
                      </a>
                    )}
                    
                    {submission.repositoryUrl && (
                      <a
                        href={submission.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 break-words min-w-0"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View Repository
                      </a>
                    )}
                  </div>
                  
                  {submission.status === 'APPROVED' && submission.grade && (
                    <div className="mt-3 flex items-center min-w-0">
                      <Award className="h-5 w-5 text-green-500 mr-1.5" />
                      <span className="text-sm font-medium text-gray-900 break-words">
                        Grade: {submission.grade}%
                      </span>
                    </div>
                  )}
                  
                  {submission.feedback && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-900 flex items-center break-words min-w-0">
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        Feedback
                      </h5>
                      <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md break-words">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end min-w-0">
                    <button
                      onClick={() => handleReviewSubmission(submission.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors break-words"
                    >
                      {['SUBMITTED', 'REVIEWING'].includes(submission.status) 
                        ? 'Review Submission' 
                        : 'Update Assessment'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
