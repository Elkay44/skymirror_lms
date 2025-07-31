"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  FileText,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Calendar,
  Star
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  publishStatus: 'draft' | 'published' | 'archived';
  enrollmentCount: number;
  lastUpdated: string;
  progress: number; // percentage complete for development
  category?: string;
  level?: string;
  lessonsCount?: number;
  totalDuration?: number;
  rating?: number;
}

export default function InstructorCoursesPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/courses/instructor', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `Failed to fetch courses: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        
        if (!Array.isArray(data.courses)) {
          throw new Error('Invalid response format from server');
        }
        
        // Transform API data to match our interface
        const transformedCourses: Course[] = data.courses.map((course: any) => ({
          id: course.id,
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available',
          coverImage: course.coverImage || '/images/course-placeholder.jpg',
          publishStatus: course.publishStatus || 'draft',
          enrollmentCount: course.enrollmentCount || 0,
          lastUpdated: course.lastUpdated || new Date().toISOString(),
          progress: 0, // Default progress
          category: course.category || 'Uncategorized',
          level: course.level || 'beginner',
          lessonsCount: course.lessonsCount || 0,
          totalDuration: course.totalDuration || 0,
          rating: course.rating || 0,
        }));
        
        setCourses(transformedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(
          error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred while loading courses'
        );
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);
  
  // Filter courses based on search term and tab selection
  const filteredCourses = courses.filter(course => {
    // Filter by search
    const matchesSearch = 
      searchTerm === '' ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by tab
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'published' && course.publishStatus === 'published') ||
      (activeTab === 'drafts' && course.publishStatus === 'draft') ||
      (activeTab === 'archived' && course.publishStatus === 'archived');
      
    return matchesSearch && matchesTab;
  });
  
  // Sort courses based on last updated date
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    // Handle invalid dates by putting them at the end
    let dateA: number;
    let dateB: number;
    try {
      dateA = new Date(a.lastUpdated).getTime();
      if (isNaN(dateA)) dateA = 0;
    } catch (e) {
      dateA = 0;
    }
    
    try {
      dateB = new Date(b.lastUpdated).getTime();
      if (isNaN(dateB)) dateB = 0;
    } catch (e) {
      dateB = 0;
    }
    
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  // Course counts by status - make sure these calculations are up-to-date
  const publishedCount = courses.filter(course => course.publishStatus === 'published').length;
  const draftsCount = courses.filter(course => course.publishStatus === 'draft').length;
  const archivedCount = courses.filter(course => course.publishStatus === 'archived').length;
  
  // Log counts to verify they're correct
  useEffect(() => {
    console.log('Course stats:', {
      total: courses.length,
      published: publishedCount,
      drafts: draftsCount,
      archived: archivedCount
    });
  }, [courses, publishedCount, draftsCount, archivedCount]);
  
  const formatDuration = (minutes: number) => {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };
  
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="flex space-x-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded-t"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">
            Create, manage, and track all your courses
          </p>
        </div>
        
        <Button className="mt-4 md:mt-0" asChild>
          <Link href="/dashboard/instructor/courses/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>
      
      {/* Tabs and filters */}
      <div className="mb-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <TabsList>
              <TabsTrigger value="all">
                All Courses <Badge variant="secondary" className="ml-2">{courses.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="published">
                Published <Badge variant="secondary" className="ml-2">{publishedCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="drafts">
                Drafts <Badge variant="secondary" className="ml-2">{draftsCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived <Badge variant="secondary" className="ml-2">{archivedCount}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                title={sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Course Grid */}
          <TabsContent value={activeTab} className="mt-6">
            {sortedCourses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-10">
                  <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm 
                      ? 'No matching courses found' 
                      : activeTab === 'published' 
                        ? 'No published courses found' 
                        : activeTab === 'drafts' 
                          ? 'No draft courses found' 
                          : activeTab === 'archived' 
                            ? 'No archived courses found' 
                            : 'No courses found'}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search term' 
                      : activeTab === 'published'
                        ? 'Publish one of your draft courses to make it available to students'
                        : 'Start by creating your first course'}
                  </p>
                  {!searchTerm && (
                    <Button asChild variant="outline">
                      <Link href="/dashboard/instructor/courses/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create a course
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCourses.map((course) => {
                  // Define status badge color
                  const statusBadge = {
                    draft: "bg-amber-100 text-amber-800",
                    published: "bg-green-100 text-green-800",
                    archived: "bg-gray-100 text-gray-800"
                  }[course.publishStatus];
                  
                  // Course status text
                  const statusText = {
                    draft: "Draft",
                    published: "Published",
                    archived: "Archived"
                  }[course.publishStatus];
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col h-full"
                    >
                      <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                        {course.coverImage ? (
                          <Image 
                            src={course.coverImage} 
                            alt={course.title}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${statusBadge}`}>
                            {statusText}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">
                          {course.description.length > 120 
                            ? `${course.description.substring(0, 120)}...` 
                            : course.description}
                        </p>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{course.enrollmentCount} students</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{new Date(course.lastUpdated).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Progress bar for draft courses */}
                          {course.publishStatus === 'draft' && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Course progress</span>
                                <span>{course.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/instructor/courses/${course.id}`}>
                              Manage Course
                            </Link>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                                <MoreVertical className="h-4 w-4" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Link href={`/dashboard/instructor/courses/${course.id}`} className="flex items-center w-full">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link href={`/dashboard/instructor/courses/${course.id}/preview`} className="flex items-center w-full">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Preview
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
