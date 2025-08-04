"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Lightbulb, 
  Clock, 
  Brain, 
  BookOpen, 
  Target, 
  Calendar,
  Search,
  ThumbsUp,
  Bookmark,
  Share2,
  Filter
} from 'lucide-react';

export default function TipsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedTips, setSavedTips] = useState<string[]>([]);
  
  const userRole = session?.user?.role || 'STUDENT';
  
  // Role-specific styling
  const roleColor = userRole === 'STUDENT' ? 'blue' : 
                   userRole === 'INSTRUCTOR' ? 'purple' : 'teal';
                   
  const categories = [
    { id: 'study', name: 'Study Techniques', icon: <Brain className="h-5 w-5" /> },
    { id: 'time', name: 'Time Management', icon: <Clock className="h-5 w-5" /> },
    { id: 'productivity', name: 'Productivity', icon: <Target className="h-5 w-5" /> },
    { id: 'reading', name: 'Reading Strategies', icon: <BookOpen className="h-5 w-5" /> },
    { id: 'planning', name: 'Planning', icon: <Calendar className="h-5 w-5" /> }
  ];
  
  const tips = [
    {
      id: 'tip1',
      title: 'The Pomodoro Technique',
      category: 'time',
      content: 'Work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-30 minute break. This technique helps maintain focus and prevents burnout.',
      difficulty: 'Beginner',
      likes: 245
    },
    {
      id: 'tip2',
      title: 'Spaced Repetition',
      category: 'study',
      content: 'Instead of cramming all at once, space out your study sessions over time. Review material at increasing intervals: 1 day, 3 days, 1 week, 2 weeks, etc. This improves long-term retention.',
      difficulty: 'Intermediate',
      likes: 189
    },
    {
      id: 'tip3',
      title: 'Active Recall',
      category: 'study',
      content: 'Test yourself on material instead of passively re-reading. Close your notes and try to explain concepts in your own words or solve problems without looking at solutions.',
      difficulty: 'Intermediate',
      likes: 312
    },
    {
      id: 'tip4',
      title: 'Mind Mapping',
      category: 'study',
      content: 'Create visual diagrams that connect ideas and concepts. Start with a central topic and branch out with related subtopics. Use colors and images to enhance memory.',
      difficulty: 'Beginner',
      likes: 176
    },
    {
      id: 'tip5',
      title: 'Time Blocking',
      category: 'time',
      content: 'Allocate specific blocks of time for different tasks or subjects. Schedule these blocks in your calendar and treat them as appointments with yourself.',
      difficulty: 'Beginner',
      likes: 203
    },
    {
      id: 'tip6',
      title: 'The Feynman Technique',
      category: 'study',
      content: 'To truly understand a concept, try explaining it in simple terms as if teaching someone else. If you struggle, revisit the material until you can explain it clearly.',
      difficulty: 'Advanced',
      likes: 287
    },
    {
      id: 'tip7',
      title: 'SQ3R Reading Method',
      category: 'reading',
      content: 'Survey, Question, Read, Recite, Review. First skim the material, form questions, then read actively, recite key points, and finally review what you have learned.',
      difficulty: 'Intermediate',
      likes: 154
    },
    {
      id: 'tip8',
      title: 'Eisenhower Matrix',
      category: 'productivity',
      content: 'Organize tasks into four quadrants: Urgent & Important, Important but Not Urgent, Urgent but Not Important, and Neither. Focus on the Important quadrants.',
      difficulty: 'Intermediate',
      likes: 231
    },
    {
      id: 'tip9',
      title: 'Cornell Note-Taking System',
      category: 'study',
      content: 'Divide your page into three sections: notes, cues, and summary. Take notes on the right, write cues/questions on the left, and summarize at the bottom.',
      difficulty: 'Beginner',
      likes: 198
    },
    {
      id: 'tip10',
      title: 'Weekly Planning Session',
      category: 'planning',
      content: 'Dedicate 30 minutes every Sunday to plan your week. Review upcoming deadlines, set priorities, and schedule specific study blocks for different subjects.',
      difficulty: 'Beginner',
      likes: 167
    },
    {
      id: 'tip11',
      title: 'Interleaved Practice',
      category: 'study',
      content: 'Mix different topics or types of problems within a study session instead of focusing on just one. This improves your ability to discriminate between problem types.',
      difficulty: 'Advanced',
      likes: 142
    },
    {
      id: 'tip12',
      title: 'Digital Detox',
      category: 'productivity',
      content: 'Set aside periods of time to disconnect from digital devices. Use apps like Forest or Focus Mode to block distracting apps during study sessions.',
      difficulty: 'Intermediate',
      likes: 219
    },
    {
      id: 'tip13',
      title: 'Retrieval Practice',
      category: 'study',
      content: 'Regularly quiz yourself on material you have learned. Create flashcards, practice problems, or write summaries from memory to strengthen recall.',
      difficulty: 'Intermediate',
      likes: 256
    },
    {
      id: 'tip14',
      title: 'The 2-Minute Rule',
      category: 'productivity',
      content: 'If a task takes less than 2 minutes to complete, do it immediately rather than scheduling it for later. This prevents small tasks from piling up.',
      difficulty: 'Beginner',
      likes: 301
    },
    {
      id: 'tip15',
      title: 'Elaborative Interrogation',
      category: 'study',
      content: 'Ask yourself "why" questions about the material you are learning. Explaining why facts are true helps connect new information to existing knowledge.',
      difficulty: 'Advanced',
      likes: 178
    }
  ];
  
  const toggleSaveTip = (tipId: string) => {
    if (savedTips.includes(tipId)) {
      setSavedTips(savedTips.filter(id => id !== tipId));
    } else {
      setSavedTips([...savedTips, tipId]);
    }
  };
  
  const filteredTips = tips.filter(tip => {
    const matchesSearch = searchQuery === '' || 
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tip.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || tip.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Hero section */}
      <div className={`bg-gradient-to-r from-${roleColor}-600 to-${roleColor}-800 py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            <Lightbulb className="inline-block mr-2 h-8 w-8" />
            Learning Tips & Strategies
          </h1>
          <p className="mt-3 max-w-md mx-auto text-lg text-white opacity-90 sm:text-xl md:mt-5 md:max-w-3xl">
            Discover proven techniques to enhance your learning experience and boost productivity
          </p>
          
          {/* Search */}
          <div className="mt-10 max-w-xl mx-auto">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-4 border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded-md"
                placeholder="Search for tips and strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Categories</h2>
              
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    selectedCategory === null
                      ? `bg-${roleColor}-100 text-${roleColor}-700`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Filter className="mr-3 h-5 w-5" />
                  All Categories
                </button>
                
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                      selectedCategory === category.id
                        ? `bg-${roleColor}-100 text-${roleColor}-700`
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Difficulty Level</h2>
                <div className="space-y-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <div key={level} className="flex items-center">
                      <input
                        id={`filter-${level}`}
                        name={`filter-${level}`}
                        type="checkbox"
                        className={`h-4 w-4 text-${roleColor}-600 focus:ring-${roleColor}-500 border-gray-300 rounded`}
                      />
                      <label htmlFor={`filter-${level}`} className="ml-3 text-sm text-gray-600">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="mt-8 lg:mt-0 lg:col-span-9">
            {filteredTips.length > 0 ? (
              <div className="space-y-6">
                {filteredTips.map((tip) => {
                  const category = categories.find(c => c.id === tip.category);
                  
                  return (
                    <div key={tip.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
                      <div className="px-6 py-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-medium text-gray-900">{tip.title}</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleSaveTip(tip.id)}
                              className={`p-1 rounded-full ${
                                savedTips.includes(tip.id)
                                  ? `bg-${roleColor}-100 text-${roleColor}-600`
                                  : 'text-gray-400 hover:text-gray-500'
                              }`}
                              title={savedTips.includes(tip.id) ? "Saved" : "Save for later"}
                            >
                              <Bookmark className="h-5 w-5" />
                            </button>
                            <button
                              className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                              title="Share tip"
                            >
                              <Share2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          {category && (
                            <>
                              <span className="inline-flex items-center">
                                {category.icon}
                                <span className="ml-1">{category.name}</span>
                              </span>
                              <span className="mx-2">•</span>
                            </>
                          )}
                          <span>{tip.difficulty}</span>
                        </div>
                        
                        <div className="mt-4 text-gray-700">
                          <p>{tip.content}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            <span>{tip.likes} found this helpful</span>
                          </div>
                          
                          <button
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-${roleColor}-600 hover:bg-${roleColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${roleColor}-500`}
                          >
                            Try This Technique
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No tips found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-${roleColor}-600 hover:bg-${roleColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${roleColor}-500`}
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Featured Tip Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Learning Strategy</h2>
          
          <div className={`bg-gradient-to-r from-${roleColor}-50 to-white rounded-lg shadow-sm overflow-hidden`}>
            <div className="px-6 py-8 lg:flex lg:items-center lg:justify-between">
              <div className="lg:max-w-2xl">
                <h3 className="text-2xl font-bold text-gray-900">The Learning Pyramid</h3>
                <div className="mt-4 text-gray-700">
                  <p className="mb-4">
                    The Learning Pyramid suggests that retention rates vary based on how you engage with material:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>5% retention</strong> from lectures (passive learning)</li>
                    <li><strong>10% retention</strong> from reading</li>
                    <li><strong>20% retention</strong> from audio-visual</li>
                    <li><strong>30% retention</strong> from demonstrations</li>
                    <li><strong>50% retention</strong> from group discussions</li>
                    <li><strong>75% retention</strong> from practice by doing</li>
                    <li><strong>90% retention</strong> from teaching others</li>
                  </ul>
                  <p className="mt-4">
                    To maximize learning, incorporate active methods like practice exercises, peer discussions, and teaching concepts to others.
                  </p>
                </div>
                
                <div className="mt-6">
                  <Link 
                    href="/resources"
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-${roleColor}-600 hover:bg-${roleColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${roleColor}-500`}
                  >
                    Explore Learning Resources
                  </Link>
                </div>
              </div>
              
              <div className="mt-8 lg:mt-0 lg:ml-8">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="aspect-w-16 aspect-h-9">
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <div className="text-center p-4">
                        <Brain className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Learning Pyramid Visualization</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Weekly Challenge */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Learning Challenge</h2>
          
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-yellow-200">
            <div className="px-6 py-5 border-b border-yellow-200 bg-yellow-50">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-yellow-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">This Week: Active Recall Challenge</h3>
              </div>
            </div>
            
            <div className="px-6 py-5">
              <p className="text-gray-700">
                For the next 7 days, implement active recall in your study routine. After each study session, close your notes and spend 5 minutes writing down everything you remember. Compare with your notes to identify knowledge gaps.
              </p>
              
              <div className="mt-6 flex items-center">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">127 students participating</p>
                </div>
                
                <button
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Join Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
