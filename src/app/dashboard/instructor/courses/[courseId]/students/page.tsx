'use client';

import { PageLayout } from '../_components/PageLayout';
import { Search, Filter, UserPlus, MessageSquare, BarChart, User } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  Avatar, 
  AvatarFallback,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import toast from 'react-hot-toast';

// Student data interface
interface StudentData {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  joinDate: string;
  grade?: string;
}

// Real students data will be fetched from API

interface StudentsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default function StudentsPage({ searchParams: searchParamsPromise }: StudentsPageProps) {
  const [searchParams, setSearchParams] = useState<{ status?: string }>({});
  const [students, setStudents] = useState<StudentData[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [enrollmentType, setEnrollmentType] = useState<'invite' | 'direct'>('invite');
  const [enrollmentData, setEnrollmentData] = useState({ emails: '', names: '', message: '' });
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  // Load search params when component mounts
  useEffect(() => {
    const loadSearchParams = async () => {
      try {
        const resolvedParams = await searchParamsPromise;
        setSearchParams(resolvedParams);
      } catch (err) {
        console.error('Error loading search params:', err);
      }
    };

    loadSearchParams();
  }, [searchParamsPromise]);

  // Fetch students data and pending invitations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch enrolled students
        const studentsResponse = await fetch(`/api/instructor/courses/${params.courseId}/students`);
        
        if (!studentsResponse.ok) {
          const errorText = await studentsResponse.text();
          console.error('Students API Error:', studentsResponse.status, errorText);
          throw new Error(`Failed to fetch students: ${studentsResponse.status}`);
        }
        
        const studentsData = await studentsResponse.json();
        console.log('Students API Response:', studentsData);
        
        // Handle different response structures
        const studentsArray = Array.isArray(studentsData) ? studentsData : (studentsData.students || []);
        
        if (!Array.isArray(studentsArray)) {
          console.error('Invalid data structure:', studentsData);
          throw new Error('Invalid response format');
        }
        
        // Transform the data to match our interface
        const transformedStudents: StudentData[] = studentsArray.map((enrollment: any) => ({
          id: enrollment.user.id,
          name: enrollment.user.name || 'Unknown Student',
          email: enrollment.user.email,
          avatarUrl: enrollment.user.image,
          status: enrollment.status || 'active',
          lastActive: enrollment.user.createdAt || enrollment.enrolledAt,
          progress: enrollment.progress || 0,
          completedLessons: enrollment.completedLessons || 0,
          totalLessons: enrollment.totalLessons || 0,
          joinDate: enrollment.enrolledAt,
          grade: enrollment.grade || 'N/A'
        }));
        
        setStudents(transformedStudents);
        
        // Fetch pending invitations
        try {
          const invitationsResponse = await fetch(`/api/courses/${params.courseId}/enroll`);
          if (invitationsResponse.ok) {
            const invitationsData = await invitationsResponse.json();
            setPendingInvitations(invitationsData.invitations || []);
          }
        } catch (inviteError) {
          console.error('Error fetching invitations:', inviteError);
          setPendingInvitations([]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setStudents([]);
        setPendingInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.courseId]);

  // Filter students and invitations based on search term and status
  useEffect(() => {
    const status = searchParams.status || urlSearchParams.get('status') || 'active';
    let result: StudentData[] = [];
    
    if (status === 'pending') {
      // Show pending invitations as student-like objects
      result = pendingInvitations.map((invitation: any) => ({
        id: invitation.id,
        name: invitation.email.split('@')[0],
        email: invitation.email,
        avatarUrl: undefined,
        status: 'pending' as const,
        lastActive: invitation.invitedAt,
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
        joinDate: invitation.invitedAt,
        grade: 'N/A'
      }));
    } else {
      // Show enrolled students
      result = students.filter(student => {
        if (status === 'active') return student.status === 'active';
        if (status === 'inactive') return student.status === 'inactive';
        return true;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        student =>
          student.name.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term)
      );
    }
    
    setFilteredStudents(result);
  }, [students, pendingInvitations, searchTerm, searchParams.status, urlSearchParams]);

  const handleEnrollStudents = async () => {
    if (!enrollmentData.emails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }
    
    try {
      setEnrollmentLoading(true);
      
      // Parse emails and names
      const emails = enrollmentData.emails.split('\n').map(e => e.trim()).filter(e => e);
      const names = enrollmentData.names.split('\n').map(n => n.trim()).filter(n => n);
      
      // Create students array
      const students = emails.map((email, index) => ({
        email,
        name: names[index] || email.split('@')[0]
      }));
      
      const response = await fetch(`/api/courses/${params.courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: enrollmentType,
          students,
          message: enrollmentData.message || null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process enrollment');
      }
      
      const result = await response.json();
      
      // Show results
      if (result.results.success.length > 0) {
        toast.success(`Successfully processed ${result.results.success.length} students`);
      }
      if (result.results.errors.length > 0) {
        toast.error(`${result.results.errors.length} errors occurred`);
      }
      
      // Reset form and close dialog
      setEnrollmentData({ emails: '', names: '', message: '' });
      setIsEnrollDialogOpen(false);
      
      // Refresh data
      window.location.reload();
      
    } catch (error) {
      console.error('Error processing enrollment:', error);
      toast.error('Failed to process enrollment');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleViewProfile = (student: StudentData) => {
    setSelectedStudent(student);
    setIsProfileDialogOpen(true);
  };

  const handleSendMessage = (student: StudentData) => {
    // In a real app, this would open a messaging interface
    router.push(`/dashboard/messages?to=${student.id}`);
  };

  const handleViewProgress = (student: StudentData) => {
    // In a real app, this would navigate to the student's progress page
    router.push(`/dashboard/instructor/courses/${params.courseId}/students/${student.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageLayout
      title="Students"
      description="Manage and communicate with your students"
      backHref={`/dashboard/instructor/courses/${params.courseId}`}
      actions={
        <Button key="enroll" onClick={() => setIsEnrollDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Students
        </Button>
      }
    >
      <div className="space-y-4 lg:space-y-6">
        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row gap-4 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10 w-full"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={searchParams.status || urlSearchParams.get('status') || 'all'}
            onValueChange={(value) => {
              router.push(value === 'all' ? '?' : `?status=${value}`);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students list */}
        {loading ? (
          <div className="flex justify-center py-12 min-w-0">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSearchParams({});
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">
                      Progress
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">
                      Last Active
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0 h-10 w-10 min-w-0">
                            <Avatar>
                              {student.avatarUrl ? (
                                <img src={student.avatarUrl} alt={student.name} />
                              ) : (
                                <AvatarFallback>
                                  {student.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 break-words">{student.name}</div>
                            <div className="text-sm text-gray-500 break-words">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student.status)}`}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.completedLessons} of {student.totalLessons} lessons
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 break-words">
                        {new Date(student.lastActive).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium break-words">
                        <div className="flex space-x-2 justify-end min-w-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewProfile(student)}
                            title="View Profile"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSendMessage(student)}
                            title="Send Message"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewProgress(student)}
                            title="View Progress"
                          >
                            <BarChart className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Enrollment Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Students to Course</DialogTitle>
            <DialogDescription>
              Add students to your course by invitation or direct enrollment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Enrollment Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium leading-none">Enrollment Type</label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="enrollmentType"
                    value="invite"
                    checked={enrollmentType === 'invite'}
                    onChange={(e) => setEnrollmentType(e.target.value as 'invite' | 'direct')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Send Invitation (requires confirmation)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="enrollmentType"
                    value="direct"
                    checked={enrollmentType === 'direct'}
                    onChange={(e) => setEnrollmentType(e.target.value as 'invite' | 'direct')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Direct Enrollment (immediate access)</span>
                </label>
              </div>
            </div>

            {/* Email Addresses */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Email Addresses</label>
              <Textarea
                placeholder="Enter email addresses (one per line)&#10;student1@example.com&#10;student2@example.com"
                rows={6}
                value={enrollmentData.emails}
                onChange={(e) => setEnrollmentData(prev => ({ ...prev, emails: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Enter one email address per line</p>
            </div>

            {/* Names (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Full Names (Optional)</label>
              <Textarea
                placeholder="Enter full names (one per line, matching email order)&#10;John Doe&#10;Jane Smith"
                rows={6}
                value={enrollmentData.names}
                onChange={(e) => setEnrollmentData(prev => ({ ...prev, names: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Enter names in the same order as emails. If not provided, names will be generated from email addresses.</p>
            </div>

            {/* Message (for invitations) */}
            {enrollmentType === 'invite' && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Invitation Message (Optional)</label>
                <Textarea
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                  value={enrollmentData.message}
                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEnrollDialogOpen(false);
                setEnrollmentData({ emails: '', names: '', message: '' });
              }}
              disabled={enrollmentLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEnrollStudents}
              disabled={enrollmentLoading || !enrollmentData.emails.trim()}
            >
              {enrollmentLoading ? 'Processing...' : 
                enrollmentType === 'invite' ? 'Send Invitations' : 'Enroll Students'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          {selectedStudent && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-4 min-w-0">
                  <Avatar className="h-12 w-12">
                    {selectedStudent.avatarUrl ? (
                      <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} />
                    ) : (
                      <AvatarFallback>
                        {selectedStudent.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedStudent.name}</DialogTitle>
                    <DialogDescription>{selectedStudent.email}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 break-words">Status</h4>
                  <p className="mt-1 text-sm break-words">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedStudent.status)}`}>
                      {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 break-words">Grade</h4>
                  <p className="mt-1 text-sm break-words">{selectedStudent.grade || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 break-words">Joined</h4>
                  <p className="mt-1 text-sm break-words">
                    {new Date(selectedStudent.joinDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 break-words">Last Active</h4>
                  <p className="mt-1 text-sm break-words">
                    {new Date(selectedStudent.lastActive).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 break-words">Progress</h4>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedStudent.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1 min-w-0">
                      <span>{selectedStudent.completedLessons} of {selectedStudent.totalLessons} lessons</span>
                      <span>{selectedStudent.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => handleViewProgress(selectedStudent)}>
                  View Full Progress
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
