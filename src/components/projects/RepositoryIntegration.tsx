"use client";

import { useState, useEffect } from 'react';

import { Github, GitBranch, GitPullRequest, Code, CheckCircle, XCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RepositoryIntegrationProps {
  projectId: string;
  currentRepoUrl?: string;
  onRepoConnected: (repoUrl: string) => void;
}

interface Repository {
  id: string;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  updated_at: string;
  language: string;
  default_branch: string;
  visibility: string;
}

export default function RepositoryIntegration({ 
  projectId, 
  currentRepoUrl, 
  onRepoConnected 
}: RepositoryIntegrationProps) {

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(currentRepoUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(!!currentRepoUrl);
  const [showRepoList, setShowRepoList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [provider, setProvider] = useState<'github' | 'gitlab'>('github');
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'unauthenticated' | 'checking'>('checking');
  
  useEffect(() => {
    // Check if user has connected GitHub/GitLab accounts
    const checkAuth = async () => {
      try {
        setAuthStatus('checking');
        const response = await fetch('/api/auth/repository-providers');
        
        if (!response.ok) {
          throw new Error('Failed to check repository provider authentication');
        }
        
        const data = await response.json();
        setAuthStatus(data.github || data.gitlab ? 'authenticated' : 'unauthenticated');
        
        // Set default provider based on what's authenticated
        if (data.github) {
          setProvider('github');
        } else if (data.gitlab) {
          setProvider('gitlab');
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setAuthStatus('unauthenticated');
      }
    };
    
    checkAuth();
  }, []);
  
  const fetchRepositories = async () => {
    if (authStatus !== 'authenticated') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/repositories?provider=${provider}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${provider} repositories`);
      }
      
      const data = await response.json();
      setRepositories(data.repositories || []);
      setShowRepoList(true);
    } catch (err: any) {
      setError(err.message || `An error occurred while fetching your ${provider} repositories`);
      console.error(`Error fetching ${provider} repositories:`, err);
    } finally {
      setLoading(false);
    }
  };
  
  const connectRepository = async () => {
    if (!selectedRepo) {
      setError('Please select a repository first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/connect-repository`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryUrl: selectedRepo,
          provider,
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect repository to project');
      }
      
      setConnected(true);
      setShowRepoList(false);
      onRepoConnected(selectedRepo);
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting the repository');
      console.error('Error connecting repository:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const disconnectRepository = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/disconnect-repository`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect repository from project');
      }
      
      setConnected(false);
      setSelectedRepo('');
      onRepoConnected('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while disconnecting the repository');
      console.error('Error disconnecting repository:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const authenticateProvider = () => {
    // Redirect to auth endpoint for selected provider
    window.location.href = `/api/auth/${provider}`;
  };
  
  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (authStatus === 'checking') {
    return (
      <div className="bg-gray-50 rounded-lg p-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Github className="h-5 w-5 mr-2 text-gray-700" />
          Repository Integration
        </h3>
        
        {connected && (
          <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full flex items-center">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Connected
          </span>
        )}
      </div>
      
      <div className="p-6">
        {authStatus === 'unauthenticated' ? (
          <div className="text-center p-4">
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h4 className="text-blue-800 font-medium mb-2">Connect Your Code Repository</h4>
              <p className="text-blue-700 text-sm mb-4">
                Link your GitHub or GitLab account to submit projects directly from your repositories.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => { setProvider('github'); authenticateProvider(); }}
                  className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  <Github className="h-5 w-5 mr-2" />
                  Connect GitHub
                </button>
                
                <button
                  onClick={() => { setProvider('gitlab'); authenticateProvider(); }}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"></path>
                  </svg>
                  Connect GitLab
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm">
              Connecting your repository allows instructors to review your code more effectively 
              and enables automated testing and deployment features.
            </p>
          </div>
        ) : connected ? (
          <div>
            <div className="flex items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <h4 className="font-medium text-gray-900">
                    {selectedRepo.split('/').slice(-2).join('/')}
                  </h4>
                </div>
                <a 
                  href={selectedRepo} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline flex items-center"
                >
                  {selectedRepo}
                  <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => { setShowRepoList(true); fetchRepositories(); }}
                    className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                    Change Repository
                  </button>
                  
                  <button
                    onClick={disconnectRepository}
                    className="text-sm px-3 py-1.5 border border-red-300 rounded-md text-red-700 hover:bg-red-50 flex items-center"
                    disabled={loading}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Disconnect
                  </button>
                </div>
              </div>
              
              <div className="flex-shrink-0 bg-gray-100 p-4 rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <GitPullRequest className="h-6 w-6 text-indigo-600 mb-2" />
                  <h5 className="font-medium text-gray-900 text-sm">Submit via Pull Requests</h5>
                  <p className="text-gray-600 text-xs mt-1">
                    Create a PR to automatically submit your project
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">Automatic Submissions</h4>
                  <p className="mt-1 text-blue-700">
                    When you push to the main branch or create a pull request, your project will be 
                    automatically submitted for review. Make sure your code is complete before pushing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : showRepoList ? (
          <div>
            <div className="flex items-center mb-4">
              <div className="relative flex-1 mr-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search repositories..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex-shrink-0">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'github' | 'gitlab')}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={loading}
                >
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                </select>
              </div>
              
              <button
                onClick={fetchRepositories}
                className="ml-2 flex-shrink-0 px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-100 h-16 rounded-md"></div>
                ))}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredRepositories.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredRepositories.map(repo => (
                      <motion.div 
                        key={repo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedRepo === repo.html_url ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                        onClick={() => setSelectedRepo(repo.html_url)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Github className="h-5 w-5 text-gray-700 mr-2" />
                            <span className="font-medium text-gray-900">{repo.name}</span>
                            
                            {repo.visibility === 'private' && (
                              <span className="ml-2 text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">
                                Private
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            {repo.language && (
                              <span className="flex items-center mr-3">
                                <Code className="h-4 w-4 mr-1" />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center">
                              <GitBranch className="h-4 w-4 mr-1" />
                              {repo.default_branch}
                            </span>
                          </div>
                        </div>
                        
                        {repo.description && (
                          <p className="mt-1 text-sm text-gray-600">{repo.description}</p>
                        )}
                        
                        <p className="mt-1 text-xs text-gray-500">
                          Updated {new Date(repo.updated_at).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No repositories match your search' : 'No repositories found'}
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowRepoList(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                onClick={connectRepository}
                disabled={!selectedRepo || loading}
                className={`px-4 py-2 rounded-md text-white ${!selectedRepo || loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? 'Connecting...' : 'Connect Repository'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <Github className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h4 className="text-blue-800 font-medium mb-2">Connect Your Code Repository</h4>
              <p className="text-blue-700 text-sm mb-4">
                Link your GitHub or GitLab repository to this project for easier submissions and code reviews.
              </p>
              
              <button
                onClick={fetchRepositories}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Select Repository
              </button>
            </div>
            
            <p className="text-gray-600 text-sm">
              Connecting your repository allows instructors to review your code more effectively 
              and enables automated testing and deployment features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
