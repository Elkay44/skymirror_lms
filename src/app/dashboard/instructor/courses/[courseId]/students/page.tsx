'use client';

import { PageLayout } from '../_components/PageLayout';
import { Search, Filter, UserPlus, ExternalLink, MessageSquare, BarChart, BookOpen, Calendar, Mail, User } from 'lucide-react';
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

// Mock data for students
const mockStudents: StudentData[] = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    status: 'active',
    lastActive: '2023-04-15T14:30:00Z',
    progress: 75,
    completedLessons: 15,
    totalLessons: 20,
    joinDate: '2023-01-10',
    grade: 'A'
  },
  // ... more mock data
];

interface StudentsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default function StudentsPage({ searchParams: searchParamsPromise }: StudentsPageProps) {
  const [searchParams, setSearchParams] = useState<{ status?: string }>({});
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  
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

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch this data from your API
        // const response = await fetch(`/api/courses/${params.courseId}/students`);
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          setStudents(mockStudents);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, [params.courseId]);

  // Filter students based on search term and status
  useEffect(() => {
    if (students.length === 0) return;

    let result = [...students];
    
    // Filter by status
    const status = searchParams.status || urlSearchParams.get('status');
    if (status) {
      result = result.filter(student => student.status === status);
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
  }, [students, searchTerm, searchParams.status, urlSearchParams]);

  const handleInviteStudent = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    try {
      // In a real app, you would call your API to send the invitation
      // await fetch(`/api/courses/${params.courseId}/invite`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: inviteEmail, message: inviteMessage })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteMessage('');
      setIsInviteDialogOpen(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
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
      headerActions={[
        <Button key="invite" onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Students
        </Button>
      ]}
    >
      <div className="space-y-6">
        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10 w-full"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={searchParams.status || urlSearchParams.get('status') || ''}
            onValueChange={(value) => {
              router.push(`?status=${value}`);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Students</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students list */}
        {loading ? (
          <div className="flex justify-center py-12">
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
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
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.lastActive).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
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

      {/* Invite Student Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Students</DialogTitle>
            <DialogDescription>
              Invite students to join your course by entering their email addresses below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Email Address</label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Message (Optional)</label>
              <Textarea
                placeholder="Add a personal message..."
                rows={4}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteStudent}>
              Send Invitation
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
                <div className="flex items-center space-x-4">
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
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1 text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedStudent.status)}`}>
                      {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Grade</h4>
                  <p className="mt-1 text-sm">{selectedStudent.grade || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Joined</h4>
                  <p className="mt-1 text-sm">
                    {new Date(selectedStudent.joinDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Last Active</h4>
                  <p className="mt-1 text-sm">
                    {new Date(selectedStudent.lastActive).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Progress</h4>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedStudent.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
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
