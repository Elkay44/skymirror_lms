"use client";

import { useState, useEffect } from 'react';
import { Mail, Bell, Settings, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface NotificationPreference {
  id: string;
  type: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  category: 'academic' | 'billing' | 'social' | 'system';
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  variables: string[];
  isActive: boolean;
}

interface EmailNotificationsProps {
  className?: string;
  showTemplates?: boolean;
  showPreferences?: boolean;
  showTestEmail?: boolean;
}

const EmailNotifications: React.FC<EmailNotificationsProps> = ({
  className = "",
  showTemplates = true,
  showPreferences = true,
  showTestEmail = true
}) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preferences' | 'templates' | 'test'>('preferences');
  const [testEmail, setTestEmail] = useState('');
  const [testTemplate, setTestTemplate] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const { data: session } = useSession();

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const fetchNotificationData = async () => {
    setIsLoading(true);
    try {
      const [preferencesRes, templatesRes] = await Promise.all([
        fetch('/api/notifications/preferences'),
        fetch('/api/notifications/templates')
      ]);

      if (preferencesRes.ok) {
        const preferencesData = await preferencesRes.json();
        setPreferences(preferencesData.preferences || defaultPreferences);
      } else {
        setPreferences(defaultPreferences);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || defaultTemplates);
      } else {
        setTemplates(defaultTemplates);
      }
    } catch (error) {
      console.error('Error fetching notification data:', error);
      setPreferences(defaultPreferences);
      setTemplates(defaultTemplates);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultPreferences: NotificationPreference[] = [
    {
      id: 'course_enrollment',
      type: 'course_enrollment',
      label: 'Course Enrollment',
      description: 'When you enroll in a new course',
      email: true,
      push: true,
      sms: false,
      category: 'academic'
    },
    {
      id: 'assignment_due',
      type: 'assignment_due',
      label: 'Assignment Due',
      description: 'Reminders for upcoming assignment deadlines',
      email: true,
      push: true,
      sms: false,
      category: 'academic'
    },
    {
      id: 'grade_posted',
      type: 'grade_posted',
      label: 'Grade Posted',
      description: 'When grades are posted for assignments or projects',
      email: true,
      push: true,
      sms: false,
      category: 'academic'
    },
    {
      id: 'new_message',
      type: 'new_message',
      label: 'New Message',
      description: 'When you receive a new message',
      email: false,
      push: true,
      sms: false,
      category: 'social'
    },
    {
      id: 'mentorship_request',
      type: 'mentorship_request',
      label: 'Mentorship Request',
      description: 'When someone requests mentorship or responds to your request',
      email: true,
      push: true,
      sms: false,
      category: 'social'
    },
    {
      id: 'payment_due',
      type: 'payment_due',
      label: 'Payment Due',
      description: 'Billing and payment reminders',
      email: true,
      push: false,
      sms: true,
      category: 'billing'
    },
    {
      id: 'system_maintenance',
      type: 'system_maintenance',
      label: 'System Maintenance',
      description: 'Important system updates and maintenance notices',
      email: true,
      push: false,
      sms: false,
      category: 'system'
    }
  ];

  const defaultTemplates: EmailTemplate[] = [
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to SkyMirror LMS, {{firstName}}!',
      type: 'user_registration',
      variables: ['firstName', 'lastName', 'email', 'courseName'],
      isActive: true
    },
    {
      id: 'course_enrollment',
      name: 'Course Enrollment Confirmation',
      subject: 'You\'re enrolled in {{courseName}}',
      type: 'course_enrollment',
      variables: ['firstName', 'courseName', 'instructorName', 'startDate'],
      isActive: true
    },
    {
      id: 'assignment_reminder',
      name: 'Assignment Due Reminder',
      subject: 'Assignment "{{assignmentName}}" is due soon',
      type: 'assignment_due',
      variables: ['firstName', 'assignmentName', 'courseName', 'dueDate'],
      isActive: true
    },
    {
      id: 'grade_notification',
      name: 'Grade Posted Notification',
      subject: 'Your grade for {{assignmentName}} is available',
      type: 'grade_posted',
      variables: ['firstName', 'assignmentName', 'courseName', 'grade', 'feedback'],
      isActive: true
    }
  ];

  const updatePreference = async (preferenceId: string, field: 'email' | 'push' | 'sms', value: boolean) => {
    const updatedPreferences = preferences.map(pref =>
      pref.id === preferenceId ? { ...pref, [field]: value } : pref
    );
    setPreferences(updatedPreferences);

    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updatedPreferences })
      });
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
      // Revert on error
      fetchNotificationData();
    }
  };

  const toggleTemplate = async (templateId: string) => {
    const updatedTemplates = templates.map(template =>
      template.id === templateId ? { ...template, isActive: !template.isActive } : template
    );
    setTemplates(updatedTemplates);

    try {
      await fetch('/api/notifications/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: updatedTemplates })
      });
      toast.success('Template updated');
    } catch (error) {
      toast.error('Failed to update template');
      fetchNotificationData();
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testTemplate) {
      toast.error('Please enter email and select template');
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          templateId: testTemplate
        })
      });

      if (response.ok) {
        toast.success('Test email sent successfully');
        setTestEmail('');
        setTestTemplate('');
      } else {
        toast.error('Failed to send test email');
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <Bell className="h-4 w-4 text-blue-500" />;
      case 'billing': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'social': return <Mail className="h-4 w-4 text-green-500" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading notification settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Manage your email notification preferences and templates
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {showPreferences && (
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preferences
            </button>
          )}
          {showTemplates && (
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates
            </button>
          )}
          {showTestEmail && (
            <button
              onClick={() => setActiveTab('test')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test Email
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {Object.entries(groupedPreferences).map(([category, categoryPrefs]) => (
              <div key={category}>
                <div className="flex items-center space-x-2 mb-4">
                  {getCategoryIcon(category)}
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {categoryPrefs.map((preference) => (
                    <div key={preference.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {preference.label}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {preference.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-6 ml-4">
                          {/* Email Toggle */}
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <button
                              onClick={() => updatePreference(preference.id, 'email', !preference.email)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                preference.email ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  preference.email ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                          
                          {/* Push Toggle */}
                          <div className="flex items-center space-x-2">
                            <Bell className="h-4 w-4 text-gray-400" />
                            <button
                              onClick={() => updatePreference(preference.id, 'push', !preference.push)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                preference.push ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  preference.push ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {template.name}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Subject: {template.subject}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500">Variables:</span>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleTemplate(template.id)}
                    className={`ml-4 inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      template.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {template.isActive ? (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Enable
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Test Email Tab */}
        {activeTab === 'test' && (
          <div className="max-w-md">
            <div className="space-y-4">
              <div>
                <label htmlFor="test-email" className="block text-sm font-medium text-gray-700">
                  Test Email Address
                </label>
                <input
                  type="email"
                  id="test-email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder={session?.user?.email || "Enter email address"}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="test-template" className="block text-sm font-medium text-gray-700">
                  Email Template
                </label>
                <select
                  id="test-template"
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a template</option>
                  {templates.filter(t => t.isActive).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={sendTestEmail}
                disabled={!testEmail || !testTemplate || isSendingTest}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailNotifications;
