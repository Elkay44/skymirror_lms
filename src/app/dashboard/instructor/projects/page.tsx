"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  FileText, 
  PlusCircle, 
  Users,
  Award,
  ChevronRight,
  AlertCircle,
  Edit,
  Trash2,
  BarChart3,
  ListChecks,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';

// Import the AssessmentDashboard component
import AssessmentDashboard from '@/components/projects/AssessmentDashboard';

// Types for projects and course data
interface Course {
  id: string;
  title: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  skills?: string[];
  courseId: string;
  course?: {
    title: string;
  };
  isRequiredForCertification: boolean;
  _count?: {
    submissions: number;
  };
  createdAt: string;
}

interface ProjectFormData {
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  dueDate: string;
  pointsValue: number;
  skills: string[];
  isPublished: boolean;
  isRequiredForCertification: boolean;
}

export default function InstructorProjects() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'projects' | 'submissions'>('projects');
  
  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    instructions: '',
    courseId: '',
    dueDate: '',
    pointsValue: 10,
    skills: [],
    isPublished: false,
    isRequiredForCertification: true
  });
  const [skillInput, setSkillInput] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch instructor's courses
        const coursesResponse = await fetch('/api/instructor/courses');
        if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
        const coursesData = await coursesResponse.json();
        setCourses(coursesData.courses || []);
        
        // Fetch projects
        const projectsResponse = await fetch('/api/projects');
        if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
        const projectsData = await projectsResponse.json();
        
        // Parse skills JSON if needed
        const processedProjects = (projectsData.projects || []).map((project: any) => ({
          ...project,
          skills: project.skills && typeof project.skills === 'string' 
            ? JSON.parse(project.skills) 
            : project.skills
        }));
        
        setProjects(processedProjects);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session]);
  
  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.courseId) errors.courseId = 'Please select a course';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      
      const data = await response.json();
      
      // Add the new project to the list
      setProjects(prev => [{
        ...data.project,
        course: courses.find(c => c.id === data.project.courseId),
        _count: { submissions: 0 }
      }, ...prev]);
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        instructions: '',
        courseId: '',
        dueDate: '',
        pointsValue: 10,
        skills: [],
        isPublished: false,
        isRequiredForCertification: true
      });
      setIsCreatingProject(false);
      
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    }
  };
  
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      // Remove the project from the list
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project');
    }
  };
  
  const filterProjectsByCourse = () => {
    if (!selectedCourseId) return projects;
    return projects.filter(project => project.courseId === selectedCourseId);
  };
  
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Projects</h1>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Projects</h1>
        {activeTab === 'projects' ? (
          <button
            onClick={() => setIsCreatingProject(true)}
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create Project
          </button>
        ) : null}
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'projects' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ClipboardList className="h-5 w-5 mr-2" />
          My Projects
        </button>
        
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'submissions' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ListChecks className="h-5 w-5 mr-2" />
          Submissions
        </button>
      </div>
      
      {/* Projects List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'projects' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ClipboardList className="h-5 w-5 mr-2" />
          My Projects
        </button>
        
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'submissions' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ListChecks className="h-5 w-5 mr-2" />
          Submissions
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}
      
      {activeTab === 'projects' ? (
        <>
          {/* Course Filter */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Course Projects</h2>
            <p className="text-sm text-gray-600 mb-3">
              Each course has its own set of projects. Select a course to view and manage its projects.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                id="courseFilter"
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="border border-gray-300 rounded-md w-full sm:w-80 px-3 py-2 bg-gray-50"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              
              {selectedCourseId && (
                <Link
                  href={`/dashboard/instructor/courses/${selectedCourseId}`}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View Course Dashboard
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              )}
            </div>
          </div>
        
          {/* Projects List */}
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="animate-pulse inline-block h-8 w-8 rounded-full bg-blue-200"></div>
              <p className="mt-2 text-gray-600">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="mt-2 text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : filterProjectsByCourse().length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
              <p className="mt-1 text-gray-500">
                {selectedCourseId 
                  ? 'There are no projects for the selected course yet.' 
                  : 'You haven\'t created any projects yet.'}
              </p>
              <button
                onClick={() => setIsCreatingProject(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filterProjectsByCourse().map(project => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/instructor/projects/${project.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="Edit project"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Delete project"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-3">
                      <p className="flex items-center mb-1">
                        <FileText className="h-4 w-4 mr-1.5" />
                        Course: {project.course?.title || 'Unknown Course'}
                      </p>
                      {project.dueDate && (
                        <p className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          Due: {new Date(project.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      <p className="flex items-center mb-1">
                        <Users className="h-4 w-4 mr-1.5" />
                        Submissions: {project._count?.submissions || 0}
                      </p>
                      <p className="flex items-center">
                        <Award className="h-4 w-4 mr-1.5" />
                        {project.isRequiredForCertification 
                          ? 'Required for certification' 
                          : 'Optional project'}
                      </p>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>
                    
                    {project.skills && project.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {project.skills.map((skill, i) => (
                            <span 
                              key={i} 
                              className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <Link 
                        href={`/dashboard/instructor/projects/${project.id}/submissions`}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-medium"
                      >
                        View Submissions
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                      
                      <Link 
                        href={`/dashboard/instructor/projects/${project.id}/analytics`}
                        className="text-sm text-green-600 hover:text-green-800 flex items-center font-medium"
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-6">
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Submissions</h2>
              <p className="text-sm text-gray-600 mb-3">
                View and assess student submissions for all your projects. Filter by course to narrow down the results.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  id="submissionCourseFilter"
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  className="border border-gray-300 rounded-md w-full sm:w-80 px-3 py-2 bg-gray-50"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Assessment Dashboard Component */}
            <AssessmentDashboard courseId={selectedCourseId} />
          </div>
        </>
      )}
      
      {/* Create Project Modal */}
      {isCreatingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
                <button 
                  onClick={() => setIsCreatingProject(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md w-full px-3 py-2`}
                    placeholder="Enter project title"
                  />
                  {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                </div>
                
                <div>
                  <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Course *
                  </label>
                  <select
                    id="courseId"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleInputChange}
                    className={`border ${formErrors.courseId ? 'border-red-500' : 'border-gray-300'} rounded-md w-full px-3 py-2`}
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                  {formErrors.courseId && <p className="text-red-500 text-xs mt-1">{formErrors.courseId}</p>}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="border border-gray-300 rounded-md w-full px-3 py-2"
                    placeholder="Describe the project requirements and objectives"
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    id="instructions"
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows={4}
                    className="border border-gray-300 rounded-md w-full px-3 py-2"
                    placeholder="Provide detailed instructions for completing the project"
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-md w-full px-3 py-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="pointsValue" className="block text-sm font-medium text-gray-700 mb-1">
                    Points Value
                  </label>
                  <input
                    type="number"
                    id="pointsValue"
                    name="pointsValue"
                    min="0"
                    max="100"
                    value={formData.pointsValue}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-md w-full px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Points students will earn for completing this project</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills (optional)
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      className="border border-gray-300 rounded-l-md w-full px-3 py-2"
                      placeholder="Add skills students will learn"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-r-md hover:bg-gray-300 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center"
                        >
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1.5 text-blue-600 hover:text-blue-800"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                    Publish immediately (make visible to students)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRequiredForCertification"
                    name="isRequiredForCertification"
                    checked={formData.isRequiredForCertification}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isRequiredForCertification" className="ml-2 block text-sm text-gray-700">
                    Required for course certification
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatingProject(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
