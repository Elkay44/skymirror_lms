/* eslint-disable */

"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Share2, Edit, ExternalLink, Award, Tag, Clock, BookOpen } from 'lucide-react';
import { Github } from 'lucide-react';

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  courseId: string;
  completedAt: string;
  repositoryUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  skills: string[];
  featured: boolean;
}

export default function StudentPortfolio() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  
  useEffect(() => {
    if (!session) return;
    
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        // Fetch the student's completed projects that can be showcased
        const response = await fetch('/api/portfolio');
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio projects');
        }
        
        const data = await response.json();
        
        // Process projects and extract all skills
        const completedProjects = data.projects || [];
        const featured = completedProjects.filter((p: PortfolioProject) => p.featured);
        
        // Extract all unique skills from projects
        const skillSet = new Set<string>();
        completedProjects.forEach((project: PortfolioProject) => {
          project.skills.forEach(skill => skillSet.add(skill));
        });
        
        setProjects(completedProjects);
        setFeaturedProjects(featured);
        setAllSkills(Array.from(skillSet));
      } catch (err: any) {
        console.error('Error fetching portfolio:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolio();
  }, [session]);
  
  const toggleFeatured = async (projectId: string, featured: boolean) => {
    if (!editing) return;
    
    try {
      const response = await fetch(`/api/portfolio/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured: !featured })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      
      // Update local state to reflect changes
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, featured: !featured } : p
      ));
      
      // Update featured projects
      setFeaturedProjects(prev => {
        if (featured) {
          // Remove from featured
          return prev.filter(p => p.id !== projectId);
        } else {
          // Add to featured
          const project = projects.find(p => p.id === projectId);
          if (project) {
            return [...prev, { ...project, featured: true }];
          }
          return prev;
        }
      });
    } catch (err: any) {
      console.error('Error updating project:', err);
    }
  };
  
  const sharePortfolio = () => {
    // Generate a shareable link to the public portfolio view
    const portfolioUrl = `${window.location.origin}/portfolio/${session?.user?.id}`;
    setShareUrl(portfolioUrl);
    setShareModalOpen(true);
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Portfolio URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      alert('Failed to copy URL. Please try again.');
    }
  };
  
  const filteredProjects = activeSkills.length > 0
    ? projects.filter(project => 
        project.skills.some(skill => activeSkills.includes(skill))
      )
    : projects;
  
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 break-words">My Portfolio</h1>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-xl h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 min-w-0">
        <h1 className="text-3xl font-bold mb-2 md:mb-0 break-words">My Portfolio</h1>
        
        <div className="flex space-x-4 min-w-0">
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center px-4 py-2 rounded-md ${editing 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-800'}`}
          >
            <Edit className="h-4 w-4 mr-2" />
            {editing ? 'Save Changes' : 'Edit Portfolio'}
          </button>
          
          <button
            onClick={sharePortfolio}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors min-w-0"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Portfolio
          </button>
        </div>
      </div>
      
      {/* Skills filter */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center break-words min-w-0">
          <Tag className="h-5 w-5 mr-2 text-blue-600" />
          Filter by Skills
        </h2>
        <div className="flex flex-wrap gap-2 min-w-0">
          {allSkills.map(skill => (
            <button
              key={skill}
              onClick={() => setActiveSkills(prev => 
                prev.includes(skill) 
                  ? prev.filter(s => s !== skill) 
                  : [...prev, skill]
              )}
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeSkills.includes(skill) 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              {skill}
            </button>
          ))}
          {activeSkills.length > 0 && (
            <button
              onClick={() => setActiveSkills([])}
              className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 break-words"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {featuredProjects.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center break-words min-w-0">
            <Award className="h-6 w-6 mr-2 text-yellow-500" />
            Featured Projects
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard 
                key={project.id}
                project={project}
                editing={editing}
                toggleFeatured={toggleFeatured}
              />
            ))}
          </div>
        </section>
      )}
      
      <section>
        <h2 className="text-2xl font-semibold mb-6 flex items-center break-words min-w-0">
          <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
          All Projects
        </h2>
        
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id}
                project={project}
                editing={editing}
                toggleFeatured={toggleFeatured}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              {activeSkills.length > 0
                ? 'No projects match the selected skills. Try different filters.'
                : 'No completed projects yet. Complete your course projects to build your portfolio.'}
            </p>
            <Link href="/dashboard/student/projects" className="text-blue-600 hover:text-blue-800 font-medium break-words">
              View My Projects
            </Link>
          </div>
        )}
      </section>
      
      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 min-w-0">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full overflow-hidden"
          >
            <h3 className="text-xl font-semibold mb-4 break-words">Share Your Portfolio</h3>
            <p className="text-gray-600 mb-4">
              Share this link with potential employers or on your social media profiles.
            </p>
            
            <div className="flex items-center mb-4 min-w-0">
              <input 
                type="text" 
                value={shareUrl} 
                readOnly 
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 bg-gray-50 min-w-0"
              />
              <button
                onClick={copyToClipboard}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            
            <div className="flex justify-end min-w-0">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, editing, toggleFeatured }: {
  project: PortfolioProject;
  editing: boolean;
  toggleFeatured: (id: string, featured: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-sm overflow-hidden ${project.featured && !editing ? 'ring-2 ring-yellow-400' : ''}`}
    >
      <div className="relative h-48 bg-gray-200">
        {project.imageUrl ? (
          <Image 
            src={project.imageUrl} 
            alt={project.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 min-w-0">
            <div className="text-blue-500 text-xl font-semibold break-words">{project.title.substring(0, 2).toUpperCase()}</div>
          </div>
        )}
        
        {editing && (
          <button
            onClick={() => toggleFeatured(project.id, project.featured)}
            className={`absolute top-2 right-2 p-2 rounded-full ${project.featured 
              ? 'bg-yellow-400 text-white' 
              : 'bg-white text-gray-600'}`}
          >
            <Award className="h-5 w-5" />
          </button>
        )}
        
        {project.featured && !editing && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center break-words min-w-0 flex-shrink-0">
            <Award className="h-3 w-3 mr-1" />
            Featured
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2 break-words">{project.title}</h3>
        <p className="text-gray-600 text-sm mb-3 break-words">{project.description}</p>
        
        <div className="flex items-center text-sm text-gray-500 mb-3 break-words min-w-0">
          <Clock className="h-4 w-4 mr-1" />
          <span>Completed {new Date(project.completedAt).toLocaleDateString()}</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4 min-w-0">
          {project.skills.map(skill => (
            <span key={skill} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {skill}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between min-w-0">
          <Link 
            href={`/dashboard/student/projects/${project.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center break-words min-w-0"
          >
            View Details
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
          
          {project.repositoryUrl && (
            <a 
              href={project.repositoryUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center break-words min-w-0"
            >
              <Github className="h-4 w-4 mr-1" />
              Repository
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
