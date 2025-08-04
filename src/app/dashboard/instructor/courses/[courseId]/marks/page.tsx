'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '../_components/PageLayout';
import { Download, Filter, Search, Loader2, BarChart3, TrendingUp, Users, BookOpen, ChevronDown, ChevronUp, FileText, FileSpreadsheet } from 'lucide-react';

// Interface matching our fixed API response
interface StudentMark {
  studentId: string;
  studentName: string;
  studentEmail: string;
  projects: Array<{
    id: string;
    title: string;
    grade: number | null;
    maxScore: number;
    submittedAt: Date | null;
    gradedAt: Date | null;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    score: number | null;
    maxScore: number;
    completedAt: Date | null;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    grade: number | null;
    maxScore: number;
    submittedAt: Date | null;
    gradedAt: Date | null;
  }>;
  totalScore: number;
  averageGrade: number;
  letterGrade: string;
}

interface MarksApiResponse {
  success: boolean;
  students: StudentMark[];
  classAnalytics: {
    totalStudents: number;
    averageGrade: number;
    gradeDistribution: {
      'A': number;
      'B': number;
      'C': number;
      'D': number;
      'F': number;
    };
    assessmentCategories: Array<{
      name: string;
      weight: number;
      averageScore?: number;
      totalAssessments?: number;
      completedAssessments?: number;
    }>;
    topPerformers: Array<{
      studentId: string;
      studentName: string;
      overallGrade: number;
      letterGrade?: string;
    }>;
    strugglingStudents: Array<{
      studentId: string;
      studentName: string;
      overallGrade: number;
      letterGrade?: string;
      issuesCount?: number;
    }>;
  };
  courseInfo: {
    courseId: string;
    courseName: string;
    totalEnrollments: number;
    lastUpdated: Date;
  };
  error?: string;
}

