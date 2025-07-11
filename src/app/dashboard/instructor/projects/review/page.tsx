"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Github,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Award,
  MessageSquare,
  User,
  Code,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

// Import rubric components
import RubricApplicator from '@/components/projects/rubrics/RubricApplicator';

// Types
interface Rubric {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  criteria: RubricCriterion[];
}

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  levels: RubricLevel[];
}

interface RubricLevel {
  id: string;
  name: string;
  points: number;
  description: string;
}

interface Assessment {
  id?: string;
  submissionId: string;
  rubricId: string;
  criteriaScores: {
    criterionId: string;
    levelId: string;
    points: number;
  }[];
  totalScore: number;
  feedback: string;
  status: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
}

interface Submission {
  id: string;
  status: 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
  submittedAt: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  projectId: string;
  project: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    courseId: string;
    course: {
      id: string;
      title: string;
    };
    skills?: string[];
    pointsValue: number;
  };
  submissionUrl?: string;
  repositoryUrl?: string;
  demoUrl?: string;
  notes?: string;
  grade?: number;
  feedback?: string;
  reviewedAt?: string;
  assessment?: {
    id: string;
    rubricId: string;
    criteriaScores: any[];
    totalScore: number;
    feedback: string;
  };
}

export default function ProjectReview() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [availableRubrics, setAvailableRubrics] = useState<Rubric[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState<string>('');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED'>('APPROVED');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fetch submission data and available rubrics
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user || !submissionId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch submission details
        const submissionResponse = await fetch(`/api/projects/submissions/${submissionId}`);
        
        if (!submissionResponse.ok) {
          throw new Error('Failed to fetch submission details');
        }
        
        const submissionData = await submissionResponse.json();
        setSubmission(submissionData.submission);
        
        // Set initial feedback from existing feedback if available
        if (submissionData.submission.feedback) {
          setFeedback(submissionData.submission.feedback);
        }
        
        // Set initial status from existing status if available
        if (['APPROVED', 'REVISION_REQUESTED', 'REJECTED'].includes(submissionData.submission.status)) {
          setStatus(submissionData.submission.status as 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED');
        }
        
        // Fetch available rubrics
        const rubricsResponse = await fetch('/api/rubrics');
        
        if (!rubricsResponse.ok) {
          throw new Error('Failed to fetch rubrics');
        }
        
        const rubricsData = await rubricsResponse.json();
        setAvailableRubrics(rubricsData.rubrics || []);
        
        // If the submission has an associated project rubric, select it by default
        const projectRubric = rubricsData.rubrics.find(
          (rubric: Rubric) => rubric.id === submissionData.submission.project.rubricId
        );
        
        if (projectRubric) {
          setSelectedRubricId(projectRubric.id);
        } else if (rubricsData.rubrics.length > 0) {
          setSelectedRubricId(rubricsData.rubrics[0].id);
        }
        
        // If the submission has an existing assessment, load it
        if (submissionData.submission.assessment) {
          setAssessment(submissionData.submission.assessment);
          setSelectedRubricId(submissionData.submission.assessment.rubricId);
        }
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session, submissionId]);
  
  // Handle assessment updates from rubric applicator
  const handleAssessmentUpdate = (updatedAssessment: Assessment) => {
    setAssessment(updatedAssessment);
  };
  
  // Handle form submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submission || !session?.user) return;
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Prepare the review data
      const reviewData = {
        status,
        feedback,
        assessment: assessment ? {
          rubricId: assessment.rubricId,
          criteriaScores: assessment.criteriaScores,
          totalScore: assessment.totalScore,
          feedback: assessment.feedback
        } : undefined
      };
      
      // Submit the review
      const response = await fetch(`/api/projects/submissions/${submission.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
      
      const data = await response.json();
      setSuccess('Review submitted successfully!');
      
      // Update local submission data
      setSubmission(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status,
          feedback,
          reviewedAt: new Date().toISOString(),
          grade: assessment?.totalScore,
          assessment: assessment ? {
            id: assessment.id || '',
            rubricId: assessment.rubricId,
            criteriaScores: assessment.criteriaScores,
            totalScore: assessment.totalScore,
            feedback: assessment.feedback
          } : undefined
        };
      });
      
      // Redirect back to projects page after a short delay
      setTimeout(() => {
        router.push('/dashboard/instructor/projects');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="text-center">
          <div className="animate-pulse inline-block h-8 w-8 rounded-full bg-blue-200"></div>
          <p className="mt-2 text-gray-600">Loading submission details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <h2 className="mt-2 text-lg font-medium text-red-800">Error</h2>
          <p className="mt-1 text-red-700">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (!submission) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <h2 className="mt-2 text-lg font-medium text-amber-800">Submission Not Found</h2>
          <p className="mt-1 text-amber-700">The requested submission could not be found or you don't have permission to access it.</p>
          <button
            onClick={() => router.push('/dashboard/instructor/projects')}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Review Project Submission
          </h1>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium
              ${submission.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
              submission.status === 'REVIEWING' ? 'bg-indigo-100 text-indigo-800' :
              submission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              submission.status === 'REVISION_REQUESTED' ? 'bg-amber-100 text-amber-800' :
              'bg-red-100 text-red-800'}`}
            >
              {submission.status === 'SUBMITTED' && <Clock className="inline h-4 w-4 mr-1" />}
              {submission.status === 'REVIEWING' && <Clock className="inline h-4 w-4 mr-1" />}
              {submission.status === 'APPROVED' && <CheckCircle className="inline h-4 w-4 mr-1" />}
              {submission.status === 'REVISION_REQUESTED' && <AlertCircle className="inline h-4 w-4 mr-1" />}
              {submission.status === 'REJECTED' && <XCircle className="inline h-4 w-4 mr-1" />}
              {submission.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
      
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-start"
        >
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
          <span>{success}</span>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Submission details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-medium text-gray-900">Student Information</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                {submission.student.image ? (
                  <img
                    src={submission.student.image}
                    alt={submission.student.name}
                    className="h-12 w-12 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{submission.student.name}</h3>
                  <p className="text-sm text-gray-500">{submission.student.email}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Project info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-medium text-gray-900">Project Information</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">{submission.project.title}</h3>
                <p className="text-sm text-gray-500">{submission.project.course.title}</p>
              </div>
              
              <p className="text-sm text-gray-600">{submission.project.description}</p>
              
              {submission.project.skills && submission.project.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {submission.project.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-2">
                <p className="text-sm text-gray-600 flex items-center">
                  <Award className="h-4 w-4 mr-1.5 text-gray-500" />
                  Points: {submission.project.pointsValue}
                </p>
                {submission.submittedAt && (
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Submission links */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-medium text-gray-900">Submission Resources</h2>
            </div>
            <div className="p-4 space-y-3">
              {submission.submissionUrl && (
                <a
                  href={submission.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  View Submission
                </a>
              )}
              
              {submission.repositoryUrl && (
                <a
                  href={submission.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Github className="h-5 w-5 mr-2" />
                  View Repository
                </a>
              )}
              
              {submission.demoUrl && (
                <a
                  href={submission.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Globe className="h-5 w-5 mr-2" />
                  View Demo
                </a>
              )}
              
              {!submission.submissionUrl && !submission.repositoryUrl && !submission.demoUrl && (
                <p className="text-sm text-gray-500 italic">No resources provided with this submission</p>
              )}
              
              {submission.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Student Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{submission.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column - Review form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmitReview}>
            {/* Rubric assessment */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-medium text-gray-900">Assessment Rubric</h2>
                
                {availableRubrics.length > 1 && (
                  <select
                    value={selectedRubricId}
                    onChange={(e) => setSelectedRubricId(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
                  >
                    {availableRubrics.map(rubric => (
                      <option key={rubric.id} value={rubric.id}>
                        {rubric.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="p-4">
                {availableRubrics.length > 0 && selectedRubricId ? (
                  <RubricApplicator
                    rubric={availableRubrics.find(r => r.id === selectedRubricId) || availableRubrics[0]}
                    existingAssessment={assessment}
                    onAssessmentChange={handleAssessmentUpdate}
                  />
                ) : (
                  <div className="text-center py-6">
                    <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No rubrics available. Create a rubric first to assess this project.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Feedback and status */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium text-gray-900">Feedback & Status</h2>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Review Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="REVISION_REQUESTED">Revision Requested</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback to Student
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide detailed feedback on the student's work..."
                  />
                </div>
              </div>
            </div>
            
            {/* Submit buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className={`px-6 py-2 rounded-md text-white ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
