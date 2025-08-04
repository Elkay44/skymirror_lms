import React from 'react';
import { BookOpen, Clock, Award, CheckCircle, BarChart } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  progress: number;
  completed: boolean;
  score: number | null;
}

interface Course {
  id: string;
  title: string;
  progress: number;
  lastActivity: string;
  instructor: string;
  grade: string;
  status: string;
  modules?: Module[];
  assignments?: any[];
}

interface CourseProgressSectionProps {
  courses: Course[];
}

const CourseProgressSection: React.FC<CourseProgressSectionProps> = ({ courses }) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Get the color class based on the progress percentage
  const getProgressColorClass = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-teal-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };
  
  if (!courses || courses.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">No Courses Enrolled</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          This mentee is not currently enrolled in any courses. When they enroll, you'll be able to track their progress here.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
          <div className="flex items-center min-w-0">
            <div className="p-2 bg-teal-100 rounded-lg mr-3 flex-shrink-0">
              <BookOpen className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 break-words">Enrolled Courses</p>
              <p className="text-xl font-semibold text-teal-700 break-words">{courses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center min-w-0">
            <div className="p-2 bg-green-100 rounded-lg mr-3 flex-shrink-0">
              <BarChart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 break-words">Avg. Progress</p>
              <p className="text-xl font-semibold text-green-700 break-words">
                {Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-center min-w-0">
            <div className="p-2 bg-purple-100 rounded-lg mr-3 flex-shrink-0">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 break-words">Avg. Grade</p>
              <p className="text-xl font-semibold text-purple-700 break-words">
                {courses.some(course => course.grade) ? 
                  courses.filter(course => course.grade).map(course => course.grade)[0] : 
                  'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg mr-3 flex-shrink-0">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 break-words">Last Activity</p>
              <p className="text-xl font-semibold text-blue-700 break-words">
                {formatDate(courses.sort((a, b) => 
                  new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
                )[0]?.lastActivity)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 lg:space-y-6">
        <h3 className="text-lg font-medium text-gray-900 break-words">Course Progress</h3>
        
        <div className="space-y-4 lg:space-y-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center min-w-0">
                <div className="flex items-center min-w-0">
                  <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="text-md font-medium text-gray-900 break-words">{course.title}</h4>
                </div>
                <div className="flex items-center min-w-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 min-w-0">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-sm text-gray-500 break-words">Instructor</p>
                    <p className="font-medium break-words">{course.instructor}</p>
                  </div>
                  <div className="mb-2 sm:mb-0">
                    <p className="text-sm text-gray-500 break-words">Last Activity</p>
                    <p className="font-medium break-words">{formatDate(course.lastActivity)}</p>
                  </div>
                  <div className="mb-2 sm:mb-0">
                    <p className="text-sm text-gray-500 break-words">Current Grade</p>
                    <p className="font-medium break-words">{course.grade || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700 break-words">Overall Progress</span>
                    <span className="text-sm font-medium text-teal-600 break-words">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getProgressColorClass(course.progress)}`}
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                {course.modules && course.modules.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3 break-words">Module Progress</h5>
                    <div className="space-y-4">
                      {course.modules.map((module) => (
                        <div key={module.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start min-w-0">
                            <div className="flex-shrink-0 mt-1 min-w-0">
                              {module.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <div className={`h-5 w-5 rounded-full border-2 ${module.progress > 0 ? 'border-teal-500' : 'border-gray-300'}`}></div>
                              )}
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex justify-between items-start min-w-0">
                                <h6 className="text-sm font-medium text-gray-900 break-words">{module.title}</h6>
                                <span className="text-xs font-medium text-gray-500 break-words">{module.progress}%</span>
                              </div>
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${getProgressColorClass(module.progress)}`}
                                  style={{ width: `${module.progress}%` }}
                                ></div>
                              </div>
                              {module.score !== null && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Score: <span className="font-medium break-words">{module.score}%</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseProgressSection;
