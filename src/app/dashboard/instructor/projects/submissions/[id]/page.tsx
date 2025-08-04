"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, FileCode, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import RubricApplicator from '@/components/projects/rubrics/RubricApplicator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

// Status badge colors
const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  REVIEWING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REVISION_REQUESTED: 'bg-purple-100 text-purple-800',
};

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);

  const [submission, setSubmission] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('submission');

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
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast.error('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async (assessment: any) => {
    try {

      
      // Determine the final status based on assessment
      const passThreshold = 70; // Assuming 70% is the pass threshold
      const status = assessment.percentage >= passThreshold ? 'APPROVED' : 'REVISION_REQUESTED';
      
      const response = await fetch(`/api/projects/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: assessment.feedback,
          grade: assessment.percentage,
          status,
          assessment
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save review');
      }
      
      toast.success('Review submitted successfully');
      fetchSubmission(); // Refresh the submission data
      setActiveTab('feedback'); // Switch to feedback tab
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to submit review');
    } finally {

    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen min-w-0">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 break-words">Submission Not Found</h2>
        <p className="text-gray-600 mb-6">The submission you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/dashboard/instructor/projects')}>
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
          onClick={() => router.push('/dashboard/instructor/projects')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 min-w-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 break-words">
              Review Submission
            </h1>
            <p className="text-gray-600 mt-1">
              Project: {submission.project.title}
            </p>
          </div>
          
          <Badge 
            className={`${statusColors[submission.status] || 'bg-gray-100 text-gray-800'} text-sm px-3 py-1`}
          >
            {submission.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>
      
      {/* Student info card */}
      <Card className="mb-6">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center min-w-0">
            <Avatar className="h-12 w-12 mr-4">
              <AvatarImage src={submission.student.image || ''} alt={submission.student.name} />
              <AvatarFallback>{submission.student.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 break-words">{submission.student.name}</h3>
              <p className="text-gray-600">{submission.student.email}</p>
            </div>
            
            <div className="ml-auto text-right">
              <p className="text-sm text-gray-600 break-words">
                Submitted {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="submission">Submission</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="feedback" disabled={!submission.assessment}>Feedback</TabsTrigger>
        </TabsList>
        
        {/* Submission Content Tab */}
        <TabsContent value="submission" className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Submission</CardTitle>
              <CardDescription>
                Review the student's submitted work including repository, demo, and description.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 lg:space-y-6">
              {/* Repository and Demo Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submission.repositoryUrl && (
                  <a 
                    href={submission.repositoryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 min-w-0"
                  >
                    <FileCode className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="flex-1 font-medium break-words min-w-0">View Repository</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                
                {submission.demoUrl && (
                  <a 
                    href={submission.demoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 min-w-0"
                  >
                    <ExternalLink className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="flex-1 font-medium break-words min-w-0">View Live Demo</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
              </div>
              
              {/* Submission Description */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2 break-words">Student Description</h3>
                <div className="bg-gray-50 rounded-lg p-4 prose max-w-none">
                  {submission.description ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: submission.description
                        .replace(/\n/g, '<br>')
                        .replace(/#{1,6}\s+([^\n]+)/g, '<strong>$1</strong><br>')
                        .replace(/\*\s+([^\n]+)/g, 'u2022 $1<br>')
                    }} />
                  ) : (
                    <p className="text-gray-500 italic">No description provided.</p>
                  )}
                </div>
              </div>
              
              {/* Screenshots or Images */}
              {submission.screenshots && submission.screenshots.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 break-words">Screenshots</h3>
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
          </Card>
        </TabsContent>
        
        {/* Assessment Tab */}
        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Rubric</CardTitle>
              <CardDescription>
                Evaluate the submission using the project rubric. Provide specific feedback for each criterion.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {submission.project.rubric ? (
                <RubricApplicator 
                  rubric={submission.project.rubric}
                  submissionId={submission.id}
                  evaluatorId={submission.project.course.instructorId}
                  initialAssessment={submission.assessment}
                  onSave={handleSaveAssessment}
                  readOnly={submission.status === 'APPROVED' || submission.status === 'REJECTED'}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    No rubric has been defined for this project. Please create a rubric before assessing submissions.
                  </p>
                  <Button asChild>
                    <Link href={`/dashboard/instructor/projects/${submission.project.id}/edit`}>
                      Create Rubric
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Feedback Tab */}
        <TabsContent value="feedback">
          {submission.assessment ? (
            <Card>
              <CardHeader>
                <CardTitle>Feedback to Student</CardTitle>
                <CardDescription>
                  This is the feedback that has been provided to the student.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 lg:space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4 min-w-0">
                    <div>
                      <p className="text-sm text-gray-500 break-words">Final Grade</p>
                      <p className="text-2xl font-bold text-gray-900 break-words">{submission.grade}%</p>
                    </div>
                    
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
                          .replace(/\*\s+([^\n]+)/g, 'u2022 $1<br>')
                      }} />
                    ) : (
                      <p className="text-gray-500 italic">No detailed feedback provided.</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 break-words">Assessment Details</h3>
                  <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200 overflow-hidden">
                    {submission.assessment.criteriaAssessments?.map((ca: any) => {
                      const criterion = submission.project.rubric.criteria.find((c: any) => c.id === ca.criterionId);
                      const level = criterion?.levels.find((l: any) => l.id === ca.levelId);
                      
                      return (
                        <div key={ca.criterionId} className="p-4">
                          <div className="flex justify-between items-start mb-2 min-w-0">
                            <h4 className="font-medium text-gray-900 break-words">{criterion?.name}</h4>
                            <div className="text-right">
                              <span className="text-sm text-gray-600 break-words">{ca.score} / {ca.maxScore}</span>
                            </div>
                          </div>
                          
                          {level && (
                            <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-md text-sm mb-2 break-words">
                              <span className="font-medium break-words">{level.name}:</span> {level.description}
                            </div>
                          )}
                          
                          {ca.comment && (
                            <div className="text-sm text-gray-700 italic break-words">
                              "{ca.comment}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="border-t border-gray-200 bg-gray-50">
                <div className="w-full text-sm text-gray-500 break-words">
                  Assessment submitted {submission.reviewedAt && formatDistanceToNow(new Date(submission.reviewedAt), { addSuffix: true })}
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2 break-words">No Feedback Yet</h3>
                <p className="text-gray-600 mb-6">
                  This submission hasn't been assessed yet. Go to the Assessment tab to provide feedback.
                </p>
                <Button onClick={() => setActiveTab('assessment')}>
                  Assess Submission
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
