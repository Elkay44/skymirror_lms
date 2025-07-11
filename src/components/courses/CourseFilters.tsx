"use client";

import { useState, useEffect } from 'react';

interface FilterOption {
  id: string;
  name: string;
}

export interface CourseFilters {
  search: string;
  category: string;
  level: string;
  duration: string;
  sort: string;
}

interface CourseFiltersProps {
  filters: CourseFilters;
  onFilterChange: (filters: CourseFilters) => void;
  categories: FilterOption[];
  levels?: FilterOption[];
  durations?: FilterOption[];
  sortOptions?: FilterOption[];
}

export default function CourseFilters({
  filters,
  onFilterChange,
  categories,
  levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ],
  durations = [
    { id: 'all', name: 'Any Duration' },
    { id: 'short', name: 'Under 3 hours' },
    { id: 'medium', name: '3-6 hours' },
    { id: 'long', name: 'Over 6 hours' }
  ],
  sortOptions = [
    { id: 'newest', name: 'Newest' },
    { id: 'popular', name: 'Most Popular' },
    { id: 'rating', name: 'Highest Rated' }
  ]
}: CourseFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  
  // Handle window resize to adjust mobile filters
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsFilterOpen(true);
      } else {
        setIsFilterOpen(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsFilterOpen(true);
      }
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };
  
  const handleFilterChange = (filterName: keyof CourseFilters, value: string) => {
    onFilterChange({ ...filters, [filterName]: value });
  };
  
  const resetFilters = () => {
    onFilterChange({
      search: '',
      category: 'all',
      level: 'all',
      duration: 'all',
      sort: 'newest'
    });
  };
  
  const FilterButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${active ? 'bg-indigo-100 text-indigo-800 font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );
  
  const isMobile = windowWidth < 768;
  
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search courses..."
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={filters.search}
              onChange={handleSearchChange}
              aria-label="Search courses"
            />
            <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden flex items-center gap-1 text-sm font-medium text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300"
              aria-expanded={isFilterOpen}
              aria-controls="filter-panel"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {(filters.category !== 'all' || filters.level !== 'all' || filters.duration !== 'all') && (
                <span className="ml-1 bg-indigo-100 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {(filters.category !== 'all' ? 1 : 0) + (filters.level !== 'all' ? 1 : 0) + (filters.duration !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="text-sm text-gray-700 border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Sort courses"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter panels */}
      {isFilterOpen && (
        <div id="filter-panel" className="p-4 space-y-4">
          {/* Categories filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <FilterButton
                  key={category.id}
                  active={filters.category === category.id}
                  label={category.name}
                  onClick={() => handleFilterChange('category', category.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Level filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Level</h3>
            <div className="flex flex-wrap gap-2">
              {levels.map(level => (
                <FilterButton
                  key={level.id}
                  active={filters.level === level.id}
                  label={level.name}
                  onClick={() => handleFilterChange('level', level.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Duration filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Duration</h3>
            <div className="flex flex-wrap gap-2">
              {durations.map(duration => (
                <FilterButton
                  key={duration.id}
                  active={filters.duration === duration.id}
                  label={duration.name}
                  onClick={() => handleFilterChange('duration', duration.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Mobile sort options */}
          {isMobile && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sort by</h3>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Sort courses"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Reset filters button */}
          {(filters.category !== 'all' || filters.level !== 'all' || filters.duration !== 'all' || filters.search !== '') && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={resetFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
