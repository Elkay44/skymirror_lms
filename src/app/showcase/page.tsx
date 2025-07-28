import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Award, Search, Filter, ChevronDown, ArrowRight } from 'lucide-react';
import ShowcaseProjectCard from '@/components/showcase/ShowcaseProjectCard';

export const metadata: Metadata = {
  title: 'Project Showcase | SkyMirror Academy',
  description: 'Explore outstanding projects created by SkyMirror Academy students. See real-world applications of skills learned through our project-based curriculum.',
};

async function getShowcaseProjects() {
  // Using a static data fetch with revalidation
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/showcase`,
      { next: { revalidate: 3600 } } // Revalidate every hour
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch showcase projects');
    }
    
    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error('Error fetching showcase projects:', error);
    return [];
  }
}

async function getCategories() {
  // Using a static data fetch with revalidation
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/showcase/categories`,
      { next: { revalidate: 3600 } } // Revalidate every hour
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function ShowcasePage() {
  const [projects, categories] = await Promise.all([
    getShowcaseProjects(),
    getCategories(),
  ]);
  
  // Get featured projects
  const featuredProjects = projects.filter((project: any) => project.featured);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
              Project Showcase
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Explore outstanding projects created by SkyMirror Academy students. See real-world applications of skills learned through our project-based curriculum.
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/courses" 
                className="px-6 py-3 bg-white text-blue-700 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Explore Courses
              </Link>
              <Link 
                href="#featured" 
                className="px-6 py-3 bg-transparent border border-white text-white rounded-md font-medium hover:bg-white/10 transition-colors"
              >
                View Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <form action="/showcase/search" className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="q"
                placeholder="Search projects by title, student, or technologies..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex-shrink-0 flex gap-2">
              <div className="relative">
                <select
                  name="category"
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                  defaultValue=""
                >
                  <option value="">All Categories</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
              
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Featured Projects Section */}
      <section id="featured" className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Award className="h-8 w-8 text-yellow-500 mr-3" />
            Featured Projects
          </h2>
          
          <Link
            href="/showcase/featured"
            className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
          >
            View All Featured
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        {featuredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.slice(0, 6).map((project: any) => (
              <ShowcaseProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No featured projects yet</h3>
            <p className="text-gray-600">
              Our instructors are currently reviewing outstanding student projects to feature here.
              Check back soon!
            </p>
          </div>
        )}
      </section>
      
      {/* Recent Projects Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Recent Projects
          </h2>
          
          <Link
            href="/showcase/recent"
            className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
          >
            View All Recent
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project: any) => (
              <ShowcaseProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects available</h3>
            <p className="text-gray-600">
              Projects will appear here once they've been added to the showcase.
            </p>
          </div>
        )}
      </section>
      
      {/* Categories Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Explore by Category
          </h2>
          
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/showcase/category/${category.id}`}
                  className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-6 text-center"
                >
                  <h3 className="font-medium text-blue-800 mb-2">{category.name}</h3>
                  <p className="text-sm text-blue-600">{category.count} projects</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              Categories will appear here once they've been added.
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Ready to Build Your Own Projects?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join SkyMirror Academy today and start building practical, portfolio-worthy projects
            that showcase your skills to potential employers.
          </p>
          <Link 
            href="/register" 
            className="px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors inline-block"
          >
            Enroll Now
          </Link>
        </div>
      </section>
    </div>
  );
}
