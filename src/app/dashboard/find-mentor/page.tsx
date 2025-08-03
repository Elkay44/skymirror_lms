"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRight, Filter } from 'lucide-react';
import MentorCard, { MentorProfile } from '@/components/mentorship/MentorCard';
import MentorFilters, { MentorFiltersState } from '@/components/mentorship/MentorFilters';

// Sample data for mentors (fully commented out for production)
const sampleMentors: MentorProfile[] = [
  {
    id: 'mentor1',
    name: 'Dr. Sarah Johnson',
    title: 'UX Research Expert & Design Educator',
    avatarUrl: '/images/mentors/sarah-johnson.jpg',
    rating: 4.9,
    reviewCount: 124,
    specialties: ['UX Design', 'User Research', 'Design Thinking'],
    availability: 'Mon, Wed, Fri afternoons',
    description: 'Over 10 years of experience in UX design and research. I help students develop user-centered design skills and build compelling portfolios that stand out to employers.',
    isAvailableNow: true
  },
  {
    id: 'mentor2',
    name: 'Michael Lee',
    title: 'Frontend Developer & React Specialist',
    avatarUrl: '/images/mentors/michael-lee.jpg',
    rating: 4.8,
    reviewCount: 98,
    specialties: ['React', 'JavaScript', 'Frontend Development'],
    availability: 'Weekday evenings & weekends',
    description: 'Frontend developer with expertise in React and modern JavaScript. I love helping students understand web development concepts and build real-world projects.',
    isAvailableNow: false
  },
  {
    id: 'mentor3',
    name: 'Elena Rodriguez',
    title: 'Data Scientist & ML Engineer',
    avatarUrl: '/images/mentors/elena-rodriguez.jpg',
    rating: 4.7,
    reviewCount: 87,
    specialties: ['Data Science', 'Machine Learning', 'Python'],
    availability: 'Tuesdays & Thursdays',
    description: 'Data scientist with a background in machine learning and AI. I specialize in helping students bridge the gap between theoretical concepts and practical applications in data science.',
    isAvailableNow: false
  },
  {
    id: 'mentor4',
    name: 'James Wilson',
    title: 'Full Stack Developer & DevOps Engineer',
    avatarUrl: '/images/mentors/james-wilson.jpg',
    rating: 4.6,
    reviewCount: 76,
    specialties: ['Full Stack Development', 'Node.js', 'DevOps'],
    availability: 'Flexible schedule',
    description: 'Full stack developer with experience in both frontend and backend technologies. I help students build complete applications and understand deployment processes.',
    isAvailableNow: true
  },
  {
    id: 'mentor5',
    name: 'Aisha Patel',
    title: 'Mobile App Developer & UI Designer',
    avatarUrl: '/images/mentors/aisha-patel.jpg',
    rating: 4.9,
    reviewCount: 112,
    specialties: ['Mobile Development', 'UI/UX Design', 'React Native'],
    availability: 'Weekday mornings & evenings',
    description: 'Mobile app developer specializing in React Native and UI design. I enjoy helping students create beautiful and functional mobile applications.',
    isAvailableNow: true
  },
  {
    id: 'mentor6',
    name: 'David Kim',
    title: 'Product Manager & Agile Coach',
    avatarUrl: '/images/mentors/david-kim.jpg',
    rating: 4.8,
    reviewCount: 91,
    specialties: ['Product Management', 'Agile', 'Leadership'],
    availability: 'Monday-Friday business hours',
    description: 'Product manager with experience leading agile teams. I help aspiring product managers understand product development processes and improve their leadership skills.',
    isAvailableNow: false
  }
];

// Get all unique specialties from mentors (computed from live data)
function getAllSpecialties(mentors: MentorProfile[]): string[] {
  return Array.from(new Set(
    mentors.flatMap(mentor => mentor.specialties)
  )).sort();
}

