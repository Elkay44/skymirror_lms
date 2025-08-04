"use client";

import { useState } from 'react';

import {
  Database,
  FileText,
  Link as LinkIcon,
  BookOpen,
  Video,
  Download,
  Search,
  Plus,
  Filter,
  ExternalLink,
  Tag
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'DOCUMENT' | 'VIDEO' | 'LINK' | 'COURSE';
  url: string;
  tags: string[];
  dateAdded: string;
  downloads?: number;
  thumbnail?: string;
}

export default function ResourceLibraryPage() {

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  
  // Mock resources data
  const resources: Resource[] = [
    {
      id: 'resource_1',
      title: 'Effective Mentoring Guide',
      description: 'A comprehensive guide to effective mentoring techniques and best practices for career development.',
      type: 'DOCUMENT',
      url: '/resources/mentoring-guide.pdf',
      tags: ['mentoring', 'best-practices', 'career-development'],
      dateAdded: '2025-04-15T10:30:00Z',
      downloads: 127
    },
    {
      id: 'resource_2',
      title: 'Mastering One-on-One Meetings',
      description: 'Learn how to structure and conduct effective one-on-one meetings with your mentees.',
      type: 'VIDEO',
      url: 'https://www.youtube.com/watch?v=example1',
      tags: ['one-on-one', 'meetings', 'communication'],
      dateAdded: '2025-04-10T14:15:00Z',
      thumbnail: 'https://img.youtube.com/vi/example1/maxresdefault.jpg'
    },
    {
      id: 'resource_3',
      title: 'Student Progress Tracking Template',
      description: 'A spreadsheet template for tracking student progress across different courses and skills.',
      type: 'DOCUMENT',
      url: '/resources/progress-tracking.xlsx',
      tags: ['tracking', 'progress', 'templates'],
      dateAdded: '2025-04-22T09:45:00Z',
      downloads: 89
    },
    {
      id: 'resource_4',
      title: 'Career Path Planning Tools',
      description: 'Tools and resources for helping mentees plan their career paths in technology.',
      type: 'LINK',
      url: 'https://example.com/career-tools',
      tags: ['career', 'planning', 'tools'],
      dateAdded: '2025-04-18T11:20:00Z'
    },
    {
      id: 'resource_5',
      title: 'Advanced Mentoring Techniques Course',
      description: 'An online course covering advanced mentoring techniques for experienced mentors.',
      type: 'COURSE',
      url: '/courses/advanced-mentoring',
      tags: ['mentoring', 'advanced', 'techniques', 'course'],
      dateAdded: '2025-04-05T16:30:00Z'
    },
    {
      id: 'resource_6',
      title: 'Interview Preparation Guide',
      description: 'Help your mentees prepare for job interviews with this comprehensive guide.',
      type: 'DOCUMENT',
      url: '/resources/interview-prep.pdf',
      tags: ['interview', 'preparation', 'career'],
      dateAdded: '2025-04-25T13:10:00Z',
      downloads: 56
    }
  ];
  
  // Filter resources based on search query and selected type
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'ALL' || resource.type === selectedType;
    
    return matchesSearch && matchesType;
  });
  
  // Get resource icon based on type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'VIDEO':
        return <Video className="h-6 w-6 text-red-500" />;
      case 'LINK':
        return <LinkIcon className="h-6 w-6 text-purple-500" />;
      case 'COURSE':
        return <BookOpen className="h-6 w-6 text-green-500" />;
      default:
        return <Database className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center break-words min-w-0">
            <Database className="mr-2 h-6 w-6 text-teal-600" />
            Resource Library
          </h1>
          <p className="mt-1 text-gray-600">
            Access mentoring resources, tools, and materials for your sessions
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 break-words min-w-0"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Resource
          </button>
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
                placeholder="Search resources by title, description, or tags..."
                className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
              />
            </div>
            
            <div className="w-full md:w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="pl-10 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md break-words"
                >
                  <option value="ALL">All Types</option>
                  <option value="DOCUMENT">Documents</option>
                  <option value="VIDEO">Videos</option>
                  <option value="LINK">Links</option>
                  <option value="COURSE">Courses</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <div 
              key={resource.id} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full min-w-0 overflow-hidden"
            >
              {/* Resource thumbnail for videos */}
              {resource.type === 'VIDEO' && resource.thumbnail && (
                <div className="h-40 w-full overflow-hidden">
                  <img 
                    src={resource.thumbnail} 
                    alt={resource.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col min-w-0">
                <div className="flex items-start min-w-0">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 min-w-0">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div>
                    <div className="flex items-center min-w-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        resource.type === 'DOCUMENT' ? 'bg-blue-100 text-blue-800' :
                        resource.type === 'VIDEO' ? 'bg-red-100 text-red-800' :
                        resource.type === 'LINK' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {resource.type}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{formatDate(resource.dateAdded)}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-medium text-gray-900 break-words">{resource.title}</h3>
                  </div>
                </div>
                
                <p className="mt-3 text-sm text-gray-600 break-words">{resource.description}</p>
                
                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 min-w-0">
                    {resource.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 break-words min-w-0"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center min-w-0">
                  {resource.downloads !== undefined && (
                    <span className="text-xs text-gray-500 flex items-center min-w-0">
                      <Download className="mr-1 h-3 w-3" />
                      {resource.downloads} downloads
                    </span>
                  )}
                  
                  <a
                    href={resource.url}
                    target={resource.type === 'LINK' ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                      resource.type === 'DOCUMENT' ? 'bg-blue-600 hover:bg-blue-700' :
                      resource.type === 'VIDEO' ? 'bg-red-600 hover:bg-red-700' :
                      resource.type === 'LINK' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
                  >
                    {resource.type === 'DOCUMENT' ? (
                      <>
                        <Download className="-ml-0.5 mr-1 h-4 w-4" />
                        Download
                      </>
                    ) : resource.type === 'VIDEO' || resource.type === 'LINK' ? (
                      <>
                        <ExternalLink className="-ml-0.5 mr-1 h-4 w-4" />
                        View
                      </>
                    ) : (
                      <>
                        <BookOpen className="-ml-0.5 mr-1 h-4 w-4" />
                        Open Course
                      </>
                    )}
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 min-w-0">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900 break-words">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500 break-words">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
