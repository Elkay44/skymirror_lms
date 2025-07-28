"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, Upload, AlertTriangle, Loader2, Check } from 'lucide-react';

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
}

interface ShowcaseProjectModalProps {
  project: ShowcaseProject | null;
  onClose: () => void;
  onSave: (project: any) => void;
}

export default function ShowcaseProjectModal({
  project,
  onClose,
  onSave,
}: ShowcaseProjectModalProps) {
  const [projectData, setProjectData] = useState<any>({
    title: '',
    description: '',
    studentId: '',
    submissionId: '',
    featured: false,
    category: '',
    tags: [],
    imageUrl: '',
    demoUrl: '',
    repositoryUrl: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  // Initialize form with project data if editing
  useEffect(() => {
    if (project) {
      setProjectData({
        id: project.id,
        title: project.title,
        description: project.description,
        studentId: project.studentId,
        studentName: project.studentName,
        submissionId: project.submissionId,
        featured: project.featured,
        category: project.category,
        tags: project.tags,
        imageUrl: project.imageUrl || '',
        demoUrl: project.demoUrl || '',
        repositoryUrl: project.repositoryUrl || '',
      });
      
      if (project.imageUrl) {
        setPreviewUrl(project.imageUrl);
      }
      
      setTagsInput(project.tags.join(', '));
    }
    
    // Fetch categories
    fetchCategories();
  }, [project]);
  
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/showcase/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  
  const searchSubmissions = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/showcase/search-submissions?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Failed to search submissions');
      
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      setError(err.message || 'Error searching submissions');
    } finally {
      setLoading(false);
    }
  };
  
  const selectSubmission = (submission: any) => {
    setProjectData((prev: any) => ({
      ...prev,
      title: submission.project.title,
      description: submission.project.description,
      studentId: submission.studentId,
      studentName: submission.student.name,
      submissionId: submission.id,
      courseId: submission.project.courseId,
      courseTitle: submission.project.course.title,
      repositoryUrl: submission.repositoryUrl || '',
      demoUrl: submission.demoUrl || '',
      imageUrl: submission.project.imageUrl || '',
    }));
    
    if (submission.project.imageUrl) {
      setPreviewUrl(submission.project.imageUrl);
    }
    
    setSubmissions([]);
    setSearchTerm('');
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const uploadImage = async () => {
    if (!selectedFile) return null;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      setIsUploading(false);
      setUploadProgress(100);
      
      return data.url;
    } catch (err) {
      console.error('Error uploading image:', err);
      setIsUploading(false);
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Process tags from comma-separated string
      const processedTags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Upload image if selected
      let imageUrl = projectData.imageUrl;
      if (selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const projectToSave = {
        ...projectData,
        tags: processedTags,
        imageUrl,
      };
      
      // Send to the server
      const url = project ? `/api/admin/showcase/${project.id}` : '/api/admin/showcase';
      const method = project ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectToSave),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }
      
      const savedProject = await response.json();
      onSave(savedProject.project);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving');
      console.error('Error saving project:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? 'Edit Showcase Project' : 'Add Project to Showcase'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 flex-grow">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {!project && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select Project Submission</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Search for an approved student submission to add to the showcase
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by project title, student name, or course..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={searchSubmissions}
                    disabled={loading || searchTerm.length < 3}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {submissions.length > 0 && (
                  <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {submissions.map(submission => (
                        <div 
                          key={submission.id} 
                          onClick={() => selectSubmission(submission)}
                          className="p-3 border-b border-gray-200 last:border-0 hover:bg-blue-50 cursor-pointer"
                        >
                          <div className="flex justify-between">
                            <h4 className="font-medium text-gray-900">{submission.project.title}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(submission.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {submission.project.description.substring(0, 80)}...
                          </p>
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-600">
                              Student: {submission.student.name}
                            </span>
                            <span className="text-gray-500">
                              Course: {submission.project.course.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchTerm && submissions.length === 0 && !loading && (
                  <p className="text-sm text-gray-600 italic">
                    No matching submissions found. Try different search terms.
                  </p>
                )}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Project Title*
              </label>
              <input
                id="title"
                type="text"
                value={projectData.title}
                onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <select
                  id="category"
                  value={projectData.category}
                  onChange={(e) => setProjectData({ ...projectData, category: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="web, react, javascript, ui/ux, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="demoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Demo URL
                </label>
                <input
                  id="demoUrl"
                  type="url"
                  value={projectData.demoUrl}
                  onChange={(e) => setProjectData({ ...projectData, demoUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="repositoryUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Repository URL
                </label>
                <input
                  id="repositoryUrl"
                  type="url"
                  value={projectData.repositoryUrl}
                  onChange={(e) => setProjectData({ ...projectData, repositoryUrl: e.target.value })}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Project Image
                </label>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setProjectData({ ...projectData, imageUrl: '' });
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove image
                  </button>
                )}
              </div>
              
              {previewUrl ? (
                <div className="relative h-48 w-full rounded-md overflow-hidden mb-2">
                  <Image 
                    src={previewUrl}
                    alt="Project preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <div className="flex justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Drag and drop an image, or click to select
                  </p>
                </div>
              )}
              
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
              
              {!previewUrl && (
                <label
                  htmlFor="image"
                  className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Select Image
                </label>
              )}
              
              {isUploading && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-6 flex items-center">
              <input
                id="featured"
                type="checkbox"
                checked={projectData.featured}
                onChange={(e) => setProjectData({ ...projectData, featured: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                Feature this project on the homepage
              </label>
            </div>
          </form>
        </div>
        
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading || (!project && !projectData.submissionId)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {project ? 'Update Project' : 'Add to Showcase'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
