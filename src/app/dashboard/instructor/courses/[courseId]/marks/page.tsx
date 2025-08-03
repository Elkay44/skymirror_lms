'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '../_components/PageLayout';
import { Download, Filter, Search, Loader2 } from 'lucide-react';

interface StudentGrade {
  id: string;
  name: string;
  email: string;
  project1?: number;
  project2?: number;
  quiz1?: number;
  total: number;
  grade: string;
}

export default function MarksPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classAverage, setClassAverage] = useState(0);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/instructor/courses/${courseId}/marks`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch marks');
        }
        
        const data = await response.json();
        setStudents(data.students || []);
        setClassAverage(data.classAverage || 0);
      } catch (err) {
        console.error('Error fetching marks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load marks');
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarks();
  }, [courseId]);

  if (isLoading) {
    return (
      <PageLayout
        title="Loading Marks..."
        description="Please wait while we load student grades"
        backHref="/dashboard/instructor/courses"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Error Loading Marks"
        description={error}
        backHref="/dashboard/instructor/courses"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </PageLayout>
    );
  }

  const gradeScale = [
    { grade: 'A', range: '90-100', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
    { grade: 'B+', range: '85-89', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
    { grade: 'B', range: '80-84', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
    { grade: 'C+', range: '75-79', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
    { grade: 'C', range: '70-74', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
    { grade: 'D+', range: '65-69', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
    { grade: 'D', range: '60-64', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
    { grade: 'F', range: '0-59', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
  ];

  return (
    <PageLayout
      title="Marks & Grades"
      description="View and manage student grades"
      backHref="/dashboard/instructor/courses"
      actions={
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      }
    >
      <div className="p-6">
        {/* Grade Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {gradeScale.map((item) => (
              <div key={item.grade} className={`text-center py-2 px-3 rounded-md ${item.color}`}>
                <div className="text-xl font-semibold">{item.grade}</div>
                <div className="text-xs">{item.range}%</div>
              </div>
            ))}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Class Average: {classAverage.toFixed(1)}%</h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">{students.length} students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${classAverage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Student Grades Table */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 sm:mb-0">Student Grades</h3>
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search students..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Project 1
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Project 2
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quiz 1
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-medium">
                          {student.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {student.project1}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {student.project2}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {student.quiz1}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {student.total}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.grade.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        student.grade.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                        student.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                      }`}>
                        {student.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
