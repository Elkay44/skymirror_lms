"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, ExternalLink, FileCode, MessageSquare, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

// Status badge colors
const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  REVIEWING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REVISION_REQUESTED: 'bg-purple-100 text-purple-800',
};

// Status icons
const statusIcons: Record<string, any> = {
  SUBMITTED: <Clock className="h-5 w-5" />,
  REVIEWING: <Clock className="h-5 w-5" />,
  APPROVED: <CheckCircle className="h-5 w-5" />,
  REJECTED: <XCircle className="h-5 w-5" />,
  REVISION_REQUESTED: <AlertCircle className="h-5 w-5" />,
};

export default function SubmissionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submission, setSubmission] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [responseText, setResponseText] = useState<string>('');
  
  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/submissions/${submissionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch submission');
      }
      
      const data = await response.json();
      setSubmission(data.submission);
      
      // If there's feedback and the status is REVISION_REQUESTED, switch to the feedback tab
      if (data.submission.feedback && data.submission.status === 'REVISION_REQUESTED') {
        setActiveTab('feedback');
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast.error('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response before submitting');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await fetch(`/api/projects/submissions/${submissionId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: responseText,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }
      
      toast.success('Response submitted successfully');
      fetchSubmission(); // Refresh the submission data
      setResponseText(''); // Clear the response text
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = () => {
    // Navigate to the project submission page with the submission ID as a query parameter
    // This will allow the submission page to pre-fill the form with the previous submission's data
    router.push(`/dashboard/student/projects/submit?projectId=${submission.projectId}&resubmit=${submissionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Submission Not Found</h2>
        <p className="text-gray-600 mb-6">The submission you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/dashboard/student/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header with breadcrumb navigation */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/student/projects')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Project Submission
            </h1>
            <p className="text-gray-600 mt-1">
              {submission.project?.title}
            </p>
          </div>
          
          <Badge 
            className={`${statusColors[submission.status] || 'bg-gray-100 text-gray-800'} flex items-center gap-2 px-3 py-1.5`}
          >
            {statusIcons[submission.status]}
            {submission.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>
      
      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="details">Submission Details</TabsTrigger>
          <TabsTrigger value="feedback" disabled={!submission.feedback}>Instructor Feedback</TabsTrigger>
          <TabsTrigger value="response" disabled={submission.status !== 'REVISION_REQUESTED'}>Submit Response</TabsTrigger>
        </TabsList>
        
        {/* Submission Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Information</CardTitle>
              <CardDescription>
                Details of your project submission and associated resources.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Submission Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted On</h3>
                  <p className="font-medium">
                    {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                  </p>
                </div>
                
                {submission.reviewedAt && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Reviewed On</h3>
                    <p className="font-medium">
                      {new Date(submission.reviewedAt).toLocaleDateString()} at {new Date(submission.reviewedAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Repository and Demo Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submission.repositoryUrl && (
                  <a 
                    href={submission.repositoryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <FileCode className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="flex-1 font-medium">View Repository</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                
                {submission.demoUrl && (
                  <a 
                    href={submission.demoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ExternalLink className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="flex-1 font-medium">View Live Demo</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
              </div>
              
              {/* Submission Description */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Your Description</h3>
                <div className="bg-gray-50 rounded-lg p-4 prose max-w-none">
                  {submission.description ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: submission.description
                        .replace(/\n/g, '<br>')
                        .replace(/#{1,6}\s+([^\n]+)/g, '<strong>$1</strong><br>')
                        .replace(/\*\s+([^\n]+)/g, '• $1<br>')
                    }} />
                  ) : (
                    <p className="text-gray-500 italic">No description provided.</p>
                  )}
                </div>
              </div>
              
              {/* Screenshots or Images */}
              {submission.screenshots && submission.screenshots.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Screenshots</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {submission.screenshots.map((screenshot: string, index: number) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                        <Image 
                          src={screenshot} 
                          alt={`Screenshot ${index + 1}`} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t border-gray-100 bg-gray-50 gap-4 flex-wrap">
              <p className="text-sm text-gray-600">
                Submission ID: {submission.id}
              </p>
              
              {['REJECTED', 'REVISION_REQUESTED'].includes(submission.status) && (
                <Button onClick={handleResubmit}>
                  Resubmit Project
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Feedback</CardTitle>
              <CardDescription>
                Review the assessment and feedback provided by your instructor.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Grade and Status */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  {submission.grade !== null && submission.grade !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Grade</p>
                      <p className="text-2xl font-bold text-gray-900">{submission.grade}%</p>
                    </div>
                  )}
                  
                  <Badge 
                    className={`${statusColors[submission.status] || 'bg-gray-100 text-gray-800'} text-sm px-3 py-1`}
                  >
                    {submission.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                
                <div className="prose max-w-none">
                  {submission.feedback ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: submission.feedback
                        .replace(/\n/g, '<br>')
                        .replace(/#{1,6}\s+([^\n]+)/g, '<strong>$1</strong><br>')
                        .replace(/\*\s+([^\n]+)/g, '• $1<br>')
                    }} />
                  ) : (
                    <p className="text-gray-500 italic">No detailed feedback provided yet.</p>
                  )}
                </div>
              </div>
              
              {/* Rubric Assessment if available */}
              {submission.assessment && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Assessment Details</h3>
                  <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                    {submission.assessment.criteriaAssessments?.map((ca: any) => {
                      const criterion = submission.project.rubric.criteria.find((c: any) => c.id === ca.criterionId);
                      const level = criterion?.levels.find((l: any) => l.id === ca.levelId);
                      
                      return (
                        <div key={ca.criterionId} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{criterion?.name}</h4>
                            <div className="text-right">
                              <span className="text-sm text-gray-600">{ca.score} / {ca.maxScore}</span>
                            </div>
                          </div>
                          
                          {level && (
                            <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-md text-sm mb-2">
                              <span className="font-medium">{level.name}:</span> {level.description}
                            </div>
                          )}
                          
                          {ca.comment && (
                            <div className="text-sm text-gray-700 italic">
                              "{ca.comment}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t border-gray-100 bg-gray-50 gap-4">
              {submission.status === 'REVISION_REQUESTED' && (
                <Button onClick={() => setActiveTab('response')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Respond to Feedback
                </Button>
              )}
              
              {['REJECTED', 'REVISION_REQUESTED'].includes(submission.status) && (
                <Button onClick={handleResubmit}>
                  Resubmit Project
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Response Tab */}
        <TabsContent value="response">
          <Card>
            <CardHeader>
              <CardTitle>Respond to Feedback</CardTitle>
              <CardDescription>
                Provide a response to your instructor's feedback before resubmitting your project.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                  <h3 className="font-medium mb-2 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Revision Requested
                  </h3>
                  <p className="text-sm">
                    Your instructor has requested revisions to your project. Please review their feedback, 
                    respond with your understanding of the changes needed, and then resubmit your project with the required changes.
                  </p>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Response
                  </label>
                  <Textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Explain your understanding of the required changes and how you plan to address them..."
                    rows={8}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Markdown formatting is supported. Use # for headings, * for bullet points, etc.
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t border-gray-100 bg-gray-50 gap-4">
              <Button 
                onClick={handleSubmitResponse}
                disabled={submitting || !responseText.trim()}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                    Submitting...
                  </>
                ) : (
                  <>Submit Response</>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleResubmit}
              >
                Resubmit Project
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