export default function FindMentorPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<MentorFiltersState>({
    searchQuery: '',
    specialties: [],
    minRating: 0,
    availability: []
  });
  
  // Fetch mentors data
  const fetchMentors = async () => {
    try {
      // In a real app, you would fetch this from your API
      // const response = await fetch('/api/mentors');
      // const data = await response.json();
      // setMentors(data);
      
      // For now, use the sample data
      setMentors(sampleMentors);
      setAllSpecialties(getAllSpecialties(sampleMentors));
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    setIsLoading(true);
    fetchMentors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchMentors();
    }
  }, [status, router]);
  
  // Filter mentors based on selected filters
  const applyFilters = (mentor: MentorProfile) => {
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const nameMatch = mentor.name.toLowerCase().includes(query);
      const titleMatch = mentor.title.toLowerCase().includes(query);
      const specialtiesMatch = mentor.specialties.some(specialty => 
        specialty.toLowerCase().includes(query)
      );
      
      if (!nameMatch && !titleMatch && !specialtiesMatch) {
        return false;
      }
    }
    
    // Specialty filter
    if (filters.specialties.length > 0) {
      const hasMatchingSpecialty = mentor.specialties.some(specialty => 
        filters.specialties.includes(specialty)
      );
      
      if (!hasMatchingSpecialty) {
        return false;
      }
    }
    
    // Rating filter
    if (mentor.rating < filters.minRating) {
      return false;
    }
    
    // Availability filter
    if (filters.availability.length > 0) {
      // This is a simplified example - in a real app, we would have a more sophisticated
      // way to check availability matches
      const hasMatchingAvailability = filters.availability.some(day => 
        mentor.availability.toLowerCase().includes(day.toLowerCase())
      );
      
      if (!hasMatchingAvailability) {
        return false;
      }
    }
    
    return true;
  };
  
  // Filter mentors based on the current filters
  const filteredMentors = mentors.filter(applyFilters);
  
  // Handle mentorship request
  const handleRequestMentorship = (_mentorId: string) => {
    // In a production app, we would send an API request to create a mentorship request
    // For now, show a toast notification
    alert('Mentorship request sent! The mentor will review your request shortly.');
    
    // In a real app, we would update UI state and show a success message
    // We would also send a notification to the mentor
    
    // Simulate API call
    // await fetch('/api/mentorship/request', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ mentorId })
    // });
  };
  
  const handleContactMentor = (mentorId: string) => {
    // Navigate to messages page with mentor ID as parameter
    router.push(`/dashboard/messages?mentor=${mentorId}`);
  };
  
  const handleViewProfile = (mentorId: string) => {
    router.push(`/dashboard/mentors/${mentorId}`);
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
                <Users className="inline-block mr-2 h-8 w-8" />
                Find a Mentor
              </h1>
              <p className="mt-2 text-blue-100">
                Connect with industry experts for personalized guidance and career development
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile filter toggle */}
        <div className="block lg:hidden mb-4">
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {showMobileFilters && (
            <div className="mt-4">
              <MentorFilters 
                filters={filters} 
                onFilterChange={setFilters} 
                availableSpecialties={allSpecialties} 
              />
            </div>
          )}
        </div>
        
        <div className="lg:grid lg:grid-cols-4 lg:gap-x-6">
          {/* Filters - desktop */}
          <div className="hidden lg:block">
            <MentorFilters 
              filters={filters} 
              onFilterChange={setFilters} 
              availableSpecialties={allSpecialties} 
            />
          </div>
          
          {/* Mentor results */}
          <div className="lg:col-span-3">
            {filteredMentors.length > 0 ? (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium">{filteredMentors.length}</span> mentors
                  </p>
                  <div className="flex space-x-3">
                    <select
                      className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      defaultValue="relevance"
                    >
                      <option value="relevance">Sort by: Relevance</option>
                      <option value="rating-desc">Highest Rated</option>
                      <option value="experience-desc">Most Experienced</option>
                      <option value="name-asc">Name (A-Z)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredMentors.map(mentor => (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      onRequestMentorship={handleRequestMentorship}
                      onContactMentor={handleContactMentor}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No mentors found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or search criteria
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setFilters({
                      searchQuery: '',
                      specialties: [],
                      minRating: 0,
                      availability: []
                    })}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* CTA section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-blue-700 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 sm:p-10 sm:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                  Want to become a mentor?
                </h3>
                <p className="mt-3 text-lg text-blue-100">
                  Share your expertise with students and build your professional network by becoming a SkyMirror Academy mentor.
                </p>
              </div>
              <div className="lg:col-span-1 flex justify-center lg:justify-end">
                <a
                  href="/dashboard/become-mentor"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-blue-700"
                >
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
