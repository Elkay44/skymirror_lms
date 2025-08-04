"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Clock, 
  Download, 
  PlusCircle, 
  DollarSign, 
  TrendingUp,
  Wallet,
  BookOpen,
  Play
} from 'lucide-react';

type PaymentMethod = {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  cardholderName: string;
};

type RevenueItem = {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  courseId: string;
  courseName: string;
  studentCount: number;
  revenueType: string;
};

type PayoutHistory = {
  id: string;
  date: string;
  amount: number;
  status: string;
  method: string;
  reference: string;
};

export default function InstructorBillingSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Payment methods for receiving payouts
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'bank_1',
      type: 'bank_account',
      brand: 'Bank Transfer',
      last4: '5678',
      expMonth: 0,
      expYear: 0,
      isDefault: true,
      cardholderName: 'Jane Instructor'
    }
  ]);
  
  // Revenue from courses and content
  const [revenue, setRevenue] = useState<RevenueItem[]>([
    {
      id: 'rev_001',
      date: '2025-04-15',
      amount: 250.00,
      description: 'Course Sales Revenue',
      status: 'completed',
      courseId: 'course_1',
      courseName: 'Advanced React Development',
      studentCount: 5,
      revenueType: 'course_sale'
    },
    {
      id: 'rev_002',
      date: '2025-04-14',
      amount: 180.00,
      description: 'Course Sales Revenue',
      status: 'completed',
      courseId: 'course_2',
      courseName: 'JavaScript Fundamentals',
      studentCount: 3,
      revenueType: 'course_sale'
    },
    {
      id: 'rev_003',
      date: '2025-04-12',
      amount: 120.00,
      description: 'Course Sales Revenue',
      status: 'pending',
      courseId: 'course_3',
      courseName: 'Node.js Backend Development',
      studentCount: 2,
      revenueType: 'course_sale'
    },
    {
      id: 'rev_004',
      date: '2025-04-10',
      amount: 75.00,
      description: 'Subscription Revenue Share',
      status: 'completed',
      courseId: 'subscription',
      courseName: 'Premium Content Access',
      studentCount: 15,
      revenueType: 'subscription'
    }
  ]);
  
  // Payout history
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([
    {
      id: 'payout_001',
      date: '2025-04-01',
      amount: 850.00,
      status: 'completed',
      method: 'Bank Transfer',
      reference: 'TXN_002234'
    },
    {
      id: 'payout_002',
      date: '2025-03-01',
      amount: 720.00,
      status: 'completed',
      method: 'Bank Transfer',
      reference: 'TXN_002235'
    }
  ]);

  // Summary statistics
  const totalRevenue = revenue.reduce((sum, rev) => sum + rev.amount, 0);
  const pendingRevenue = revenue.filter(r => r.status === 'pending').reduce((sum, rev) => sum + rev.amount, 0);
  const completedRevenue = revenue.filter(r => r.status === 'completed').reduce((sum, rev) => sum + rev.amount, 0);
  const thisMonthRevenue = revenue.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((sum, rev) => sum + rev.amount, 0);
  const courseRevenue = revenue.filter(r => r.revenueType === 'course_sale').reduce((sum, rev) => sum + rev.amount, 0);
  const subscriptionRevenue = revenue.filter(r => r.revenueType === 'subscription').reduce((sum, rev) => sum + rev.amount, 0);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/billing/instructor');
        
        if (!response.ok) {
          throw new Error('Failed to fetch billing data');
        }
        
        const data = await response.json();
        
        // Update state with real API data
        if (data.payoutMethods) {
          setPaymentMethods(data.payoutMethods);
        }
        if (data.recentRevenue) {
          setRevenue(data.recentRevenue);
        }
        if (data.payoutHistory) {
          setPayoutHistory(data.payoutHistory);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
        toast.error('Failed to load billing data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchBillingData();
    }
  }, [session]);

  const handleAddPaymentMethod = async () => {
    toast.success('Payment method management coming soon!');
  };

  const handleRequestPayout = async () => {
    if (completedRevenue < 100) {
      toast.error('Minimum payout amount is $100');
      return;
    }
    toast.success('Payout request submitted successfully!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Available for Payout</p>
              <p className="text-2xl font-bold">${completedRevenue.toFixed(2)}</p>
            </div>
            <Wallet className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold">${pendingRevenue.toFixed(2)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">This Month</p>
              <p className="text-2xl font-bold">${thisMonthRevenue.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Course Sales</h3>
            <BookOpen className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-600">${courseRevenue.toFixed(2)}</div>
          <p className="text-sm text-gray-500 mt-1">Revenue from course purchases</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Subscription Share</h3>
            <Play className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-600">${subscriptionRevenue.toFixed(2)}</div>
          <p className="text-sm text-gray-500 mt-1">Revenue from premium subscriptions</p>
        </div>
      </div>

      {/* Payout Methods */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Payout Methods</h3>
              <p className="mt-1 text-sm text-gray-500">Manage how you receive your earnings</p>
            </div>
            <button
              onClick={handleAddPaymentMethod}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Method
            </button>
          </div>
        </div>
        
        <div className="px-6 py-5">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">{method.brand}</p>
                    {method.isDefault && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">•••• {method.last4}</p>
                  <p className="text-sm text-gray-500">{method.cardholderName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request Payout */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Request Payout</h3>
          <p className="mt-1 text-sm text-gray-500">Withdraw your available earnings (minimum $100)</p>
        </div>
        
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Available for payout</p>
              <p className="text-2xl font-bold text-purple-600">${completedRevenue.toFixed(2)}</p>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={completedRevenue < 100}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="mr-2 h-4 w-4" />
              Request Payout
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Revenue */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Revenue</h3>
          <p className="mt-1 text-sm text-gray-500">Your latest course and subscription earnings</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course/Content</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenue.map((rev) => (
                <tr key={rev.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rev.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rev.courseName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rev.revenueType === 'course_sale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {rev.revenueType === 'course_sale' ? 'Course Sale' : 'Subscription'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rev.studentCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${rev.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rev.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rev.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Payout History */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payout History</h3>
          <p className="mt-1 text-sm text-gray-500">Your previous payouts and transfers</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payoutHistory.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payout.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${payout.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payout.method}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payout.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
