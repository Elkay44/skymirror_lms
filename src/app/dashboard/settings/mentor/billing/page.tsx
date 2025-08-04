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
  Wallet
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

type EarningsItem = {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  menteeId: string;
  menteeName: string;
  sessionType: string;
};

type PayoutHistory = {
  id: string;
  date: string;
  amount: number;
  status: string;
  method: string;
  reference: string;
};

export default function MentorBillingSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Payment methods for receiving payouts
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'bank_1',
      type: 'bank_account',
      brand: 'Bank Transfer',
      last4: '1234',
      expMonth: 0,
      expYear: 0,
      isDefault: true,
      cardholderName: 'John Mentor'
    }
  ]);
  
  // Earnings from mentoring sessions
  const [earnings, setEarnings] = useState<EarningsItem[]>([
    {
      id: 'earn_001',
      date: '2025-04-15',
      amount: 75.00,
      description: 'JavaScript Mentoring Session',
      status: 'completed',
      menteeId: 'mentee_1',
      menteeName: 'Alice Johnson',
      sessionType: '1-hour session'
    },
    {
      id: 'earn_002',
      date: '2025-04-14',
      amount: 150.00,
      description: 'React Development Consultation',
      status: 'completed',
      menteeId: 'mentee_2',
      menteeName: 'Bob Smith',
      sessionType: '2-hour session'
    },
    {
      id: 'earn_003',
      date: '2025-04-12',
      amount: 75.00,
      description: 'Career Guidance Session',
      status: 'pending',
      menteeId: 'mentee_3',
      menteeName: 'Carol Davis',
      sessionType: '1-hour session'
    }
  ]);
  
  // Payout history
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([
    {
      id: 'payout_001',
      date: '2025-04-01',
      amount: 450.00,
      status: 'completed',
      method: 'Bank Transfer',
      reference: 'TXN_001234'
    },
    {
      id: 'payout_002',
      date: '2025-03-01',
      amount: 380.00,
      status: 'completed',
      method: 'Bank Transfer',
      reference: 'TXN_001235'
    }
  ]);

  // Summary statistics
  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);
  const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, earning) => sum + earning.amount, 0);
  const completedEarnings = earnings.filter(e => e.status === 'completed').reduce((sum, earning) => sum + earning.amount, 0);
  const thisMonthEarnings = earnings.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, earning) => sum + earning.amount, 0);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/billing/mentor');
        
        if (!response.ok) {
          throw new Error('Failed to fetch billing data');
        }
        
        const data = await response.json();
        
        // Update state with real API data
        if (data.payoutMethods) {
          setPaymentMethods(data.payoutMethods);
        }
        if (data.recentEarnings) {
          setEarnings(data.recentEarnings);
        }
        if (data.payoutHistory) {
          setPayoutHistory(data.payoutHistory);
        }
        
        // Update earnings totals if available
        if (data.earnings) {
          // Update any earnings-related state if needed
          console.log('Earnings data:', data.earnings);
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
    if (completedEarnings < 50) {
      toast.error('Minimum payout amount is $50');
      return;
    }
    toast.success('Payout request submitted successfully!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-teal-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Total Earnings</p>
              <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-teal-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Available for Payout</p>
              <p className="text-2xl font-bold">${completedEarnings.toFixed(2)}</p>
            </div>
            <Wallet className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">This Month</p>
              <p className="text-2xl font-bold">${thisMonthEarnings.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
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
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
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
          <p className="mt-1 text-sm text-gray-500">Withdraw your available earnings (minimum $50)</p>
        </div>
        
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Available for payout</p>
              <p className="text-2xl font-bold text-teal-600">${completedEarnings.toFixed(2)}</p>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={completedEarnings < 50}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="mr-2 h-4 w-4" />
              Request Payout
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Earnings */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Earnings</h3>
          <p className="mt-1 text-sm text-gray-500">Your latest mentoring session earnings</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {earnings.map((earning) => (
                <tr key={earning.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{earning.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{earning.menteeName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{earning.sessionType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${earning.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      earning.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {earning.status}
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
