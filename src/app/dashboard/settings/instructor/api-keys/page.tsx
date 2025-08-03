"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { PlusCircle, Copy, Eye, EyeOff, Clock, AlertTriangle } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  permissions: string[];
  status: 'active' | 'expired' | 'revoked';
}

export default function InstructorApiKeysSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read:courses']);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const permissionOptions = [
    { value: 'read:courses', label: 'Read Courses', description: 'View your course data' },
    { value: 'write:courses', label: 'Write Courses', description: 'Create and update your courses' },
    { value: 'read:students', label: 'Read Students', description: 'View your students data' },
    { value: 'read:analytics', label: 'Read Analytics', description: 'View your course analytics' },
    { value: 'read:forums', label: 'Read Forums', description: 'Access forum data for your courses' },
    { value: 'write:forums', label: 'Write Forums', description: 'Post and manage forums in your courses' },
  ];

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/apikeys');
        
        if (!response.ok) {
          throw new Error('Failed to fetch API keys');
        }
        
        const data = await response.json();
        setApiKeys(data.apiKeys);
      } catch (error) {
        console.error('Error fetching API keys:', error);
        toast.error('Failed to load API keys');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchApiKeys();
    }
  }, [session]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleShowKey = (keyId: string) => {
    if (showKeyId === keyId) {
      setShowKeyId(null);
    } else {
      setShowKeyId(keyId);
    }
  };

  const copyKeyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const revokeKey = async (keyId: string) => {
    try {
      const response = await fetch('/api/apikeys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: keyId,
          action: 'revoke'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' as const } : key
      ));
      toast.success('API key revoked successfully');
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const handlePermissionChange = (permission: string) => {
    if (newKeyPermissions.includes(permission)) {
      setNewKeyPermissions(prev => prev.filter(p => p !== permission));
    } else {
      setNewKeyPermissions(prev => [...prev, permission]);
    }
  };

  const createNewKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    if (newKeyPermissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create API key');
      }
      
      const apiKey = await response.json();
      
      // Set the new key value to show in the UI
      setNewKeyValue(apiKey.apiKey.key);
      
      // Add the new key to the list
      setApiKeys(prev => [apiKey.apiKey, ...prev]);
      setNewKeyName('');
      setNewKeyPermissions(['read:courses']);
      toast.success('New API key created');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const closeNewKeyModal = () => {
    setNewKeyValue(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>

      
      {/* API Key Info */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              API keys provide full access to your account. Keep them secure and never share them in public repositories or client-side code.
            </p>
          </div>
        </div>
      </div>
      
      {/* Create New Key */}
      {!newKeyValue && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Create New API Key</h3>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div>
              <label htmlFor="key-name" className="block text-sm font-medium text-gray-700">Key Name</label>
              <input
                type="text"
                id="key-name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Course Builder Integration"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="space-y-2">
                {permissionOptions.map(permission => (
                  <div key={permission.value} className="flex items-center">
                    <input
                      id={permission.value}
                      type="checkbox"
                      checked={newKeyPermissions.includes(permission.value)}
                      onChange={() => handlePermissionChange(permission.value)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor={permission.value} className="ml-2 block text-sm text-gray-900">
                      {permission.label} <span className="text-xs text-gray-500">({permission.description})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-3">
              <button
                onClick={createNewKey}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create API Key
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* New Key Modal */}
      {newKeyValue && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-5 border-b border-purple-200">
            <h3 className="text-lg font-medium text-purple-900">Your New API Key</h3>
          </div>
          
          <div className="px-4 py-5 space-y-4">
            <div className="bg-white p-3 rounded-md border border-purple-200 break-all font-mono text-sm">
              {newKeyValue}
            </div>
            
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-sm text-gray-700 font-medium">
                This key will only be displayed once. Please copy it and store it securely.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => copyKeyToClipboard(newKeyValue)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Key
              </button>
              
              <button
                onClick={closeNewKeyModal}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                I've Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* API Keys List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your API Keys</h3>
          <p className="mt-1 text-sm text-gray-500">Manage your existing API keys</p>
        </div>
        
        <div>
          {apiKeys.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-gray-500 text-sm">You don't have any API keys yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {apiKeys.map((apiKey) => (
                <li key={apiKey.id} className="px-4 py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 flex items-center">
                        {apiKey.name}
                        {apiKey.status !== 'active' && (
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apiKey.status === 'expired' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'} capitalize`}>
                            {apiKey.status}
                          </span>
                        )}
                      </h4>
                      
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Clock className="mr-1 h-4 w-4 text-gray-400" />
                        Created {formatDate(apiKey.createdAt)}
                        {apiKey.expiresAt && (
                          <span className="ml-2">
                            · Expires {formatDate(apiKey.expiresAt)}
                          </span>
                        )}
                      </div>
                      
                      {apiKey.lastUsed && (
                        <p className="mt-1 text-sm text-gray-500">
                          Last used {formatDate(apiKey.lastUsed)}
                        </p>
                      )}
                      
                      <div className="mt-2">
                        {apiKey.permissions.map(permission => (
                          <span key={permission} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-1 mb-1">
                            {permission}
                          </span>
                        ))}
                      </div>
                      
                      {apiKey.status === 'active' && (
                        <div className="mt-3 flex items-center">
                          <div className="relative flex-grow">
                            <input 
                              type={showKeyId === apiKey.id ? 'text' : 'password'} 
                              value={apiKey.key} 
                              readOnly 
                              className="pr-10 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm text-sm font-mono focus:ring-purple-500 focus:border-purple-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <button 
                                onClick={() => toggleShowKey(apiKey.id)}
                                className="text-gray-400 hover:text-gray-500"
                              >
                                {showKeyId === apiKey.id ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => copyKeyToClipboard(apiKey.key)}
                            className="ml-2 inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {apiKey.status === 'active' && (
                      <button
                        onClick={() => revokeKey(apiKey.id)}
                        className="ml-4 text-sm text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
