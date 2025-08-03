"use client";

import { useState, useEffect } from 'react';

import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronLeft, User, BookOpen, Calendar, 
  CheckSquare, Target, FileText, ArrowLeft
} from 'lucide-react';

// Component imports
import CourseProgressSection from '../../../../../components/mentor/CourseProgressSection';
import AssignmentsSection from '../../../../../components/mentor/AssignmentsSection';
import MentorshipSessionsSection from '../../../../../components/mentor/MentorshipSessionsSection';
import LearningPathSection from '../../../../../components/mentor/LearningPathSection';
import MentorNotesSection from '../../../../../components/mentor/MentorNotesSection';

// Mock data for mentee details
const mockMenteeData = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatar: '/images/mentees/alex.jpg',
  learningPath: 'Frontend Development',
  mentorshipNotes: 'Focusing on React and TypeScript. Needs help with state management.',
  enrolledCourses: [
    {
      id: 'course1',
      title: 'Advanced React',
      progress: 65,
      lastActivity: '2025-07-20',
      instructor: 'Sarah Chen',
      grade: 'A-',
      status: 'In Progress',
      modules: [
        { id: 'm1', title: 'React Hooks', completed: true },
        { id: 'm2', title: 'Context API', completed: true },
        { id: 'm3', title: 'Redux Toolkit', completed: false },
      ]
    },
    {
      id: 'course2',
      title: 'TypeScript Fundamentals',
      progress: 90,
      lastActivity: '2025-07-22',
      instructor: 'Mike Johnson',
      grade: 'A',
      status: 'Completed',
      modules: [
        { id: 'm4', title: 'Basic Types', completed: true },
        { id: 'm5', title: 'Interfaces', completed: true },
        { id: 'm6', title: 'Generics', completed: true },
      ]
    }
  ],
  upcomingAssignments: [
    {
      id: 'assign1',
      title: 'React Hooks Project',
      dueDate: '2025-08-10',
      courseId: 'course1',
      courseName: 'Advanced React',
      submitted: false,
      description: 'Build a small application using React Hooks and Context API',
      points: 100
    }
  ],
  mentorshipSessions: [
    {
      id: 'sess1',
      date: '2025-07-28T14:00:00',
      duration: 60,
      topic: 'State Management with Redux',
      notes: 'Review Redux concepts and help with implementation',
      status: 'scheduled'
    }
  ],
  skillAssessments: [
    { 
      id: 'skill-1',
      name: 'React',
      category: 'Frontend',
      proficiency: 80,
      lastAssessed: '2025-07-20',
      recommendation: 'Consider exploring advanced React patterns'
    },
    { 
      id: 'skill-2',
      name: 'TypeScript',
      category: 'Frontend',
      proficiency: 70,
      lastAssessed: '2025-07-15',
      recommendation: 'Practice with generics and utility types'
    },
    { 
      id: 'skill-3',
      name: 'Redux',
      category: 'State Management',
      proficiency: 60,
      lastAssessed: '2025-07-10',
      recommendation: 'Learn Redux Toolkit for better state management'
    },
    { 
      id: 'skill-4',
      name: 'Node.js',
      category: 'Backend',
      proficiency: 65,
      lastAssessed: '2025-06-28',
      recommendation: 'Practice building RESTful APIs'
    },
    { 
      id: 'skill-5',
      name: 'CSS/SCSS',
      category: 'Styling',
      proficiency: 85,
      lastAssessed: '2025-07-22',
      recommendation: 'Explore CSS Grid and Flexbox layouts'
    }
  ]
};

export default function MenteeDetailPage() {

  const router = useRouter();
  const params = useParams();
  const menteeId = params.menteeId as string;
  
  const [mentee, setMentee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  
  useEffect(() => {
    const loadMenteeData = async () => {
      try {
        // In a real app, you would fetch from your API here
        // For now, we'll use the mock data directly
        const data = { ...mockMenteeData, id: menteeId };
        setMentee(data);
      } catch (error) {
        console.error('Error loading mentee data:', error);
        toast.error('Using demo data. Some features may be limited.');
        // Fallback to mock data even if there's an error
        setMentee({ ...mockMenteeData, id: menteeId });
      } finally {
        setLoading(false);
      }
    };
    
    loadMenteeData();
  }, [menteeId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (!mentee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="flex flex-col items-center">
            <User className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Mentee Not Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              The mentee you are looking for does not exist or you don't have access to view their profile.
            </p>
            <Link
              href="/dashboard/mentor/mentees"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mentees
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'courses', label: 'Courses & Progress', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'sessions', label: 'Mentorship Sessions', icon: Calendar },
    { id: 'learningPath', label: 'Learning Path', icon: Target },
    { id: 'notes', label: 'Mentor Notes', icon: FileText },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-teal-600 hover:text-teal-800 mb-4"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Mentees
        </button>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden mr-6">
                {mentee.avatar ? (
                  <Image
                    src={mentee.avatar}
                    alt={mentee.name}
                    width={80}
                    height={80}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div className="h-full w-full bg-teal-100 flex items-center justify-center">
                    <User className="h-10 w-10 text-teal-600" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{mentee.name}</h1>
                <p className="text-gray-600">{mentee.email}</p>
                <div className="mt-2 flex items-center">
                  <BookOpen className="h-4 w-4 text-teal-600 mr-1" />
                  <span className="text-sm text-gray-600">
                    {mentee.learningPath || 'No learning path selected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-b-2 border-teal-500 text-teal-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'courses' && (
              <CourseProgressSection courses={mentee.enrolledCourses} />
            )}
            
            {activeTab === 'assignments' && (
              <AssignmentsSection assignments={mentee.upcomingAssignments} />
            )}
            
            {activeTab === 'sessions' && (
              <MentorshipSessionsSection sessions={mentee.mentorshipSessions} />
            )}
            
            {activeTab === 'learningPath' && (
              <LearningPathSection 
                learningPath={mentee.learningPath} 
                skills={mentee.skillAssessments} 
              />
            )}
            
            {activeTab === 'notes' && (
              <MentorNotesSection 
                menteeId={menteeId}
                initialNotes={mentee.mentorshipNotes || ''}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
