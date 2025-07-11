"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Award, 
  Download, 
  Share2, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Clock,
  Search
} from 'lucide-react';

interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  issueDate: string;
  expiryDate?: string;
  instructorName: string;
  certificateUrl: string;
  thumbnailUrl: string;
  credentialId: string;
  skills: string[];
  status: 'active' | 'expired' | 'revoked';
}

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'expired'>('all');
  
  // Sample data for development
  const sampleCertificates: Certificate[] = [
    {
      id: 'cert1',
      courseId: 'course1',
      courseName: 'UX Design Fundamentals',
      issueDate: '2025-01-15',
      instructorName: 'Sarah Johnson',
      certificateUrl: '/certificates/ux-design-cert.pdf',
      thumbnailUrl: '/images/certificates/ux-design-thumb.jpg',
      credentialId: 'UXD-2025-1234567',
      skills: ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing'],
      status: 'active'
    },
    {
      id: 'cert2',
      courseId: 'course2',
      courseName: 'React Development Masterclass',
      issueDate: '2024-11-20',
      instructorName: 'Michael Lee',
      certificateUrl: '/certificates/react-dev-cert.pdf',
      thumbnailUrl: '/images/certificates/react-dev-thumb.jpg',
      credentialId: 'RJS-2024-7654321',
      skills: ['React.js', 'Redux', 'JavaScript', 'Frontend Development'],
      status: 'active'
    },
    {
      id: 'cert3',
      courseId: 'course3',
      courseName: 'Data Science Fundamentals',
      issueDate: '2024-08-05',
      expiryDate: '2025-08-05',
      instructorName: 'Elena Rodriguez',
      certificateUrl: '/certificates/data-science-cert.pdf',
      thumbnailUrl: '/images/certificates/data-science-thumb.jpg',
      credentialId: 'DSF-2024-3456789',
      skills: ['Python', 'Data Analysis', 'Machine Learning', 'Data Visualization'],
      status: 'expired'
    }
  ];
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Fetch certificates
    const fetchCertificates = async () => {
      try {
        // In a real app, fetch from API
        // const response = await fetch('/api/certificates');
        // const data = await response.json();
        // setCertificates(data);
        
        // Using sample data for development
        setTimeout(() => {
          setCertificates(sampleCertificates);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchCertificates();
    }
  }, [status, router]);
  
  // Filter and search certificates
  const filteredCertificates = certificates
    .filter(cert => {
      if (activeFilter === 'active') return cert.status === 'active';
      if (activeFilter === 'expired') return cert.status === 'expired' || cert.status === 'revoked';
      return true;
    })
    .filter(cert => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        cert.courseName.toLowerCase().includes(query) ||
        cert.instructorName.toLowerCase().includes(query) ||
        cert.skills.some(skill => skill.toLowerCase().includes(query))
      );
    });
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                <Award className="inline-block mr-2 h-8 w-8" />
                My Certificates
              </h1>
              <p className="mt-2 text-blue-100">
                View and share your course completion certificates
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-3">
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeFilter === 'all' ? 'bg-white text-blue-700' : 'bg-blue-700 text-white'}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All Certificates
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeFilter === 'active' ? 'bg-white text-blue-700' : 'bg-blue-700 text-white'}`}
                  onClick={() => setActiveFilter('active')}
                >
                  Active
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeFilter === 'expired' ? 'bg-white text-blue-700' : 'bg-blue-700 text-white'}`}
                  onClick={() => setActiveFilter('expired')}
                >
                  Expired
                </button>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-6">
            <div className="relative rounded-md shadow-sm max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-3 border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded-md"
                placeholder="Search by course, instructor, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
              <div key={certificate.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Certificate preview */}
                <div className="relative h-48 bg-gray-100">
                  {certificate.thumbnailUrl ? (
                    <Image 
                      src={certificate.thumbnailUrl} 
                      alt={certificate.courseName} 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Award className="h-20 w-20 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    {certificate.status === 'active' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </span>
                    ) : certificate.status === 'expired' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Clock className="mr-1 h-3 w-3" />
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Revoked
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Certificate details */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900">{certificate.courseName}</h3>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Issued on {formatDate(certificate.issueDate)}
                    </div>
                    {certificate.expiryDate && (
                      <div className="flex items-center mt-1">
                        <Clock className="mr-2 h-4 w-4" />
                        Expires on {formatDate(certificate.expiryDate)}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      Instructor: <span className="font-medium">{certificate.instructorName}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Credential ID: {certificate.credentialId}
                    </p>
                  </div>
                  
                  {/* Skills */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {certificate.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-5 flex space-x-3">
                    <a 
                      href={certificate.certificateUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="mr-1.5 h-4 w-4" />
                      Download
                    </a>
                    <button
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => navigator.clipboard.writeText(`https://skymirror.academy/verify/${certificate.credentialId}`)}
                    >
                      <Share2 className="mr-1.5 h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {searchQuery || activeFilter !== 'all' ? (
              <div>
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No certificates found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
                <div className="mt-6">
                  <button 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <Award className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No certificates yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Complete courses to earn your certificates
                </p>
                <div className="mt-6">
                  <a 
                    href="/courses" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Browse courses
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Certificate verification info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-800">Certificate Verification</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  All certificates issued by SkyMirror Academy include a unique credential ID and can be verified online. 
                  Share your certificate with potential employers or on professional networks with confidence.
                </p>
                <p className="mt-2">
                  Anyone can verify your certificate by visiting: 
                  <a href="https://skymirror.academy/verify" className="font-semibold underline ml-1">skymirror.academy/verify</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
