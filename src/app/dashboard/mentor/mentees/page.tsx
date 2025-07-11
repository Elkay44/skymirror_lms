"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  ChevronRight,
  Search,
  Filter,
  Target,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';

interface MenteeCourse {
  id: string;
  title: string;
  progress: number;
  lastActivity: string;
  instructor: string;
  grade: string;
  status: string;
}

interface MenteeAssignment {
  id: string;
  title: string;
  dueDate: string;
  courseId: string;
  courseName: string;
  submitted: boolean;
}

interface MenteeSession {
  id: string;
  date: string;
  duration: number;
  topic: string;
}

interface Mentee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledCourses: MenteeCourse[];
  upcomingAssignments: MenteeAssignment[];
  nextSession: MenteeSession;
  learningPath: string;
  mentorshipNotes: string;
}

export default function MenteesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pathFilter, setPathFilter] = useState('all');
  
  useEffect(() => {
    const fetchMentees = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/mentees');
        
        if (!response.ok) {
          throw new Error('Failed to fetch mentees');
        }
        
        const data = await response.json();
        setMentees(data.mentees);
      } catch (error) {
        console.error('Error fetching mentees:', error);
        toast.error('Failed to load mentees. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMentees();
  }, [session]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate days until assignment is due
  const daysUntilDue = (dueDate: string) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Filter mentees based on search term and path filter
  const filteredMentees = mentees.filter(mentee => {
    const matchesSearch = mentee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         mentee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPath = pathFilter === 'all' || mentee.learningPath.toLowerCase() === pathFilter.toLowerCase();
    
    return matchesSearch && matchesPath;
  });
  
  // Get unique learning paths for filter dropdown
  const learningPaths = ["all", ...new Set(mentees.map(mentee => mentee.learningPath.toLowerCase()))];
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-2 h-7 w-7 text-teal-600" />
            My Mentees
          </h1>
          <p className="mt-1 text-gray-600">
            Monitor and support your mentees' progress and learning journey
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search mentees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <div className="relative">
            <select
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Learning Paths</option>
              {learningPaths.filter(path => path !== 'all').map(path => (
                <option key={path} value={path}>
                  {path.charAt(0).toUpperCase() + path.slice(1)}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
      
      {filteredMentees.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <div className="flex flex-col items-center">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchTerm || pathFilter !== 'all' ? 'No mentees match your search' : 'No mentees assigned yet'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || pathFilter !== 'all' ? 
                'Try adjusting your search terms or filters' : 
                'You have not been assigned any mentees yet. Check back later or contact the administrator.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentees.map((mentee) => (
            <div key={mentee.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    <Image 
                      src={mentee.avatar} 
                      alt={mentee.name} 
                      width={64} 
                      height={64} 
                      className="h-16 w-16 rounded-full border-2 border-white"
                    />
                  </div>
                  <div className="text-white">
                    <h3 className="text-lg font-medium">{mentee.name}</h3>
                    <p className="text-sm text-white text-opacity-90">{mentee.email}</p>
                    <div className="mt-1 flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-white text-opacity-80" />
                      <span className="text-sm text-white text-opacity-80">{mentee.learningPath}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Course Progress</h4>
                {mentee.enrolledCourses.map((course) => (
                  <div key={course.id} className="mb-3 last:mb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]" title={course.title}>
                        {course.title}
                      </span>
                      <span className="text-xs font-medium text-gray-500">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${course.progress >= 80 ? 'bg-green-500' : course.progress >= 50 ? 'bg-teal-500' : 'bg-yellow-500'}`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                      <span>Grade: {course.grade}</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(course.lastActivity).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Next Session</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${new Date(mentee.nextSession.date) > new Date() ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'}`}>
                    {new Date(mentee.nextSession.date) > new Date() ? 'Upcoming' : 'Overdue'}
                  </span>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-teal-100 rounded-lg p-2 mr-3">
                    <CalendarIcon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{mentee.nextSession.topic}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(mentee.nextSession.date)} at {formatTime(mentee.nextSession.date)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Duration: {mentee.nextSession.duration} minutes
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Upcoming Assignments</h4>
                
                {mentee.upcomingAssignments.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {mentee.upcomingAssignments.map((assignment) => (
                      <li key={assignment.id} className="py-2 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{assignment.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{assignment.courseName}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${assignment.submitted ? 'bg-green-100 text-green-800' : daysUntilDue(assignment.dueDate) <= 2 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {assignment.submitted ? 'Submitted' : `Due in ${daysUntilDue(assignment.dueDate)} days`}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No upcoming assignments</p>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <Link 
                  href={`/dashboard/mentor/mentees/${mentee.id}`}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  View Full Profile
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
