"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Award, CheckCircle, XCircle, AlertTriangle, FileCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  walletAddress: string | null;
}

interface ProjectSubmission {
  id: string;
  studentId: string;
  projectId: string;
  status: string;
  submittedAt: string;
  student: Student;
  project: {
    id: string;
    title: string;
    courseId: string;
  };
}

interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  tokenId: string;
  transactionHash: string;
  issuedAt: string;
  expiresAt: string | null;
  student: Student;
  course: Course;
}

const CertificateManagementPage = () => {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [pendingSubmissions, setPendingSubmissions] = useState<ProjectSubmission[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Fetch instructor's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses/instructor');
        const data = await response.json();
        
        if (response.ok) {
          setCourses(data.courses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    
    if (session) {
      fetchCourses();
    }
  }, [session]);

  // Fetch pending submissions and issued certificates when a course is selected
  useEffect(() => {
    if (!selectedCourse) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch pending submissions
        const submissionsResponse = await fetch(`/api/courses/${selectedCourse}/submissions?status=approved`);
        const submissionsData = await submissionsResponse.json();
        
        // Fetch issued certificates
        const certificatesResponse = await fetch(`/api/courses/${selectedCourse}/certificates`);
        const certificatesData = await certificatesResponse.json();
        
        if (submissionsResponse.ok) {
          setPendingSubmissions(submissionsData.submissions);
        }
        
        if (certificatesResponse.ok) {
          setCertificates(certificatesData.certificates);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load submissions and certificates. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCourse]);

  // Handle issuing a certificate
  const handleIssueCertificate = async (studentId: string) => {
    if (!selectedCourse || isSubmitting) return;
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          courseId: selectedCourse,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Certificate issued successfully!'
        });
        
        // Refresh the lists
        const certificatesResponse = await fetch(`/api/courses/${selectedCourse}/certificates`);
        const certificatesData = await certificatesResponse.json();
        
        if (certificatesResponse.ok) {
          setCertificates(certificatesData.certificates);
          // Remove the student from pending submissions
          setPendingSubmissions(prev => 
            prev.filter(submission => submission.studentId !== studentId)
          );
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to issue certificate. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setMessage({
        type: 'error',
        text: 'Failed to issue certificate. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 min-w-0">
            <div className="flex items-center min-w-0">
              <Link
                href="/dashboard/instructor"
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center break-words min-w-0">
                <Award className="h-6 w-6 mr-2 text-indigo-600" />
                Certificate Management
              </h1>
            </div>
            <div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md break-words"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex min-w-0">
              <div className="flex-shrink-0 min-w-0">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium break-words">{message.text}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setMessage(null)}
                    className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600 min-w-0"
                  >
                    <span className="sr-only">Dismiss</span>
                    <XCircle className={`h-5 w-5 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedCourse ? (
          isLoading ? (
            <div className="flex justify-center items-center py-12 min-w-0">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:gap-8">
              {/* Pending Submissions Section */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center break-words min-w-0">
                    <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                    Students Eligible for Certification
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500 break-words">
                    Students who have completed all required projects for this course.
                  </p>
                </div>
                
                {pendingSubmissions.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {pendingSubmissions.map((submission) => (
                      <li key={submission.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between min-w-0">
                            <div className="flex flex-col min-w-0">
                              <p className="text-sm font-medium text-blue-600 truncate break-words">
                                {submission.student.name}
                              </p>
                              <p className="text-sm text-gray-500 break-words">
                                {submission.student.email}
                              </p>
                              <div className="mt-2 flex items-center text-sm text-gray-500 break-words min-w-0">
                                <p>
                                  Project: <span className="font-medium break-words">{submission.project.title}</span>
                                </p>
                                <span className="mx-1">•</span>
                                <p>
                                  Submitted: <span className="font-medium break-words">{formatDate(submission.submittedAt)}</span>
                                </p>
                              </div>
                              {!submission.student.walletAddress && (
                                <p className="mt-1 text-xs text-yellow-600 flex items-center min-w-0">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Student has not connected a wallet address
                                </p>
                              )}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleIssueCertificate(submission.student.id)}
                                disabled={isSubmitting || !submission.student.walletAddress}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed break-words min-w-0"
                              >
                                {isSubmitting ? 'Issuing...' : 'Issue Certificate'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                    No eligible students found for certification.
                  </div>
                )}
              </div>

              {/* Issued Certificates Section */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center break-words min-w-0">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    Issued Certificates
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500 break-words">
                    Certificates that have already been issued for this course.
                  </p>
                </div>
                
                {certificates.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {certificates.map((certificate) => (
                      <li key={certificate.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between min-w-0">
                            <div className="flex flex-col min-w-0">
                              <p className="text-sm font-medium text-blue-600 truncate break-words">
                                {certificate.student.name}
                              </p>
                              <p className="text-sm text-gray-500 break-words">
                                {certificate.student.email}
                              </p>
                              <div className="mt-2 flex items-center text-sm text-gray-500 break-words min-w-0">
                                <p>
                                  Token ID: <span className="font-mono font-medium break-words">{certificate.tokenId}</span>
                                </p>
                                <span className="mx-1">•</span>
                                <p>
                                  Issued: <span className="font-medium break-words">{formatDate(certificate.issuedAt)}</span>
                                </p>
                                {certificate.expiresAt && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <p>
                                      Expires: <span className="font-medium break-words">{formatDate(certificate.expiresAt)}</span>
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                            <div>
                              <Link 
                                href={`/verify?id=${certificate.id}`}
                                target="_blank"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 break-words min-w-0"
                              >
                                View Certificate
                              </Link>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                    No certificates have been issued for this course yet.
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-8">
            <div className="flex min-w-0">
              <div className="flex-shrink-0 min-w-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 break-words">
                  Please select a course to manage certificates.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CertificateManagementPage;
