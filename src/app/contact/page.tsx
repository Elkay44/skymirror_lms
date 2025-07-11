"use client";

import { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    role: 'student',
    category: 'general'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to submit form');
      // }
      
      // Simulate API delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        role: 'student',
        category: 'general'
      });
      
      setIsSuccess(true);
    } catch (err) {
      setError('There was an error submitting your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            <MessageSquare className="inline-block mr-2 h-8 w-8" />
            Contact Us
          </h1>
          <p className="mt-3 max-w-md mx-auto text-lg text-white opacity-90 sm:text-xl md:mt-5 md:max-w-3xl">
            Get in touch with our team for support, questions, or feedback
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Contact Information */}
          <div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
              </div>
              <div className="px-6 py-5 space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-500">support@skymirror.academy</p>
                    <p className="text-gray-500 mt-1">For general inquiries: info@skymirror.academy</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-gray-500">+1 (555) 123-4567</p>
                    <p className="text-gray-500 mt-1">Monday-Friday, 9AM-5PM EST</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-gray-500">123 Learning Lane, Suite 456</p>
                    <p className="text-gray-500">San Francisco, CA 94105, USA</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Support Resources</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <a 
                    href="/help" 
                    className="group flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Visit our Help Center
                  </a>
                </div>
                <div>
                  <a 
                    href="/legal/terms-of-service" 
                    className="group flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Terms of Service
                  </a>
                </div>
                <div>
                  <a 
                    href="/legal/privacy-policy" 
                    className="group flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="mt-8 lg:mt-0 lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Send us a message</h2>
              </div>
              
              {isSuccess ? (
                <div className="px-6 py-8 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-gray-900">Thank you for reaching out!</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    We've received your message and will get back to you as soon as possible, usually within 24-48 hours.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setIsSuccess(false)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          I am a
                        </label>
                        <div className="mt-1">
                          <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="mentor">Mentor</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                          Category
                        </label>
                        <div className="mt-1">
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="general">General Inquiry</option>
                            <option value="technical">Technical Support</option>
                            <option value="billing">Billing & Payments</option>
                            <option value="course">Course Content</option>
                            <option value="feedback">Feedback & Suggestions</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                          Subject
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="subject"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                          Message
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="message"
                            name="message"
                            rows={6}
                            required
                            value={formData.message}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" /> Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* FAQ section */}
        <div className="mt-12">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h2>
            </div>
            <div className="px-6 py-5">
              <dl className="space-y-8">
                <div>
                  <dt className="text-base font-medium text-gray-900">What is the typical response time for support inquiries?</dt>
                  <dd className="mt-2 text-sm text-gray-500">
                    We strive to respond to all inquiries within 24-48 business hours. Technical issues and urgent matters are given priority.
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-gray-900">How can I report a technical issue with a course?</dt>
                  <dd className="mt-2 text-sm text-gray-500">
                    You can report technical issues using this contact form and selecting "Technical Support" as the category. 
                    Please include details such as your device, browser, and steps to reproduce the issue.
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-gray-900">I'm interested in becoming an instructor. Who should I contact?</dt>
                  <dd className="mt-2 text-sm text-gray-500">
                    Please use this contact form and select "Other" as the category and mention "Instructor Application" in the subject. 
                    You can also email us directly at instructors@skymirror.academy.
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-gray-900">How do I request a refund for a course?</dt>
                  <dd className="mt-2 text-sm text-gray-500">
                    Refund requests should be submitted through this form by selecting "Billing & Payments" as the category. 
                    Please include your order number and reason for the refund request. Remember that our refund policy allows for 
                    refunds within 14 days of purchase if less than 30% of the course content has been accessed.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
