import { useState, useEffect } from 'react';

import axios from 'axios';

interface LearningPreferences {
  learningStyle: string;
  pacePreference: string;
  contentType: string[];
  difficultyLevel: string;
}

interface LearningPathData {
  preferences: LearningPreferences;
  aiRecommendations: {
    suggestedCourses: string[];
    learningPace: string;
    contentPreferences: string[];
    practiceAreas: string[];
  };
}

export default function LearningPathView() {

  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<LearningPreferences>({
    learningStyle: 'visual',
    pacePreference: 'moderate',
    contentType: ['video', 'interactive'],
    difficultyLevel: 'intermediate',
  });

  useEffect(() => {
    fetchLearningPath();
  }, []);

  const fetchLearningPath = async () => {
    try {
      interface LearningPathResponse {
        learningPath: LearningPathData;
      }
      
      const response = await axios.get<LearningPathResponse>('/api/learning-path');
      setLearningPath(response.data.learningPath);
    } catch (error) {
      console.error('Error fetching learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    try {
      setLoading(true);
      interface UpdatePreferencesResponse {
        learningPath: LearningPathData;
      }
      
      const response = await axios.post<UpdatePreferencesResponse>(
        '/api/learning-path',
        { preferences }
      );
      
      setLearningPath(response.data.learningPath);
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen min-w-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900 break-words">Your Learning Path</h2>
          <p className="mt-1 text-gray-600">
            Personalized recommendations based on your progress and preferences
          </p>
        </div>

        {/* Learning Preferences Form */}
        <div className="px-6 py-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 break-words">
            Learning Preferences
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 break-words">
                Learning Style
              </label>
              <select
                value={preferences.learningStyle}
                onChange={(e) =>
                  setPreferences({ ...preferences, learningStyle: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="visual">Visual</option>
                <option value="auditory">Auditory</option>
                <option value="reading">Reading</option>
                <option value="kinesthetic">Hands-on</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 break-words">
                Preferred Pace
              </label>
              <select
                value={preferences.pacePreference}
                onChange={(e) =>
                  setPreferences({ ...preferences, pacePreference: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="relaxed">Relaxed</option>
                <option value="moderate">Moderate</option>
                <option value="intensive">Intensive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 break-words">
                Difficulty Level
              </label>
              <select
                value={preferences.difficultyLevel}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    difficultyLevel: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <button
              onClick={updatePreferences}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 break-words"
            >
              Update Preferences
            </button>
          </div>
        </div>

        {/* AI Recommendations */}
        {learningPath?.aiRecommendations && (
          <div className="px-4 py-3 lg:px-6 lg:py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 break-words">
              Personalized Recommendations
            </h3>
            
            <div className="space-y-4 lg:space-y-6">
              {/* Suggested Courses */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 break-words">
                  Recommended Courses
                </h4>
                <div className="bg-gray-50 rounded-md p-4">
                  <ul className="space-y-2">
                    {learningPath.aiRecommendations.suggestedCourses.map(
                      (course, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-700 min-w-0"
                        >
                          <svg
                            className="w-4 h-4 mr-2 text-indigo-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {course}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              {/* Learning Pace */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 break-words">
                  Suggested Learning Pace
                </h4>
                <p className="bg-gray-50 rounded-md p-4 text-gray-700">
                  {learningPath.aiRecommendations.learningPace}
                </p>
              </div>

              {/* Practice Areas */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 break-words">
                  Recommended Practice Areas
                </h4>
                <div className="bg-gray-50 rounded-md p-4">
                  <ul className="space-y-2">
                    {learningPath.aiRecommendations.practiceAreas.map(
                      (area, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-700 min-w-0"
                        >
                          <svg
                            className="w-4 h-4 mr-2 text-indigo-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {area}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
