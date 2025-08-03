import { PageLayout } from '../_components/PageLayout';
import { Download, Filter, Search } from 'lucide-react';

export default function MarksPage() {
  // Mock data - replace with real data
  const students = [
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', project1: 85, project2: 92, quiz1: 88, total: 88.3, grade: 'A' },
    { id: 2, name: 'Jordan Smith', email: 'jordan@example.com', project1: 78, project2: 85, quiz1: 82, total: 81.7, grade: 'B+' },
    { id: 3, name: 'Taylor Wilson', email: 'taylor@example.com', project1: 92, project2: 95, quiz1: 90, total: 92.3, grade: 'A' },
    { id: 4, name: 'Casey Kim', email: 'casey@example.com', project1: 65, project2: 70, quiz1: 68, total: 67.7, grade: 'D+' },
    { id: 5, name: 'Riley Chen', email: 'riley@example.com', project1: 88, project2: 85, quiz1: 90, total: 87.7, grade: 'B+' },
  ];

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
              <h4 className="font-medium text-gray-900 dark:text-white">Class Average: 84.2%</h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">5 students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '84.2%' }}></div>
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
