"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Clock, FileCheck, AlertTriangle, Filter, RefreshCw, ChevronRight, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// Status badge styling
const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  REVIEWING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REVISION_REQUESTED: 'bg-purple-100 text-purple-800',
};

type ProjectSubmission = {
  id: string;
  studentId: string;
  projectId: string;
  submittedAt: string;
  status: string;
  repositoryUrl?: string;
  demoUrl?: string;
  project: {
    id: string;
    title: string;
    courseId: string;
    course: {
      title: string;
    };
  };
  student: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
};

export default function AssessmentDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  
  useEffect(() => {
    fetchSubmissions();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [submissions, courseFilter, statusFilter, searchQuery]);
  
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects/submissions/instructor');
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const data = await response.json();
      setSubmissions(data.submissions || []);
      
      // Extract unique courses for the filter
      const uniqueCourses = Array.from(
        new Set(data.submissions.map((s: ProjectSubmission) => s.project.courseId))
      ).map(courseId => {
        const submission = data.submissions.find(
          (s: ProjectSubmission) => s.project.courseId === courseId
        );
        return {
          id: courseId as string,
          title: submission?.project.course.title || 'Unknown Course',
        };
      });
      
      setCourses(uniqueCourses);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...submissions];
    
    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(sub => sub.project.courseId === courseFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        sub =>
          sub.student.name.toLowerCase().includes(query) ||
          sub.project.title.toLowerCase().includes(query) ||
          sub.project.course.title.toLowerCase().includes(query)
      );
    }
    
    setFilteredSubmissions(filtered);
  };
  
  const handleViewSubmission = (submissionId: string) => {
    router.push(`/dashboard/instructor/projects/submissions/${submissionId}`);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'REVIEWING':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'APPROVED':
        return <FileCheck className="h-4 w-4 mr-1" />;
      case 'REJECTED':
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      case 'REVISION_REQUESTED':
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      default:
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Student Submissions</h2>
        
        <Button 
          onClick={fetchSubmissions} 
          variant="outline"
          className="flex items-center gap-2 self-end"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div>
            <Select
              value={courseFilter}
              onValueChange={setCourseFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="REVIEWING">Reviewing</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="REVISION_REQUESTED">Revision Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by student or project"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8"
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : filteredSubmissions.length > 0 ? (
        <div className="space-y-4">
          {filteredSubmissions.map(submission => (
            <Card 
              key={submission.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewSubmission(submission.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={submission.student.image || ''} alt={submission.student.name} />
                      <AvatarFallback>{submission.student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">{submission.student.name}</h3>
                      <p className="text-sm text-gray-600">{submission.student.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <h4 className="font-medium text-gray-900">{submission.project.title}</h4>
                    <p className="text-sm text-gray-600">{submission.project.course.title}</p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[submission.status] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
                        {getStatusIcon(submission.status)}
                        {submission.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <p className="text-xs text-gray-500">
                        Submitted on {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                      </p>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileCheck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchQuery || courseFilter !== 'all' || statusFilter !== 'all' 
              ? 'No submissions match your current filters. Try adjusting your search criteria.' 
              : 'No student submissions are available yet. When students submit their projects, they will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
}
