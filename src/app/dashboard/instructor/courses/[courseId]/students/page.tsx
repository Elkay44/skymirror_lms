'use client';

import { PageLayout } from '../_components/PageLayout';
import { Search, Filter, UserPlus, ExternalLink, MessageSquare, BarChart, BookOpen, Calendar, Mail, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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
  progress: number;
  lastActive: string;
  enrolledDate: string;
  completedSections: number;
  totalSections: number;
  profileImage?: string;
  bio?: string;
  completedLessons: number;
  totalLessons: number;
  status: 'active' | 'inactive' | 'completed';
}

export default function StudentsPage({ searchParams }: { searchParams: { status?: string } }) {
  // Get URL parameters with a fallback to 'active'
  const urlStatus = searchParams.status || 'active';
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  
  // Create state for current status that syncs with URL
  const [currentStatus, setCurrentStatus] = useState<'active' | 'inactive' | 'completed'>(urlStatus as 'active' | 'inactive' | 'completed');
  
  // Use effect to sync state with URL parameters when they change
  useEffect(() => {
    if (urlStatus && (urlStatus === 'active' || urlStatus === 'inactive' || urlStatus === 'completed')) {
      setCurrentStatus(urlStatus as 'active' | 'inactive' | 'completed');
    }
  }, [urlStatus]);
  
  // State for dialogs and search
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [emailToEnroll, setEmailToEnroll] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');
  
  // Handle status change with local state and URL update
  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'active' || newStatus === 'inactive' || newStatus === 'completed') {
      // Update local state immediately
      setCurrentStatus(newStatus as 'active' | 'inactive' | 'completed');
      // Update URL without full page refresh
      router.replace(`/dashboard/instructor/courses/${courseId}/students?status=${newStatus}`, { 
        scroll: false 
      });
    }
  };
  
  // Mock data - in a real app, this would be fetched from API
  const allStudents: StudentData[] = [
    { 
      id: 1, 
      name: 'Alex Johnson', 
      email: 'alex@example.com', 
      progress: 85, 
      lastActive: '2h ago', 
      enrolledDate: 'May 15, 2023',
      completedSections: 5,
      totalSections: 8,
      completedLessons: 12,
      totalLessons: 24,
      status: 'active',
      profileImage: 'https://i.pravatar.cc/150?img=11',
      bio: 'Web developer with 5 years of experience, currently focusing on expanding my skillset with this course.'
    },
    { 
      id: 2, 
      name: 'Sarah Williams', 
      email: 'sarah@example.com', 
      progress: 35, 
      lastActive: '1d ago', 
      enrolledDate: 'June 2, 2023',
      completedSections: 2,
      totalSections: 8,
      completedLessons: 6,
      totalLessons: 24,
      status: 'active'
    },
    { 
      id: 3, 
      name: 'Miguel Rodriguez', 
      email: 'miguel@example.com', 
      progress: 0, 
      lastActive: '2w ago', 
      enrolledDate: 'June 10, 2023',
      completedSections: 0,
      totalSections: 8,
      completedLessons: 0,
      totalLessons: 24,
      status: 'inactive'
    },
    { 
      id: 4, 
      name: 'Emily Chen', 
      email: 'emily@example.com', 
      progress: 100, 
      lastActive: '3d ago',
      enrolledDate: 'April 15, 2023',
      completedSections: 8,
      totalSections: 8,
      completedLessons: 24,
      totalLessons: 24,
      status: 'completed'
    },
    { 
      id: 5, 
      name: 'David Kim', 
      email: 'david@example.com', 
      progress: 42, 
      lastActive: '4h ago',
      enrolledDate: 'May 20, 2023',
      completedSections: 3,
      totalSections: 8,
      completedLessons: 10,
      totalLessons: 24,
      status: 'active'
    }
  ];
  
  // Get mock data based on the current status filter
  const displayedStudents = searchText
    ? allStudents.filter(
        student => student.status === currentStatus && 
          (student.name.toLowerCase().includes(searchText.toLowerCase()) || 
           student.email.toLowerCase().includes(searchText.toLowerCase()))
      )
    : allStudents.filter(student => student.status === currentStatus);
    
  // Count students by status for the UI
  const studentCounts = {
    active: allStudents.filter(student => student.status === 'active').length,
    inactive: allStudents.filter(student => student.status === 'inactive').length,
    completed: allStudents.filter(student => student.status === 'completed').length
  };
  
  // Handle viewing student profile
  const handleViewProfile = (student: StudentData) => {
    setSelectedStudent(student);
    setProfileDialogOpen(true);
  };
  
  // Handle messaging student
  const handleMessageStudent = (student: StudentData) => {
    setSelectedStudent(student);
    setMessageDialogOpen(true);
  };
  
  // Helper function for sending messages to students
  const handleSendMessage = () => {
    if (selectedStudent && messageText.trim()) {
      toast.success(`Message sent to ${selectedStudent.name}`);
      setMessageText('');
      setMessageDialogOpen(false);
    }
  };
  
  // Handle removing a student from the course
  const handleRemoveStudent = (studentId: number) => {
    // In a real app, this would remove the student from the course
    toast.success('Student removed successfully');
  };
  
  // Handle changing student status
  const handleChangeStatus = (studentId: number, newStatus: string) => {
    // In a real app, this would update the student's status
    toast.success('Student status updated successfully');
  };
  
  // Handle enrolling a student
  const handleEnrollStudent = async () => {
    if (!emailToEnroll.trim()) {
      setEnrollmentError("Please enter the student's email");
      return;
    }
    
    try {
      // In a real app, this would send an API request to enroll the student
      console.log(`Enrolling student with email: ${emailToEnroll} to course ${courseId}`);
      
      // Find if the student is already in our mock data with inactive status
      const studentToEnroll = allStudents.find(
        student => student.email.toLowerCase() === emailToEnroll.toLowerCase() && student.status === 'inactive'
      );
      
      if (studentToEnroll) {
        // Update the student status to 'active'
        studentToEnroll.status = 'active';
        
        // Show success message using react-hot-toast
        toast.success(`${studentToEnroll.name} has been successfully enrolled in the course.`);
      } else {
        toast.success(`Enrollment invitation sent to ${emailToEnroll}`);
      }
      
      // Close dialog and reset form
      setEmailToEnroll('');
      setEnrollmentError('');
      setEnrollDialogOpen(false);
      
    } catch (error) {
      setEnrollmentError('Failed to enroll student. Please try again.');
      console.error('Error enrolling student:', error);
    }
  };
  
  return (
    <PageLayout 
      title="Students"
      backHref={`/dashboard/instructor/courses/${courseId}`}
    >
      <div className="p-6 bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Course Students</h1>
          <Button onClick={() => setEnrollDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll Student
          </Button>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {['active', 'inactive', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentStatus === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({studentCounts[status as keyof typeof studentCounts]})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name or email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.progress}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${student.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.lastActive}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.enrolledDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProfile(student)}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessageStudent(student)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Profile Dialog */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Student Profile</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{selectedStudent.name}</h3>
                    <p className="text-gray-500">{selectedStudent.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Progress</p>
                    <p className="text-lg">{selectedStudent.progress}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-lg capitalize">{selectedStudent.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Enrolled Date</p>
                    <p className="text-lg">{selectedStudent.enrolledDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Active</p>
                    <p className="text-lg">{selectedStudent.lastActive}</p>
                  </div>
                </div>
                {selectedStudent.bio && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bio</p>
                    <p className="text-sm text-gray-700">{selectedStudent.bio}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedStudent?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="messageSubject" className="text-sm font-medium">
                  Subject
                </label>
                <Input 
                  id="messageSubject" 
                  placeholder="Course progress update" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="messageContent" className="text-sm font-medium">
                  Message
                </label>
                <Textarea 
                  id="messageContent" 
                  placeholder="Write your message here..." 
                  className="min-h-[120px]" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enroll Student Dialog */}
        <Dialog open={enrollDialogOpen} onOpenChange={(open) => {
          setEnrollDialogOpen(open);
          if (!open) {
            setEmailToEnroll('');
            setEnrollmentError('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll Student</DialogTitle>
              <DialogDescription>
                Enter the email address of the student you want to enroll in this course.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="studentEmail" className="text-sm font-medium">
                  Student Email
                </label>
                <Input 
                  id="studentEmail" 
                  type="email"
                  placeholder="student@example.com" 
                  value={emailToEnroll}
                  onChange={(e) => {
                    setEmailToEnroll(e.target.value);
                    setEnrollmentError('');
                  }}
                />
                {enrollmentError && (
                  <p className="text-sm text-red-500">{enrollmentError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEnrollStudent}>
                Enroll Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
