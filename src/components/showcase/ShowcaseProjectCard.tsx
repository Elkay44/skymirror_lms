"use client";

/* eslint-disable */
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ExternalLink, Eye, Edit, Trash2 } from 'lucide-react';
import { Github } from 'lucide-react';

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

interface ShowcaseProjectCardProps {
  project: ShowcaseProject;
  onEdit?: () => void;
  onRemove?: () => void;
  onToggleFeatured?: () => void;
  isAdmin?: boolean;
}

export default function ShowcaseProjectCard({
  project,
  onEdit,
  onRemove,
  onToggleFeatured,
  isAdmin = false,
}: ShowcaseProjectCardProps) {
  // Truncate description if it's too long
  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 flex flex-col h-full min-w-0 overflow-hidden"
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
            <div className="text-blue-500 text-2xl font-bold break-words">{project.title.substring(0, 2).toUpperCase()}</div>
          </div>
        )}
        
        {project.featured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center break-words min-w-0 flex-shrink-0">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </div>
        )}
        
        {isAdmin && (
          <div className="absolute top-2 right-2 flex space-x-1 min-w-0">
            {onToggleFeatured && (
              <button
                onClick={onToggleFeatured}
                className={`p-1.5 rounded-full ${project.featured 
                  ? 'bg-yellow-400 text-white' 
                  : 'bg-white text-gray-600'}`}
              >
                <Star className="h-4 w-4" />
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 rounded-full bg-white text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1.5 rounded-full bg-white text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center min-w-0">
          <Eye className="h-3 w-3 mr-1" />
          {project.viewCount.toLocaleString()}
        </div>
      </div>
      
      <div className="p-5 flex-grow min-w-0">
        <div className="flex items-start justify-between min-w-0">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 break-words">{project.title}</h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 break-words">
          {truncateDescription(project.description)}
        </p>
        
        <div className="flex items-center mb-4 min-w-0">
          <div className="flex-shrink-0 mr-2 min-w-0">
            {project.studentImage ? (
              <Image 
                src={project.studentImage} 
                alt={project.studentName}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-xs font-medium break-words min-w-0">
                {project.studentName.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-sm break-words">
            <span className="text-gray-500">By </span>
            <Link href={`/portfolio/${project.studentId}`} className="text-blue-600 hover:text-blue-800">
              {project.studentName}
            </Link>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4 min-w-0">
          {project.tags.slice(0, 3).map(tag => (
            <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-between items-center min-w-0">
        <div className="text-xs text-gray-500">
          {new Date(project.showcasedAt).toLocaleDateString()}
        </div>
        
        <div className="flex space-x-3 min-w-0">
          {project.demoUrl && (
            <a 
              href={project.demoUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center break-words min-w-0"
            >
              Demo
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
          
          {project.repositoryUrl && (
            <a 
              href={project.repositoryUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-700 hover:text-gray-900 flex items-center break-words min-w-0"
            >
              <Github className="h-4 w-4 mr-1" />
              Code
            </a>
          )}
          
          <Link 
            href={`/showcase/${project.id}`}
            className="text-sm text-gray-700 hover:text-gray-900 flex items-center break-words min-w-0"
          >
            Details
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
