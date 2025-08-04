"use client";

import { FilterButton } from './FilterButton';

export interface FilterOption {
  id: string;
  name: string;
}

export interface CourseFiltersType {
  search: string;
  category: string;
  level: string;
  duration: string;
  sort: string;
}

export interface CourseFiltersProps {
  filters: CourseFiltersType;
  onFilterChange: (filters: CourseFiltersType) => void;
  onResetFilters: () => void;
  categories: FilterOption[];
  levels: FilterOption[];
  durations: FilterOption[];
  sortOptions: FilterOption[];
  className?: string;
}

export function CourseFilters({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  levels,
  durations,
  sortOptions
}: CourseFiltersProps) {
  const handleFilterChange = (newFilters: CourseFiltersType) => {
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 break-words">
          Search
        </label>
        <input
          type="text"
          id="search"
          value={filters.search}
          onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 break-words">
          Category
        </label>
        <div className="flex flex-wrap gap-2 min-w-0">
          {categories.map((category) => (
            <FilterButton
              key={category.id}
              active={filters.category === category.id}
              label={category.name}
              onClick={() => handleFilterChange({ ...filters, category: category.id })}
            />
          ))}
        </div>
      </div>

      {levels && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 break-words">
            Level
          </label>
          <div className="flex flex-wrap gap-2 min-w-0">
            {levels.map((level) => (
              <FilterButton
                key={level.id}
                active={filters.level === level.id}
                label={level.name}
                onClick={() => handleFilterChange({ ...filters, level: level.id })}
              />
            ))}
          </div>
        </div>
      )}

      {durations && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 break-words">
            Duration
          </label>
          <div className="flex flex-wrap gap-2 min-w-0">
            {durations.map((duration) => (
              <FilterButton
                key={duration.id}
                active={filters.duration === duration.id}
                label={duration.name}
                onClick={() => handleFilterChange({ ...filters, duration: duration.id })}
              />
            ))}
          </div>
        </div>
      )}

      {sortOptions && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 break-words">
            Sort By
          </label>
          <div className="flex flex-wrap gap-2 min-w-0">
            {sortOptions.map((option) => (
              <FilterButton
                key={option.id}
                active={filters.sort === option.id}
                label={option.name}
                onClick={() => handleFilterChange({ ...filters, sort: option.id })}
              />
            ))}
          </div>
        </div>
      )}

      {(filters.category !== 'all' || filters.level !== 'all' || filters.duration !== 'all' || filters.search !== '') && (
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={onResetFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center break-words min-w-0"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset all filters
          </button>
          {/* Reset filters button */}
          {(filters.category !== 'all' || filters.level !== 'all' || filters.duration !== 'all' || filters.search !== '') && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={onResetFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center break-words min-w-0"
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
