"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, Award, Star, BookOpen, Users, Gift, Zap, Medal, Check, Percent, Clock } from 'lucide-react';


// Sample achievement and progress data have been moved to the API endpoint

// Define specific achievement type interfaces
interface BaseAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon?: string;
  earnedAt?: Date;
  category: 'learning' | 'financial' | 'community' | 'career';
}

interface FinancialAchievement extends BaseAchievement {
  category: 'financial';
  amount?: number;
  currency?: string;
  validUntil?: Date;
  discountPercent?: number;
  applicableCourses?: string[];
  referralCount?: number;
}

interface LearningAchievement extends BaseAchievement {
  category: 'learning';
}

interface CommunityAchievement extends BaseAchievement {
  category: 'community';
  studentsHelped?: number;
  averageRating?: number;
  helpfulAnswers?: number;
}

interface CareerAchievement extends BaseAchievement {
  category: 'career';
  issuer?: string;
  company?: string;
  position?: string;
}

// Union type for all achievement types
type Achievement = LearningAchievement | FinancialAchievement | CommunityAchievement | CareerAchievement;

export default function AchievementsPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState({
    level: 0,
    currentXP: 0,
    nextLevelXP: 0,
    totalScholarshipAmount: 0,
    activeDiscounts: 0,
    completedCourses: 0,
    forumContributions: 0,
    mentorshipHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  // Error state removed per user request
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Fetch achievements data
    const fetchAchievements = async () => {
      try {
        // Make API call to fetch achievements
        const response = await fetch('/api/achievements');
        
        if (!response.ok) {
          throw new Error('Failed to fetch achievements');
        }
        
        const responseData = await response.json();
        
        // The API returns { data: Achievement[], pagination: {...} }
        const achievementsData = responseData.data || [];
        
        // Set achievements from the response data
        setAchievements(Array.isArray(achievementsData) ? achievementsData : []);
        
        // Update progress - these values should come from your user profile or another endpoint
        // For now, we'll set default values
        setProgress({
          level: 1,
          currentXP: 0,
          nextLevelXP: 1000,
          totalScholarshipAmount: 0,
          activeDiscounts: 0,
          completedCourses: achievementsData.filter((a: Achievement) => a.type === 'course_completed').length,
          forumContributions: achievementsData.filter((a: Achievement) => a.category === 'community').length,
          mentorshipHours: 0
        });
        
        setIsLoading(false);
      } catch (error: any) {
        // Silently fail and show empty state
        setAchievements([]);
        setProgress({
          level: 0,
          currentXP: 0,
          nextLevelXP: 0,
          totalScholarshipAmount: 0,
          activeDiscounts: 0,
          completedCourses: 0,
          forumContributions: 0,
          mentorshipHours: 0
        });
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchAchievements();
    }
  }, [status, router]);
  
  // Filter achievements based on active tab
  const filteredAchievements = activeTab === 'all' 
    ? achievements 
    : achievements.filter(achievement => achievement.category === activeTab);
  
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Add a loading state that shows until progress is loaded
  if (isLoading || progress === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
              Achievements
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your accomplishments, rewards, and progress in your learning journey
            </p>
          </div>
        </div>
        
        {/* Status Overview Panel */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Current Status</h2>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Level & XP */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-800">Current Level</h3>
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex items-end">
                  <span className="text-3xl font-bold text-blue-800">{progress?.level ?? 0}</span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-700">{progress?.currentXP ?? 0} XP</span>
                    <span className="text-blue-700">{progress?.nextLevelXP ?? 100} XP</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${((progress?.currentXP ?? 0) / (progress?.nextLevelXP || 100)) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    {(progress?.nextLevelXP ?? 100) - (progress?.currentXP ?? 0)} XP needed for next level
                  </p>
                </div>
              </div>
              
              {/* Financial Benefits */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-green-800">Financial Benefits</h3>
                  <Gift className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-end">
                  <span className="text-3xl font-bold text-green-800">${progress?.totalScholarshipAmount ?? 0}</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <Percent className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-700">{progress?.activeDiscounts ?? 0} Active Discounts</span>
                  </div>
                </div>
              </div>
              
              {/* Learning Progress */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-purple-800">Learning Progress</h3>
                  <BookOpen className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex items-end">
                  <span className="text-3xl font-bold text-purple-800">{progress?.completedCourses ?? 0}</span>
                  <span className="ml-1 text-purple-700 mb-1">Courses</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-sm text-purple-700">Completed with Excellence</span>
                  </div>
                </div>
              </div>
              
              {/* Community Impact */}
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-orange-800">Community Impact</h3>
                  <Users className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex items-end">
                  <span className="text-3xl font-bold text-orange-800">{progress?.forumContributions ?? 0}</span>
                  <span className="ml-1 text-orange-700 mb-1">Contributions</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-orange-600 mr-1" />
                    <span className="text-sm text-orange-700">{progress?.mentorshipHours ?? 0} Mentorship Hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Achievements Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
              >
                <Medal className="mr-2 h-5 w-5" />
                All Achievements
              </button>
              <button
                onClick={() => setActiveTab('learning')}
                className={`${activeTab === 'learning' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Learning
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`${activeTab === 'financial' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
              >
                <Gift className="mr-2 h-5 w-5" />
                Financial
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`${activeTab === 'community' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
              >
                <Users className="mr-2 h-5 w-5" />
                Community
              </button>
              <button
                onClick={() => setActiveTab('career')}
                className={`${activeTab === 'career' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
              >
                <Star className="mr-2 h-5 w-5" />
                Career
              </button>
            </nav>
          </div>
        </div>
        
        {/* Achievement Gallery */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{activeTab === 'all' ? 'All Achievements' : `${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)} Achievements`}</h2>
          </div>
          
          {filteredAchievements.length > 0 ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map(achievement => {
                // Different card designs based on achievement type
                if (achievement.category === 'financial') {
                  return (
                    <div key={achievement.id} className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-sm border border-green-200 overflow-hidden">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                            {achievement.type === 'scholarship' ? (
                              <Award className="h-6 w-6 text-green-600" />
                            ) : achievement.type === 'discount' ? (
                              <Percent className="h-6 w-6 text-green-600" />
                            ) : (
                              <Gift className="h-6 w-6 text-green-600" />
                            )}
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dt className="text-sm font-medium text-gray-700 truncate">{achievement.title}</dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-gray-900">
                                {achievement.type === 'scholarship' || achievement.type === 'referral' ? (
                                  `$${(achievement as FinancialAchievement).amount} ${(achievement as FinancialAchievement).currency}`
                                ) : achievement.type === 'discount' ? (
                                  `${(achievement as FinancialAchievement).discountPercent}% Off`
                                ) : null}
                              </div>
                            </dd>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          {achievement.category === 'financial' && (achievement as FinancialAchievement).validUntil && (
                            <p className="mt-2 text-xs text-gray-500">Valid until: {formatDate((achievement as FinancialAchievement).validUntil!)}</p>
                          )}
                          {achievement.category === 'financial' && (achievement as FinancialAchievement).applicableCourses && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Applicable for:</p>
                              <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                                {(achievement as FinancialAchievement).applicableCourses?.map((course: string, index: number) => (
                                  <li key={index}>{course}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                if (achievement.category === 'learning') {
                  return (
                    <div key={achievement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{achievement.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{achievement.description}</p>
                          {achievement.earnedAt && (
                            <p className="mt-2 text-xs text-gray-500">Earned on {formatDate(achievement.earnedAt)}</p>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0 h-16 w-16 relative">
                          {achievement.icon ? (
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                              <Trophy className="h-8 w-8 text-blue-500" />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-blue-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Default achievement card for other types
                return (
                  <div key={achievement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {achievement.category === 'community' ? (
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                              <Users className="h-6 w-6 text-orange-500" />
                            </div>
                          ) : achievement.category === 'career' ? (
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                              <Star className="h-6 w-6 text-purple-500" />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <Trophy className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{achievement.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{achievement.description}</p>
                          {achievement.earnedAt && (
                            <p className="mt-2 text-xs text-gray-500">Earned on {formatDate(achievement.earnedAt)}</p>
                          )}
                          {achievement.type === 'certification' && achievement.category === 'career' && (
                            <p className="mt-2 text-xs font-medium text-gray-700">Issued by: {(achievement as CareerAchievement).issuer}</p>
                          )}
                          {achievement.type === 'job' && achievement.category === 'career' && (
                            <p className="mt-2 text-xs font-medium text-gray-700">Position: {(achievement as CareerAchievement).position} at {(achievement as CareerAchievement).company}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Trophy className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No achievements yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start learning and complete courses to earn achievements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
