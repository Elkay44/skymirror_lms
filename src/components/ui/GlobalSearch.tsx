"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Book, User, FileText, Video, Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SearchResult {
  id: string;
  type: 'course' | 'lesson' | 'project' | 'user' | 'career_path' | 'assignment';
  title: string;
  description?: string;
  url: string;
  metadata?: {
    courseName?: string;
    instructorName?: string;
    category?: string;
    difficulty?: string;
    role?: string;
  };
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  showCategories?: boolean;
  maxResults?: number;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Search courses, lessons, projects...",
  className = "",
  showCategories = true,
  maxResults = 10
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return <Book className="h-4 w-4 text-blue-500" />;
      case 'lesson': return <Video className="h-4 w-4 text-green-500" />;
      case 'project': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'assignment': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'career_path': return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'user': return <User className="h-4 w-4 text-gray-500" />;
      default: return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return 'Course';
      case 'lesson': return 'Lesson';
      case 'project': return 'Project';
      case 'assignment': return 'Assignment';
      case 'career_path': return 'Career Path';
      case 'user': return 'User';
      default: return 'Content';
    }
  };

  const searchContent = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=${maxResults}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [maxResults]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContent(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchContent]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}

        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results */}
      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {showCategories ? (
                // Grouped results by type
                Object.entries(groupedResults).map(([type, typeResults]) => (
                  <div key={type}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      {getTypeLabel(type)}s ({typeResults.length})
                    </div>
                    {typeResults.map((result, index) => {
                      const globalIndex = results.findIndex(r => r.id === result.id);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                            selectedIndex === globalIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {getIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.title}
                              </p>
                              {result.description && (
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {result.description}
                                </p>
                              )}
                              {result.metadata && (
                                <div className="flex items-center space-x-2 mt-1">
                                  {result.metadata.courseName && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                      {result.metadata.courseName}
                                    </span>
                                  )}
                                  {result.metadata.instructorName && (
                                    <span className="text-xs text-gray-600">
                                      by {result.metadata.instructorName}
                                    </span>
                                  )}
                                  {result.metadata.difficulty && (
                                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                                      {result.metadata.difficulty}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                // Flat results list
                results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                      selectedIndex === index ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        {result.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
