import React from 'react';
import { Target, Award, TrendingUp, Check, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number; // 0-100
  lastAssessed: string;
  recommendation?: string;
}

interface LearningPathSectionProps {
  learningPath: string;
  skills: Skill[];
}

const LearningPathSection: React.FC<LearningPathSectionProps> = ({ learningPath, skills }) => {
  // Group skills by category
  const skillsByCategory: Record<string, Skill[]> = {};
  skills.forEach(skill => {
    if (!skillsByCategory[skill.category]) {
      skillsByCategory[skill.category] = [];
    }
    skillsByCategory[skill.category].push(skill);
  });
  
  // Get proficiency level description
  const getProficiencyLevel = (proficiency: number) => {
    if (proficiency >= 90) return 'Expert';
    if (proficiency >= 75) return 'Advanced';
    if (proficiency >= 50) return 'Intermediate';
    if (proficiency >= 25) return 'Basic';
    return 'Beginner';
  };
  
  // Get color class based on proficiency
  const getProficiencyColorClass = (proficiency: number) => {
    if (proficiency >= 90) return 'bg-purple-500';
    if (proficiency >= 75) return 'bg-blue-500';
    if (proficiency >= 50) return 'bg-teal-500';
    if (proficiency >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-teal-50 border-b border-teal-100">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{learningPath} Path</h3>
              <p className="text-sm text-gray-500">
                Tracking progress along the {learningPath} learning journey
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Overall Path Progress</h4>
              <span className="text-sm font-medium text-teal-600">
                {skills.length > 0 ? 
                  Math.round(skills.reduce((sum, skill) => sum + skill.proficiency, 0) / skills.length) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-teal-500 h-2.5 rounded-full"
                style={{ 
                  width: skills.length > 0 ? 
                    `${Math.round(skills.reduce((sum, skill) => sum + skill.proficiency, 0) / skills.length)}%` : '0%' 
                }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Top Skill</p>
                  <p className="text-sm font-medium text-gray-900">
                    {skills.length > 0 ? 
                      skills.sort((a, b) => b.proficiency - a.proficiency)[0].name : 
                      'No skills assessed'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-full mr-3">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Growth Area</p>
                  <p className="text-sm font-medium text-gray-900">
                    {skills.length > 0 ? 
                      skills.sort((a, b) => a.proficiency - b.proficiency)[0].name : 
                      'No skills assessed'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-full mr-3">
                  <Check className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Skills Assessed</p>
                  <p className="text-sm font-medium text-gray-900">{skills.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {Object.keys(skillsByCategory).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category} className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">{category}</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {categorySkills.map((skill) => (
                      <div key={skill.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="mb-3 sm:mb-0">
                            <h5 className="text-sm font-medium text-gray-900">{skill.name}</h5>
                            <p className="text-xs text-gray-500 mt-1">
                              Last assessed: {formatDate(skill.lastAssessed)}
                            </p>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="mr-3">
                              <span 
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  skill.proficiency >= 75 ? 'bg-green-100 text-green-800' :
                                  skill.proficiency >= 50 ? 'bg-blue-100 text-blue-800' :
                                  skill.proficiency >= 25 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {getProficiencyLevel(skill.proficiency)}
                              </span>
                            </div>
                            
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getProficiencyColorClass(skill.proficiency)}`}
                                style={{ width: `${skill.proficiency}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs font-medium text-gray-700">{skill.proficiency}%</span>
                          </div>
                        </div>
                        
                        {skill.recommendation && (
                          <div className="mt-3 bg-white border border-gray-200 rounded-md p-3 text-xs text-gray-700">
                            <div className="flex">
                              <Info className="h-4 w-4 text-teal-500 flex-shrink-0 mr-2 mt-0.5" />
                              <p>{skill.recommendation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Skills Assessment</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                This mentee has not completed a skills assessment yet. Skills will appear here once assessed.
              </p>
              <button
                onClick={() => toast.success('Skills assessment feature coming soon!')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Request Skills Assessment
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900">Learning Recommendations</h3>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            {skills.some(skill => skill.proficiency < 50) ? (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Focus Areas</h4>
                <div className="space-y-3">
                  {skills
                    .filter(skill => skill.proficiency < 50)
                    .sort((a, b) => a.proficiency - b.proficiency)
                    .slice(0, 3)
                    .map(skill => (
                      <div key={`focus-${skill.id}`} className="flex items-start p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{skill.name} ({skill.proficiency}%)</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Recommend focusing on improving this skill to strengthen overall proficiency in {skill.category}.
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <p className="text-sm text-green-800">
                    This mentee is progressing well in all skill areas. Consider introducing advanced concepts.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => toast.success('Custom learning plan feature coming soon!')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Create Custom Learning Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathSection;
