import { motion } from 'framer-motion';
import { Clock, Zap, Edit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CourseHeaderProps {
  course: {
    id: string;
    title: string;
    shortDescription: string;
    imageUrl?: string;
    isPublished: boolean;
    enrollmentCount: number;
    averageRating: number;
    modulesCount: number;
    lessonsCount: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    updatedAt: string;
  };
  onPublishToggle: () => void;
  isPublishing: boolean;
}

export function CourseHeader({ course, onPublishToggle, isPublishing }: CourseHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl overflow-hidden shadow-2xl mb-8">
      {/* Hero Section */}
      <div className="relative h-72 w-full">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover opacity-20"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-purple-800" />
        )}
        
        <div className="relative z-10 h-full flex flex-col justify-center p-8 text-white">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                {course.isPublished ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    Published
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    Draft
                  </>
                )}
              </span>
              
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                course.difficulty === 'BEGINNER' 
                  ? 'bg-blue-500/20 text-blue-200' 
                  : course.difficulty === 'INTERMEDIATE'
                    ? 'bg-purple-500/20 text-purple-200'
                    : 'bg-pink-500/20 text-pink-200'
              }`}>
                {course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}
              </span>
              
              <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Updated {new Date(course.updatedAt).toLocaleDateString()}
              </span>
            </div>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {course.title}
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-indigo-100 max-w-3xl mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {course.shortDescription}
            </motion.p>
            
            <div className="flex flex-wrap items-center gap-4 mt-8 ml-auto">
              {/* Edit button - Always available, separate from publish action */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  href={`/dashboard/instructor/courses/${course.id}/edit`}
                  className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-300"
                >
                  <Edit className="w-4 h-4" />
                  Edit Course
                </Link>
              </motion.div>
              
              {/* Publish/Unpublish button - Separate from edit action */}
              <motion.button
                onClick={onPublishToggle}
                disabled={isPublishing}
                className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 ${
                  course.isPublished 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                } transition-all duration-300`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : course.isPublished ? (
                  <>
                    <Zap className="w-4 h-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Publish Course
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseHeader;
