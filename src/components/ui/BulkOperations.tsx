"use client";

import { useState, useRef } from 'react';
import { 
  Upload, 
  Users, 
  FileSpreadsheet, 
  CheckSquare, 
  Mail, 
  GraduationCap,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Download,
  X
} from "lucide-react";
import toast from 'react-hot-toast';

interface BulkOperation {
  id: string;
  type: 'enrollment' | 'grades' | 'users' | 'emails' | 'certificates';
  title: string;
  description: string;
  icon: React.ReactNode;
  supportedFormats: string[];
  templateUrl?: string;
  maxFileSize: number; // in MB
}

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
  data?: any[];
}

interface BulkOperationsProps {
  className?: string;
  courseId?: string;
  userRole?: string;
  onOperationComplete?: (result: BulkOperationResult) => void;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  className = "",
  courseId,
  userRole,
  onOperationComplete
}: BulkOperationsProps) => {
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkOperations: BulkOperation[] = [
    {
      id: 'bulk_enrollment',
      type: 'enrollment',
      title: 'Bulk Student Enrollment',
      description: 'Enroll multiple students in courses using CSV/Excel files',
      icon: <Users className="h-5 w-5 text-blue-500" />,
      supportedFormats: ['.csv', '.xlsx', '.xls'],
      templateUrl: '/templates/bulk-enrollment-template.csv',
      maxFileSize: 10
    },
    {
      id: 'bulk_grades',
      type: 'grades',
      title: 'Bulk Grade Import/Export',
      description: 'Import or export student grades for assignments and projects',
      icon: <GraduationCap className="h-5 w-5 text-green-500" />,
      supportedFormats: ['.csv', '.xlsx', '.xls'],
      templateUrl: '/templates/bulk-grades-template.csv',
      maxFileSize: 5
    },
    {
      id: 'bulk_users',
      type: 'users',
      title: 'Bulk User Management',
      description: 'Create, update, or deactivate multiple user accounts',
      icon: <CheckSquare className="h-5 w-5 text-purple-500" />,
      supportedFormats: ['.csv', '.xlsx', '.xls'],
      templateUrl: '/templates/bulk-users-template.csv',
      maxFileSize: 15
    },
    {
      id: 'bulk_emails',
      type: 'emails',
      title: 'Bulk Email Notifications',
      description: 'Send personalized emails to multiple users or course participants',
      icon: <Mail className="h-5 w-5 text-orange-500" />,
      supportedFormats: ['.csv', '.xlsx', '.xls'],
      templateUrl: '/templates/bulk-emails-template.csv',
      maxFileSize: 5
    },
    {
      id: 'bulk_certificates',
      type: 'certificates',
      title: 'Bulk Certificate Generation',
      description: 'Generate and distribute certificates for course completions',
      icon: <FileSpreadsheet className="h-5 w-5 text-indigo-500" />,
      supportedFormats: ['.csv', '.xlsx', '.xls'],
      templateUrl: '/templates/bulk-certificates-template.csv',
      maxFileSize: 8
    }
  ];

  // Filter operations based on user role
  const availableOperations = bulkOperations.filter(op => {
    if (userRole === 'admin') return true;
    if (userRole === 'instructor') {
      return ['enrollment', 'grades', 'emails', 'certificates'].includes(op.type);
    }
    return false;
  });

  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    setResult(null);
    setShowModal(true);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedOperation) return;

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!selectedOperation.supportedFormats.includes(fileExtension)) {
      toast.error(`Unsupported file format. Please use: ${selectedOperation.supportedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > selectedOperation.maxFileSize) {
      toast.error(`File size exceeds ${selectedOperation.maxFileSize}MB limit`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', selectedOperation.type);
      if (courseId) formData.append('courseId', courseId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/bulk-operations', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result: BulkOperationResult = await response.json();
        setResult(result);
        onOperationComplete?.(result);
        
        if (result.success > 0) {
          toast.success(`Successfully processed ${result.success} records`);
        }
        if (result.failed > 0) {
          toast.error(`Failed to process ${result.failed} records`);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = async (templateUrl: string) => {
    try {
      const response = await fetch(templateUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = templateUrl.split('/').pop() || 'template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const exportData = async (operationType: string) => {
    try {
      const params = new URLSearchParams({
        type: operationType,
        ...(courseId && { courseId })
      });

      const response = await fetch(`/api/bulk-operations/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${operationType}-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Data exported successfully');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOperation(null);
    setResult(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Bulk Operations</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Perform bulk operations on students, grades, and course data
        </p>
      </div>

      {/* Operations Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableOperations.map((operation) => (
            <div
              key={operation.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleOperationSelect(operation)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {operation.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 break-words">
                    {operation.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 break-words">
                    {operation.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500">Formats:</span>
                    <div className="flex space-x-1">
                      {operation.supportedFormats.map((format) => (
                        <span
                          key={format}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                {selectedOperation.icon}
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedOperation.title}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                {selectedOperation.description}
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Download Template */}
                {selectedOperation.templateUrl && (
                  <button
                    onClick={() => downloadTemplate(selectedOperation.templateUrl!)}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </button>
                )}

                {/* Upload File */}
                <button
                  onClick={handleFileSelect}
                  disabled={isUploading}
                  className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>

                {/* Export Data */}
                <button
                  onClick={() => exportData(selectedOperation.type)}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </button>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">
                      Processing file... {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Operation Results
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Success: <span className="font-medium text-green-600">{result.success}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">
                        Failed: <span className="font-medium text-red-600">{result.failed}</span>
                      </span>
                    </div>
                  </div>

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-medium text-red-700 mb-2">Errors:</h5>
                      <div className="bg-red-50 border border-red-200 rounded p-2 max-h-32 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-600">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-yellow-700 mb-2">Warnings:</h5>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 max-h-32 overflow-y-auto">
                        {result.warnings.map((warning, index) => (
                          <p key={index} className="text-xs text-yellow-600">
                            {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Requirements */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  File Requirements
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Supported formats: {selectedOperation.supportedFormats.join(', ')}</li>
                  <li>• Maximum file size: {selectedOperation.maxFileSize}MB</li>
                  <li>• Use the provided template for best results</li>
                  <li>• Ensure all required fields are filled</li>
                  <li>• Remove any empty rows before uploading</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={selectedOperation?.supportedFormats.join(',')}
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default BulkOperations;
