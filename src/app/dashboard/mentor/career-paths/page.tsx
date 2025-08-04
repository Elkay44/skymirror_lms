"use client";

import { useState, useEffect } from 'react';

import Link from 'next/link';
import {
  Target,
  Search,
  ChevronRight,
  Clock,
  Users,
  Award,
  Briefcase,
  BookOpen,
  Plus,
  Filter,
  Edit
} from 'lucide-react';

interface CareerPath {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: string; // e.g., "6 months"
  enrolledMentees: number;
  skillsGained: string[];
  requiredCourses: {
    id: string;
    title: string;
    status: 'MANDATORY' | 'RECOMMENDED';
  }[];
  jobOpportunities: string[];
  certificates: string[];
}

export default function CareerPathsPage() {

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch career paths from API
  useEffect(() => {
    const fetchCareerPaths = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/mentor/career-paths');
        if (!response.ok) {
          throw new Error('Failed to fetch career paths');
        }
        const data = await response.json();
        
        // Transform API data to match component interface
        const transformedPaths = data.careerPaths?.map((path: any) => ({
          id: path.id,
          title: path.title,
          description: path.description,
          category: path.category,
          level: path.difficulty || 'BEGINNER',
          estimatedDuration: path.estimatedDuration || 'Not specified',
          enrolledMentees: path._count?.enrollments || 0,
          skillsGained: path.tags ? path.tags.split(',').filter(Boolean) : [],
          requiredCourses: [], // This would need to be added to the API if needed
          jobOpportunities: [], // This would need to be added to the API if needed
          certificates: [] // This would need to be added to the API if needed
        })) || [];
        
        setCareerPaths(transformedPaths);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCareerPaths();
  }, []);
  
  // Get unique categories
  const categories = Array.from(new Set(careerPaths.map(path => path.category)));
  
  // Filter career paths based on search query, category, and level
  const filteredPaths = careerPaths.filter(path => {
    const matchesSearch = searchQuery === '' || 
      path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.skillsGained.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'ALL' || path.category === selectedCategory;
    const matchesLevel = selectedLevel === 'ALL' || path.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });
  
  // Format category name for display
  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  // Get level badge color
  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-blue-100 text-blue-800';
      case 'ADVANCED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center break-words min-w-0">
            <Target className="mr-2 h-6 w-6 text-teal-600" />
            Career Paths
          </h1>
          <p className="mt-1 text-gray-600">
            Guide your mentees through structured learning paths toward specific career goals
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link
            href="/dashboard/mentor/career-paths/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Create Path
          </Link>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 min-w-0">
            <div className="flex-1 relative min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search career paths by title, description, or skills..."
                className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
              />
            </div>
            
            <div className="w-full md:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {formatCategory(category)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
                >
                  <option value="ALL">All Levels</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading career paths...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Career Paths Grid */}
      {!loading && !error && (
        <div className="space-y-6">
          {filteredPaths.length > 0 ? (
            filteredPaths.map((path) => (
            <div 
              key={path.id} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden"
            >
              <div className="p-4 lg:p-6">
                <div className="flex flex-col md:flex-row md:items-start min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 break-words min-w-0">
                        {formatCategory(path.category)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(path.level)}`}>
                        {path.level.charAt(0) + path.level.slice(1).toLowerCase()}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-medium text-gray-900 break-words">{path.title}</h2>
                    <p className="mt-1 text-sm text-gray-600 break-words">{path.description}</p>
                    
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="flex items-center min-w-0">
                        <Clock className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 break-words">{path.estimatedDuration}</span>
                      </div>
                      
                      <div className="flex items-center min-w-0">
                        <Users className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 break-words">{path.enrolledMentees} mentees enrolled</span>
                      </div>
                      
                      <div className="flex items-center min-w-0">
                        <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 break-words">{path.requiredCourses.length} courses</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 break-words">Skills Gained</h3>
                      <div className="mt-2 flex flex-wrap gap-2 min-w-0">
                        {path.skillsGained.map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 break-words min-w-0"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 md:mt-0 md:ml-6 flex flex-col space-y-3 md:w-48 min-w-0">
                    <Link
                      href={`/dashboard/mentor/career-paths/${path.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
                    >
                      View Details
                      <ChevronRight className="ml-1.5 h-4 w-4" />
                    </Link>
                    
                    <Link
                      href={`/dashboard/mentor/career-paths/${path.id}/assign`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
                    >
                      Assign to Mentee
                    </Link>
                    
                    <Link
                      href={`/dashboard/mentor/career-paths/${path.id}/edit`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
                    >
                      <Edit className="-ml-1 mr-2 h-4 w-4 text-gray-400" />
                      Edit Path
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Career Path Quick Stats */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
                <div className="flex flex-wrap gap-4 lg:gap-6 min-w-0">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 break-words">Job Opportunities</h4>
                    <div className="mt-1 flex items-center min-w-0">
                      <Briefcase className="h-4 w-4 text-gray-400 mr-1.5" />
                      <span className="text-sm font-medium text-gray-900 break-words">
                        {path.jobOpportunities.slice(0, 2).join(', ')}
                        {path.jobOpportunities.length > 2 && ' and more'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 break-words">Certifications</h4>
                    <div className="mt-1 flex items-center min-w-0">
                      <Award className="h-4 w-4 text-gray-400 mr-1.5" />
                      <span className="text-sm font-medium text-gray-900 break-words">
                        {path.certificates.slice(0, 2).join(', ')}
                        {path.certificates.length > 2 && ' and more'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 min-w-0">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900 break-words">No career paths found</h3>
            <p className="mt-1 text-sm text-gray-500 break-words">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
