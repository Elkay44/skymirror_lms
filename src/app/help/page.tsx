"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  HelpCircle, 
  Book, 
  MessageSquare, 
  Video, 
  Mail, 
  Search,
  ChevronRight,
  Plus,
  Minus,
  CheckCircle
} from 'lucide-react';

export default function HelpCenter() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  
  const userRole = session?.user?.role || 'STUDENT';
  
  // Role-specific styling
  const roleColor = userRole === 'STUDENT' ? 'blue' : 
                   userRole === 'INSTRUCTOR' ? 'purple' : 'teal';
                   
  const faqs = [
    {
      id: 'account',
      question: 'How do I update my account information?',
      answer: 'You can update your account information by navigating to Settings from the dashboard. From there, select "Account" to update personal information such as name, email, and profile image.'
    },
    {
      id: 'password',
      question: 'How do I reset my password?',
      answer: 'To reset your password, go to the login page and click on "Forgot Password". Follow the instructions sent to your email to create a new password. If you are already logged in, you can change your password from the Security settings page.'
    },
    {
      id: 'billing',
      question: 'How do I update my payment information?',
      answer: 'To update your payment information, go to Settings and select "Billing". From there, you can add, remove, or update payment methods, and view your subscription details.'
    },
    {
      id: 'courses',
      question: 'How do I enroll in a course?',
      answer: 'Browse available courses from the Courses section. When you find a course you want to take, click on "Enroll Now" or "Buy Course". Follow the checkout process to complete enrollment.'
    },
    {
      id: 'certificates',
      question: 'How do I access my certificates?',
      answer: 'Once you complete a course, your certificate will be automatically generated. You can access all your certificates from the Certificates section in your dashboard.'
    },
    {
      id: 'mentors',
      question: 'How do I book a session with a mentor?',
      answer: 'Go to the Mentors section, browse available mentors, and select one that matches your needs. From their profile, you can view their availability and book a session based on their schedule.'
    }
  ];
  
  const toggleFaq = (id: string) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
    }
  };
  
  const filteredFaqs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Hero section */}
      <div className={`bg-gradient-to-r from-${roleColor}-600 to-${roleColor}-800 py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            <HelpCircle className="inline-block mr-2 h-8 w-8" />
            Help Center
          </h1>
          <p className="mt-3 max-w-md mx-auto text-lg text-white opacity-90 sm:text-xl md:mt-5 md:max-w-3xl">
            Find answers, resources, and support for your learning journey
          </p>
          
          {/* Search */}
          <div className="mt-10 max-w-xl mx-auto">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-4 border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded-md"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Help Categories */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Help Categories</h2>
            <nav className="space-y-2">
              <Link href="/help#getting-started" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg bg-white shadow-sm hover:bg-gray-50 transition">
                <Book className="mr-3 h-5 w-5 text-blue-500" />
                <span>Getting Started</span>
              </Link>
              <Link href="/help#courses" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg bg-white shadow-sm hover:bg-gray-50 transition">
                <Video className="mr-3 h-5 w-5 text-purple-500" />
                <span>Courses & Learning</span>
              </Link>
              <Link href="/help#forum" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg bg-white shadow-sm hover:bg-gray-50 transition">
                <MessageSquare className="mr-3 h-5 w-5 text-teal-500" />
                <span>Forums & Community</span>
              </Link>
              <Link href="/help#contact" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg bg-white shadow-sm hover:bg-gray-50 transition">
                <Mail className="mr-3 h-5 w-5 text-red-500" />
                <span>Contact Support</span>
              </Link>
            </nav>
            
            {/* Role-specific guides */}
            <h2 className="text-lg font-medium text-gray-900 mt-8 mb-4">For {userRole.toLowerCase()}s</h2>
            <div className={`bg-${roleColor}-50 border border-${roleColor}-100 rounded-lg p-4`}>
              <h3 className={`text-${roleColor}-800 font-medium mb-2`}>{userRole} Guides</h3>
              <ul className="space-y-2">
                {userRole === 'STUDENT' && (
                  <>
                    <li>
                      <Link href="/help/student/enrollment" className="flex items-center text-sm text-gray-700 hover:text-blue-600">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Course Enrollment Guide
                      </Link>
                    </li>
                    <li>
                      <Link href="/help/student/certificates" className="flex items-center text-sm text-gray-700 hover:text-blue-600">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Getting Certificates
                      </Link>
                    </li>
                  </>
                )}
                
                {userRole === 'INSTRUCTOR' && (
                  <>
                    <li>
                      <Link href="/help/instructor/create-course" className="flex items-center text-sm text-gray-700 hover:text-purple-600">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Creating Effective Courses
                      </Link>
                    </li>
                    <li>
                      <Link href="/help/instructor/analytics" className="flex items-center text-sm text-gray-700 hover:text-purple-600">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Understanding Analytics
                      </Link>
                    </li>
                  </>
                )}
                
                {userRole === 'MENTOR' && (
                  <>
                    <li>
                      <Link href="/help/mentor/sessions" className="flex items-center text-sm text-gray-700 hover:text-teal-600">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Managing Mentoring Sessions
                      </Link>
                    </li>
                    <li>
                      <Link href="/help/mentor/resources" className="flex items-center text-sm text-gray-700 hover:text-teal-600">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Creating Resource Materials
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          {/* FAQs Section */}
          <div className="md:col-span-2">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-medium text-gray-900">Frequently Asked Questions</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => (
                    <div key={faq.id} className="px-6 py-4">
                      <button
                        className="flex justify-between items-center w-full text-left focus:outline-none"
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                        {expandedFaq === faq.id ? (
                          <Minus className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Plus className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedFaq === faq.id && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center">
                    <p className="text-gray-500">No results found for "{searchQuery}"</p>
                    <p className="mt-2 text-sm text-gray-500">Try a different search term or browse the categories</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Contact Support Section */}
            <div id="contact" className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-medium text-gray-900">Still Need Help?</h2>
              </div>
              
              <div className="px-6 py-5">
                <p className="text-gray-600 mb-6">
                  If you couldn't find what you're looking for, our support team is here to help.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Email Support</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Send us an email and we'll get back to you within 24 hours.
                    </p>
                    <a 
                      href="mailto:support@skymirror.academy" 
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-${roleColor}-600 hover:bg-${roleColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${roleColor}-500`}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email Support
                    </a>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Live Chat</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Chat with our support team in real-time during business hours.
                    </p>
                    <button 
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-${roleColor}-600 hover:bg-${roleColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${roleColor}-500`}
                      onClick={() => console.log('Open chat')}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Getting Started Section */}
            <div id="getting-started" className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-medium text-gray-900">Getting Started Guide</h2>
              </div>
              
              <div className="px-6 py-5">
                <ol className="space-y-6">
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-${roleColor}-100 text-${roleColor}-600`}>
                        1
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900">Complete your profile</h3>
                      <p className="mt-1 text-sm text-gray-600">Fill out your profile information to personalize your experience and help others connect with you.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-${roleColor}-100 text-${roleColor}-600`}>
                        2
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900">Explore available courses</h3>
                      <p className="mt-1 text-sm text-gray-600">Browse through our course catalog to find subjects that interest you and match your learning goals.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-${roleColor}-100 text-${roleColor}-600`}>
                        3
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900">Enroll in your first course</h3>
                      <p className="mt-1 text-sm text-gray-600">Select a course and complete the enrollment process to start your learning journey.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-${roleColor}-100 text-${roleColor}-600`}>
                        4
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900">Track your progress</h3>
                      <p className="mt-1 text-sm text-gray-600">Use your dashboard to monitor your learning progress and set goals for completion.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-${roleColor}-100 text-${roleColor}-600`}>
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900">Get your certificate</h3>
                      <p className="mt-1 text-sm text-gray-600">Complete all course requirements to earn your certificate and showcase your achievement.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
