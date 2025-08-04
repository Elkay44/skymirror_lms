import React, { useState } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';

export interface MentorFiltersState {
  searchQuery: string;
  specialties: string[];
  minRating: number;
  availability: string[];
}

interface MentorFiltersProps {
  filters: MentorFiltersState;
  onFilterChange: (filters: MentorFiltersState) => void;
  availableSpecialties: string[];
}

export default function MentorFilters({ filters, onFilterChange, availableSpecialties }: MentorFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchQuery: e.target.value
    });
  };
  
  const handleSpecialtyChange = (specialty: string) => {
    const updatedSpecialties = filters.specialties.includes(specialty)
      ? filters.specialties.filter(s => s !== specialty)
      : [...filters.specialties, specialty];
    
    onFilterChange({
      ...filters,
      specialties: updatedSpecialties
    });
  };
  
  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...filters,
      minRating: rating
    });
  };
  
  const handleAvailabilityChange = (availability: string) => {
    const updatedAvailability = filters.availability.includes(availability)
      ? filters.availability.filter(a => a !== availability)
      : [...filters.availability, availability];
    
    onFilterChange({
      ...filters,
      availability: updatedAvailability
    });
  };
  
  // Price filtering removed as mentorship is now provided at no cost
  
  const clearAllFilters = () => {
    onFilterChange({
      searchQuery: '',
      specialties: [],
      minRating: 0,
      availability: []
    });
  };
  
  const hasActiveFilters = filters.specialties.length > 0 || 
                          filters.minRating > 0 || 
                          filters.availability.length > 0;
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden overflow-hidden">
      {/* Search bar */}
      <div className="p-4">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none min-w-0">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm break-words"
            placeholder="Search mentors by name, specialty, or expertise"
            value={filters.searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      {/* Filters toggle (mobile) */}
      <div className="px-4 py-3 border-t border-gray-200 lg:hidden">
        <button
          type="button"
          className="flex w-full justify-between items-center text-sm font-medium text-gray-700 break-words min-w-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="flex items-center min-w-0">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5 break-words">
                Active
              </span>
            )}
          </span>
          {showFilters ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5 transform rotate-180" />
          )}
        </button>
      </div>
      
      {/* Filter options */}
      <div className={`px-4 py-4 border-t border-gray-200 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <h3 className="text-sm font-medium text-gray-700 mb-3 break-words">Specialties</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availableSpecialties.map((specialty) => (
            <div key={specialty} className="flex items-center min-w-0">
              <input
                id={`specialty-${specialty}`}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={filters.specialties.includes(specialty)}
                onChange={() => handleSpecialtyChange(specialty)}
              />
              <label htmlFor={`specialty-${specialty}`} className="ml-3 text-sm text-gray-700 break-words">
                {specialty}
              </label>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 break-words">Minimum Rating</h3>
          <div className="flex items-center space-x-2 min-w-0">
            {[0, 1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                className={`rounded-md px-2.5 py-1.5 text-sm font-medium ${filters.minRating === rating ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                onClick={() => handleRatingChange(rating)}
              >
                {rating === 0 ? 'Any' : `${rating}+`}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 break-words">Availability</h3>
          <div className="space-y-2">
            {['Available now', 'Weekdays', 'Weekends', 'Evenings'].map((availability) => (
              <div key={availability} className="flex items-center min-w-0">
                <input
                  id={`availability-${availability}`}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={filters.availability.includes(availability)}
                  onChange={() => handleAvailabilityChange(availability)}
                />
                <label htmlFor={`availability-${availability}`} className="ml-3 text-sm text-gray-700 break-words">
                  {availability}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Price filtering removed as mentorship is now provided at no cost */}
        
        {hasActiveFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 break-words min-w-0"
              onClick={clearAllFilters}
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
