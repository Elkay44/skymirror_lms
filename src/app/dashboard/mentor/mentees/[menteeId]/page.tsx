"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

export default function MenteeDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const menteeId = params.menteeId as string;
  
  const [mentee, setMentee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  
  useEffect(() => {
    const fetchMenteeDetails = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/mentees/${menteeId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch mentee details');
        }
        
        const data = await response.json();
        // Handle potential missing fields with defaults
        const menteeData = data.mentee;

        if (menteeData) {
          // Ensure required fields are present or have defaults
          menteeData.enrolledCourses = menteeData.enrolledCourses || [];
          menteeData.upcomingAssignments = menteeData.upcomingAssignments || [];
          menteeData.mentorshipSessions = menteeData.mentorshipSessions || [];
          menteeData.skillAssessments = menteeData.skillAssessments || [];
          menteeData.mentorshipNotes = menteeData.mentorshipNotes || '';
          menteeData.learningPath = menteeData.learningPath || 'Undecided';
        }

        setMentee(menteeData);
      } catch (error) {
        console.error('Error fetching mentee details:', error);
        toast.error('Failed to load mentee information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenteeDetails();
  }, [session, menteeId]);
  
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
      <div className="mb-8">
        <Link 
          href="/dashboard/mentor/mentees" 
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-800 mb-4"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to All Mentees
        </Link>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 p-6">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="flex-shrink-0 mr-4">
                  {mentee.avatar ? (
                    <Image 
                      src={mentee.avatar} 
                      alt={mentee.name} 
                      width={80} 
                      height={80} 
                      className="h-20 w-20 rounded-full border-2 border-white"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-white bg-opacity-25 flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{mentee.name}</h1>
                  <p className="text-white text-opacity-90">{mentee.email}</p>
                  <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20">
                    {mentee.learningPath}
                  </div>
                </div>
              </div>
              
              <div className="md:ml-auto flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    // Logic to schedule a session would go here
                    toast.success('Session scheduling feature coming soon!');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-teal-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Session
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 py-3 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center px-1 py-2 text-sm font-medium border-b-2 ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    <Icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'courses' && (
              <CourseProgressSection courses={mentee.enrolledCourses} />
            )}
            
            {activeTab === 'assignments' && (
              <AssignmentsSection 
                assignments={mentee.enrolledCourses?.flatMap((course: {assignments?: any[]}) => course.assignments || []) || []} 
              />
            )}
            
            {activeTab === 'sessions' && (
              <MentorshipSessionsSection sessions={mentee.mentorshipSessions || []} />
            )}
            
            {activeTab === 'learningPath' && (
              <LearningPathSection learningPath={mentee.learningPath} skills={mentee.skillAssessments || []} />
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
