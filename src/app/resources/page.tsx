"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Video,
  FileText,
  Link,
  Download,
  Star,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'template';
  url: string;
  thumbnailUrl?: string;
  fileSize?: string;
  format?: string;
  duration?: string;
  author?: string;
  dateAdded: string;
  tags: string[];
  courseId?: string;
  courseName?: string;
  isBookmarked?: boolean;
  downloadCount?: number;
}

const resourceTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'document', label: 'Documents' },
  { value: 'video', label: 'Videos' },
  { value: 'link', label: 'Links' },
  { value: 'template', label: 'Templates' }
];

export default function ResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Sample data for development
  const sampleResources: Resource[] = [
    {
      id: 'res1',
      title: 'UX Design Principles Handbook',
      description: 'A comprehensive guide to user experience design principles and best practices.',
      type: 'document',
      url: '/resources/ux-design-principles.pdf',
      thumbnailUrl: '/images/resources/ux-handbook-thumb.jpg',
      fileSize: '8.2 MB',
      format: 'PDF',
      author: 'Sarah Johnson',
      dateAdded: '2025-01-15',
      tags: ['UX Design', 'Design Thinking', 'Usability'],
      courseName: 'UX Design Fundamentals',
      isBookmarked: true,
      downloadCount: 342
    },
    {
      id: 'res2',
      title: 'Advanced React Hooks Tutorial',
      description: 'Learn how to use React Hooks effectively in your projects with practical examples.',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=example',
      thumbnailUrl: '/images/resources/react-hooks-thumb.jpg',
      duration: '45:32',
      author: 'Michael Lee',
      dateAdded: '2024-11-20',
      tags: ['React', 'JavaScript', 'Web Development', 'Hooks'],
      courseName: 'React Development Masterclass',
      isBookmarked: false,
      downloadCount: 512
    },
    {
      id: 'res3',
      title: 'Product Design Portfolio Template',
      description: 'A customizable template for creating a professional product design portfolio.',
      type: 'template',
      url: '/resources/portfolio-template.fig',
      thumbnailUrl: '/images/resources/portfolio-template-thumb.jpg',
      fileSize: '24.5 MB',
      format: 'Figma',
      author: 'Design Team',
      dateAdded: '2024-12-05',
      tags: ['Portfolio', 'Design', 'Template', 'Career'],
      isBookmarked: true,
      downloadCount: 128
    },
    {
      id: 'res4',
      title: 'Machine Learning Resources Collection',
      description: 'A curated list of the best machine learning libraries, tools, and research papers.',
      type: 'link',
      url: 'https://github.com/example/ml-resources',
      dateAdded: '2025-02-10',
      tags: ['Machine Learning', 'Data Science', 'AI', 'Research'],
      courseName: 'Introduction to Machine Learning',
      isBookmarked: false,
      downloadCount: 201
    },
    {
      id: 'res5',
      title: 'Data Visualization Best Practices',
      description: 'Learn how to create effective and beautiful data visualizations for your projects.',
      type: 'document',
      url: '/resources/data-viz-guide.pdf',
      thumbnailUrl: '/images/resources/data-viz-thumb.jpg',
      fileSize: '5.7 MB',
      format: 'PDF',
      author: 'Elena Rodriguez',
      dateAdded: '2025-01-28',
      tags: ['Data Visualization', 'Data Science', 'Design'],
      courseName: 'Data Science Fundamentals',
      isBookmarked: false,
      downloadCount: 178
    },
    {
      id: 'res6',
      title: 'User Interview Framework',
      description: 'A structured framework for conducting effective user interviews in UX research.',
      type: 'template',
      url: '/resources/user-interview-framework.docx',
      fileSize: '1.2 MB',
      format: 'DOCX',
      author: 'Research Team',
      dateAdded: '2024-11-12',
      tags: ['UX Research', 'User Interviews', 'Research Methods'],
      courseName: 'UX Design Fundamentals',
      isBookmarked: true,
      downloadCount: 92
    }
  ];
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Fetch resources
    const fetchResources = async () => {
      try {
        // In a real app, fetch from API
        // const response = await fetch('/api/resources');
        // const data = await response.json();
        // setResources(data);
        
        // Using sample data for development
        setTimeout(() => {
          setResources(sampleResources);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchResources();
    }
  }, [status, router]);
  
  // Get all unique tags from resources
  const allTags = Array.from(new Set(
    resources.flatMap(resource => resource.tags)
  )).sort();
  
  // Filter resources based on search, type, and tags
  const filteredResources = resources
    .filter(resource => {
      if (selectedType !== 'all' && resource.type !== selectedType) return false;
      
      if (selectedTags.length > 0 && !selectedTags.some(tag => resource.tags.includes(tag))) return false;
      
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        (resource.author && resource.author.toLowerCase().includes(query)) ||
        (resource.courseName && resource.courseName.toLowerCase().includes(query)) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  
  // Toggle bookmark for a resource
  const toggleBookmark = (id: string) => {
    setResources(resources.map(resource => {
      if (resource.id === id) {
        return { ...resource, isBookmarked: !resource.isBookmarked };
      }
      return resource;
    }));
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedType('all');
    setSelectedTags([]);
    setSearchQuery('');
  };
  
  // Get icon for resource type
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-6 w-6" />;
      case 'video':
        return <Video className="h-6 w-6" />;
      case 'link':
        return <Link className="h-6 w-6" />;
      case 'template':
        return <BookOpen className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
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
                <BookOpen className="inline-block mr-2 h-8 w-8" />
                Learning Resources
              </h1>
              <p className="mt-2 text-blue-100">
                Access additional materials to enhance your learning experience
              </p>
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
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:space-x-8">
          {/* Filters for larger screens */}
          <div className="hidden md:block md:w-64 flex-shrink-0">
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              
              {/* Resource type filter */}
              <div className="mb-6">
                <h4 className="font-medium text-sm text-gray-500 mb-2">Resource Type</h4>
                <div className="space-y-2">
                  {resourceTypes.map((type) => (
                    <div key={type.value} className="flex items-center">
                      <input
                        id={`type-${type.value}`}
                        name="resource-type"
                        type="radio"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedType === type.value}
                        onChange={() => setSelectedType(type.value)}
                      />
                      <label htmlFor={`type-${type.value}`} className="ml-3 text-sm text-gray-700">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tags filter */}
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-2">Tags</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allTags.map((tag) => (
                    <div key={tag} className="flex items-center">
                      <input
                        id={`tag-${tag}`}
                        name={`tag-${tag}`}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                      />
                      <label htmlFor={`tag-${tag}`} className="ml-3 text-sm text-gray-700">
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Reset filters button */}
              {(selectedType !== 'all' || selectedTags.length > 0) && (
                <button
                  className="mt-6 w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={resetFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile filters toggle */}
          <div className="md:hidden mb-4">
            <button
              className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {(selectedType !== 'all' || selectedTags.length > 0) && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5">
                    {(selectedType !== 'all' ? 1 : 0) + selectedTags.length}
                  </span>
                )}
              </span>
              {showFilters ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            
            {/* Mobile filters panel */}
            {showFilters && (
              <div className="mt-2 bg-white p-4 rounded-lg shadow-sm">
                {/* Resource type filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Resource Type</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {resourceTypes.map((type) => (
                      <div key={type.value} className="flex items-center">
                        <input
                          id={`mobile-type-${type.value}`}
                          name="mobile-resource-type"
                          type="radio"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedType === type.value}
                          onChange={() => setSelectedType(type.value)}
                        />
                        <label htmlFor={`mobile-type-${type.value}`} className="ml-3 text-sm text-gray-700">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Tags filter */}
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedTags.includes(tag) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        {selectedTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Reset filters button */}
                {(selectedType !== 'all' || selectedTags.length > 0) && (
                  <button
                    className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={resetFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Resources grid */}
          <div className="flex-1">
            {filteredResources.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((resource) => (
                  <div key={resource.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {resource.thumbnailUrl ? (
                      <div className="h-40 bg-gray-200 relative">
                        <div 
                          className="w-full h-full bg-cover bg-center" 
                          style={{ backgroundImage: `url(${resource.thumbnailUrl})` }}
                        ></div>
                        <div className="absolute top-2 right-2">
                          <button 
                            className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
                            onClick={() => toggleBookmark(resource.id)}
                          >
                            <Star className={`h-5 w-5 ${resource.isBookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-75 rounded px-2 py-1">
                          <span className="text-xs font-medium text-white flex items-center">
                            {getResourceTypeIcon(resource.type)}
                            <span className="ml-1 capitalize">{resource.type}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-r from-blue-100 to-blue-50 relative flex items-center justify-center">
                        <div className="text-blue-500">
                          {getResourceTypeIcon(resource.type)}
                        </div>
                        <div className="absolute top-2 right-2">
                          <button 
                            className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
                            onClick={() => toggleBookmark(resource.id)}
                          >
                            <Star className={`h-5 w-5 ${resource.isBookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-75 rounded px-2 py-1">
                          <span className="text-xs font-medium text-white flex items-center">
                            <span className="capitalize">{resource.type}</span>
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{resource.title}</h3>
                      
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{resource.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{resource.tags.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        {resource.author && (
                          <div>Author: <span className="text-gray-700">{resource.author}</span></div>
                        )}
                        {resource.courseName && (
                          <div>Course: <span className="text-gray-700">{resource.courseName}</span></div>
                        )}
                        <div>Added: <span className="text-gray-700">{formatDate(resource.dateAdded)}</span></div>
                        {resource.fileSize && (
                          <div>Size: <span className="text-gray-700">{resource.fileSize}</span></div>
                        )}
                        {resource.format && (
                          <div>Format: <span className="text-gray-700">{resource.format}</span></div>
                        )}
                        {resource.duration && (
                          <div>Duration: <span className="text-gray-700">{resource.duration}</span></div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {resource.type === 'link' ? (
                            <>
                              <Link className="mr-1.5 h-4 w-4" />
                              Open Link
                            </>
                          ) : (
                            <>
                              <Download className="mr-1.5 h-4 w-4" />
                              Download
                            </>
                          )}
                        </a>
                        
                        {resource.downloadCount !== undefined && (
                          <span className="text-xs text-gray-500">
                            {resource.downloadCount} downloads
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <FileText className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No resources found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || selectedType !== 'all' || selectedTags.length > 0 ? (
                    'Try adjusting your search or filter criteria'
                  ) : (
                    'Resources will appear here as they become available'
                  )}
                </p>
                {(searchQuery || selectedType !== 'all' || selectedTags.length > 0) && (
                  <div className="mt-6">
                    <button 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={resetFilters}
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
