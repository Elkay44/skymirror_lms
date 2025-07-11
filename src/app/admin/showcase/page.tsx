"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award, Search, Filter, Plus, ChevronDown, ChevronUp, Star, Eye, Clock, Tag, Trash2, User } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ShowcaseProjectCard from '@/components/showcase/ShowcaseProjectCard';
import ShowcaseProjectModal from '@/components/showcase/ShowcaseProjectModal';

interface ShowcaseProject {
  id: string;
  title: string;
  description: string;
  studentId: string;
  studentName: string;
  studentImage?: string;
  courseId: string;
  courseTitle: string;
  submissionId: string;
  repositoryUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  featured: boolean;
  category: string;
  tags: string[];
  showcasedAt: string;
  viewCount: number;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function ShowcaseAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null);
  
  // Fetch showcase projects and categories when component mounts
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'Admin') {
      router.push('/login');
      return;
    }
    
    fetchShowcaseData();
  }, [session, status, router]);
  
  const fetchShowcaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch showcase projects
      const projectsResponse = await fetch('/api/admin/showcase');
      
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch showcase projects');
      }
      
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects || []);
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/admin/showcase/categories');
      
      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData.categories || []);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching showcase data');
      console.error('Error fetching showcase data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddToShowcase = () => {
    setSelectedProject(null);
    setModalOpen(true);
  };
  
  const handleEditProject = (project: ShowcaseProject) => {
    setSelectedProject(project);
    setModalOpen(true);
  };
  
  const handleRemoveFromShowcase = async (projectId: string) => {
    if (!confirm('Are you sure you want to remove this project from the showcase? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/showcase/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove project from showcase');
      }
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err: any) {
      setError(err.message || 'An error occurred while removing the project');
      console.error('Error removing project:', err);
    }
  };
  
  const handleToggleFeatured = async (projectId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/showcase/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured: !featured }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, featured: !featured } : p
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
      console.error('Error updating project:', err);
    }
  };
  
  const handleModalSave = async (project: any) => {
    try {
      setModalOpen(false);
      await fetchShowcaseData(); // Refresh data after save
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving');
      console.error('Error saving project:', err);
    }
  };
  
  const toggleSort = (sortType: 'date' | 'views' | 'title') => {
    if (sortBy === sortType) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortType);
      setSortOrder(sortType === 'title' ? 'asc' : 'desc');
    }
  };
  
  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      // Search term filter
      const matchesSearch = 
        searchTerm === '' ||
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter
      const matchesCategory = 
        selectedCategory === 'all' ||
        project.category === selectedCategory;
      
      // Featured filter
      const matchesFeatured = 
        !showFeaturedOnly ||
        project.featured;
      
      return matchesSearch && matchesCategory && matchesFeatured;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.showcasedAt).getTime() - new Date(b.showcasedAt).getTime()
          : new Date(b.showcasedAt).getTime() - new Date(a.showcasedAt).getTime();
      } else if (sortBy === 'views') {
        return sortOrder === 'asc'
          ? a.viewCount - b.viewCount
          : b.viewCount - a.viewCount;
      } else {
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
    });
  
  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!session || session.user.role !== 'Admin') {
    return null; // Router will redirect
  }
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Project Showcase Management</h1>
            <p className="text-gray-600">
              Curate and promote outstanding student projects to showcase on the platform
            </p>
          </div>
          
          <button
            onClick={handleAddToShowcase}
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Showcase
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects, students, or tags..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </button>
            </div>
          </div>
          
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 rounded-lg p-4 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleSort('date')}
                      className={`px-3 py-1 rounded-md text-sm flex items-center ${sortBy === 'date' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Date
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )
                      )}
                    </button>
                    
                    <button
                      onClick={() => toggleSort('views')}
                      className={`px-3 py-1 rounded-md text-sm flex items-center ${sortBy === 'views' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Views
                      {sortBy === 'views' && (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )
                      )}
                    </button>
                    
                    <button
                      onClick={() => toggleSort('title')}
                      className={`px-3 py-1 rounded-md text-sm flex items-center ${sortBy === 'title' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Title
                      {sortBy === 'title' && (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Show Featured Only
                  </label>
                  <div className="flex items-center mt-1">
                    <button
                      onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${showFeaturedOnly ? 'bg-blue-600' : 'bg-gray-200'}`}
                      role="switch"
                      aria-checked={showFeaturedOnly}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${showFeaturedOnly ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                    <span className="ml-2 text-sm text-gray-600">
                      {showFeaturedOnly ? 'Showing featured projects only' : 'Showing all projects'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {loading ? (
            <div className="py-12">
              <div className="flex justify-center items-center">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <ShowcaseProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => handleEditProject(project)}
                  onRemove={() => handleRemoveFromShowcase(project.id)}
                  onToggleFeatured={() => handleToggleFeatured(project.id, project.featured)}
                  isAdmin
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No showcase projects found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' || showFeaturedOnly
                  ? 'No projects match your current filters. Try adjusting your search criteria.'
                  : 'Add outstanding student projects to the showcase to inspire others and highlight achievements.'}
              </p>
              <button
                onClick={handleAddToShowcase}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project to Showcase
              </button>
            </div>
          )}
        </div>
        
        {/* Statistics and Management Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              Featured Projects
            </h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {projects.filter(p => p.featured).length}
            </p>
            <p className="text-gray-600">
              Projects highlighted on the homepage
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 text-blue-500 mr-2" />
              Total Views
            </h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {projects.reduce((sum, project) => sum + project.viewCount, 0).toLocaleString()}
            </p>
            <p className="text-gray-600">
              Combined views across all showcased projects
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 text-green-500 mr-2" />
              Showcased Students
            </h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {new Set(projects.map(p => p.studentId)).size}
            </p>
            <p className="text-gray-600">
              Unique students with projects in showcase
            </p>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Project Modal */}
      {modalOpen && (
        <ShowcaseProjectModal
          project={selectedProject}
          onClose={() => setModalOpen(false)}
          onSave={handleModalSave}
        />
      )}
    </AdminLayout>
  );
}