export default function MarksPage() {
  const params = useParams() as { courseId: string };
  const courseId = params.courseId;
  
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classAnalytics, setClassAnalytics] = useState<MarksApiResponse['classAnalytics'] | null>(null);
  const [courseInfo, setCourseInfo] = useState<MarksApiResponse['courseInfo'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'grade'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMarks = async () => {
      if (!courseId) {
        setError('Course ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${courseId}/marks`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }
        
        const data: MarksApiResponse = await response.json();
        
        if (data.success) {
          setStudents(data.students || []);
          setClassAnalytics(data.classAnalytics);
          setCourseInfo(data.courseInfo);
        } else {
          throw new Error(data.error || 'Failed to fetch marks');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load marks';
        console.error('Error fetching marks:', errorMsg);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarks();
  }, [courseId]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(student => 
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        const comparison = a.studentName.localeCompare(b.studentName);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = a.averageGrade - b.averageGrade;
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });

  // Get all unique assignments, quizzes, and projects for column headers
  const allAssignments = Array.from(
    new Set(students.flatMap(s => s.assignments.map(a => ({ id: a.id, title: a.title, maxScore: a.maxScore }))))
  );
  const allQuizzes = Array.from(
    new Set(students.flatMap(s => s.quizzes.map(q => ({ id: q.id, title: q.title, maxScore: q.maxScore }))))
  );
  const allProjects = Array.from(
    new Set(students.flatMap(s => s.projects.map(p => ({ id: p.id, title: p.title, maxScore: p.maxScore }))))
  );

  const handleSort = (field: 'name' | 'grade') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'Student Name',
      'Email',
      ...allAssignments.map(a => `${a.title} (/${a.maxScore})`),
      ...allQuizzes.map(q => `${q.title} (/${q.maxScore})`),
      ...allProjects.map(p => `${p.title} (/${p.maxScore})`),
      'Total Score (%)',
      'Letter Grade'
    ];

    const csvData = filteredAndSortedStudents.map(student => [
      student.studentName,
      student.studentEmail,
      ...allAssignments.map(assignment => {
        const studentAssignment = student.assignments.find(a => a.id === assignment.id);
        return studentAssignment?.grade ?? '';
      }),
      ...allQuizzes.map(quiz => {
        const studentQuiz = student.quizzes.find(q => q.id === quiz.id);
        return studentQuiz?.score ?? '';
      }),
      ...allProjects.map(project => {
        const studentProject = student.projects.find(p => p.id === project.id);
        return studentProject?.grade ?? '';
      }),
      student.averageGrade,
      student.letterGrade
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${courseInfo?.courseName || 'Course'}_Marks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const exportToPDF = () => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${courseInfo?.courseName || 'Course'} - Marks Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .course-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .grade-a { background-color: #d4edda; }
            .grade-b { background-color: #cce7ff; }
            .grade-c { background-color: #fff3cd; }
            .grade-d, .grade-f { background-color: #f8d7da; }
            .analytics { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #333; }
            .stat-label { font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${courseInfo?.courseName || 'Course'} - Marks Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="analytics">
            <div class="stat">
              <div class="stat-value">${classAnalytics?.totalStudents || 0}</div>
              <div class="stat-label">Total Students</div>
            </div>
            <div class="stat">
              <div class="stat-value">${classAnalytics?.averageGrade.toFixed(1) || 0}%</div>
              <div class="stat-label">Class Average</div>
            </div>
            <div class="stat">
              <div class="stat-value">${(classAnalytics?.gradeDistribution.A || 0) + (classAnalytics?.gradeDistribution.B || 0)}</div>
              <div class="stat-label">A & B Grades</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                ${allAssignments.map(a => `<th>${a.title}<br/>(/${a.maxScore})</th>`).join('')}
                ${allQuizzes.map(q => `<th>${q.title}<br/>(/${q.maxScore})</th>`).join('')}
                ${allProjects.map(p => `<th>${p.title}<br/>(/${p.maxScore})</th>`).join('')}
                <th>Total (%)</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAndSortedStudents.map(student => `
                <tr>
                  <td>${student.studentName}</td>
                  <td>${student.studentEmail}</td>
                  ${allAssignments.map(assignment => {
                    const studentAssignment = student.assignments.find(a => a.id === assignment.id);
                    const grade = studentAssignment?.grade ?? '';
                    return `<td>${grade}</td>`;
                  }).join('')}
                  ${allQuizzes.map(quiz => {
                    const studentQuiz = student.quizzes.find(q => q.id === quiz.id);
                    const score = studentQuiz?.score ?? '';
                    return `<td>${score}</td>`;
                  }).join('')}
                  ${allProjects.map(project => {
                    const studentProject = student.projects.find(p => p.id === project.id);
                    const grade = studentProject?.grade ?? '';
                    return `<td>${grade}</td>`;
                  }).join('')}
                  <td>${student.averageGrade}%</td>
                  <td class="grade-${student.letterGrade.toLowerCase()}">${student.letterGrade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    
    setShowExportDropdown(false);
  };

  if (isLoading) {
    return (
      <PageLayout 
        title="Marks" 
        backHref={`/dashboard/instructor/courses/${courseId}`}
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading marks...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout 
        title="Marks" 
        backHref={`/dashboard/instructor/courses/${courseId}`}
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error Loading Marks
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Marks" 
      description={`${courseInfo?.courseName || 'Course'} • ${classAnalytics?.totalStudents || 0} students`}
      backHref={`/dashboard/instructor/courses/${courseId}`}
    >
      <div className="space-y-8">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredAndSortedStudents.length} of {students.length} students
              </div>
              <div className="flex items-center space-x-3">
                {/* Export Dropdown */}
                <div className="relative" ref={exportDropdownRef}>
                  <button 
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                  
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <div className="py-1">
                        <button
                          onClick={exportToCSV}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-3 text-green-500" />
                          Export as CSV
                        </button>
                        <button
                          onClick={exportToPDF}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                          <FileText className="h-4 w-4 mr-3 text-red-500" />
                          Export as PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Class Analytics */}
          {classAnalytics && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {classAnalytics.totalStudents}
                      </p>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Students</p>
                    </div>
                    <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                      <Users className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {classAnalytics.averageGrade.toFixed(1)}%
                      </p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Class Average</p>
                    </div>
                    <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-green-700 dark:text-green-300" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {classAnalytics.gradeDistribution.A + classAnalytics.gradeDistribution.B}
                      </p>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">A & B Grades</p>
                    </div>
                    <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {classAnalytics.assessmentCategories.reduce((sum, cat) => sum + (cat.totalAssessments || 0), 0)}
                      </p>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Assessments</p>
                    </div>
                    <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                      <BookOpen className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border-0 bg-gray-50 dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 text-sm font-medium dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Student
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  
                  {/* Assignment Columns */}
                  {allAssignments.map(assignment => (
                    <th key={assignment.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="truncate max-w-24" title={assignment.title}>
                        {assignment.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        /{assignment.maxScore}
                      </div>
                    </th>
                  ))}
                  
                  {/* Quiz Columns */}
                  {allQuizzes.map(quiz => (
                    <th key={quiz.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="truncate max-w-24" title={quiz.title}>
                        {quiz.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        /{quiz.maxScore}
                      </div>
                    </th>
                  ))}
                  
                  {/* Project Columns */}
                  {allProjects.map(project => (
                    <th key={project.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="truncate max-w-24" title={project.title}>
                        {project.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        /{project.maxScore}
                      </div>
                    </th>
                  ))}
                  
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('grade')}
                  >
                    <div className="flex items-center justify-center">
                      Total
                      {sortBy === 'grade' && (
                        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedStudents.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-medium">
                          {student.studentName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.studentName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {student.studentEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Assignment Grades */}
                    {allAssignments.map(assignment => {
                      const studentAssignment = student.assignments.find(a => a.id === assignment.id);
                      const grade = studentAssignment?.grade ?? null;
                      const percentage = grade !== null && assignment.maxScore > 0 
                        ? Math.round((grade / assignment.maxScore) * 100) 
                        : null;
                      
                      return (
                        <td key={assignment.id} className="px-3 py-4 text-center text-sm">
                          {grade !== null ? (
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {grade}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {percentage}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    {/* Quiz Scores */}
                    {allQuizzes.map(quiz => {
                      const studentQuiz = student.quizzes.find(q => q.id === quiz.id);
                      const score = studentQuiz?.score ?? null;
                      const percentage = score !== null && quiz.maxScore > 0 
                        ? Math.round((score / quiz.maxScore) * 100) 
                        : null;
                      
                      return (
                        <td key={quiz.id} className="px-3 py-4 text-center text-sm">
                          {score !== null ? (
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {score}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {percentage}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    {/* Project Scores */}
                    {allProjects.map(project => {
                      const studentProject = student.projects.find(p => p.id === project.id);
                      const grade = studentProject?.grade ?? null;
                      const percentage = grade !== null && project.maxScore > 0 
                        ? Math.round((grade / project.maxScore) * 100) 
                        : null;
                      
                      return (
                        <td key={project.id} className="px-3 py-4 text-center text-sm">
                          {grade !== null ? (
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {grade}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {percentage}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    {/* Total Score */}
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {student.averageGrade}%
                    </td>
                    
                    {/* Letter Grade */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm border ${
                        student.letterGrade.startsWith('A') ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-300 dark:border-green-700' :
                        student.letterGrade.startsWith('B') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-300 dark:border-blue-700' :
                        student.letterGrade.startsWith('C') ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:text-yellow-300 dark:border-yellow-700' :
                        'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 dark:from-red-900/20 dark:to-rose-900/20 dark:text-red-300 dark:border-red-700'
                      }`}>
                        {student.letterGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedStudents.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No students found' : 'No students enrolled'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {searchTerm ? 'Try adjusting your search terms to find the students you\'re looking for.' : 'Students will appear here once they enroll in this course.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
