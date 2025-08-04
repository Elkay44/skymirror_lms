"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Clock, 
  Download, 
  PlusCircle, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  Trash2
} from 'lucide-react';
import Link from 'next/link';

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

type BillingHistoryItem = {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  invoice_url: string;
  paymentMethod: string;
};

type Subscription = {
  plan: string;
  status: string;
  renewalDate: string;
  price: number;
  interval: string;
  startDate: string;
  nextBillingAmount: number;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  recommended: boolean;
  popular: boolean;
};

export default function StudentBillingSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  // Available plans data
  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 19.99,
      interval: 'monthly',
      features: [
        'Access to basic courses',
        'Limited assessments',
        'Community forum access',
        'Email support'
      ],
      recommended: false,
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 49.99,
      interval: 'monthly',
      features: [
        'Access to all courses',
        'Unlimited assessments',
        'Priority support',
        'Course certificates',
        'Download course materials'
      ],
      recommended: true,
      popular: true
    },
    {
      id: 'annual',
      name: 'Annual Plan',
      price: 499.99,
      interval: 'yearly',
      features: [
        'All Premium features',
        '2 months free',
        'Exclusive webinars',
        'One-on-one mentoring session',
        'Early access to new courses'
      ],
      recommended: false,
      popular: false
    }
  ];
  
  // Billing settings
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'card_1',
      type: 'credit_card',
      brand: 'Visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2026,
      isDefault: true,
      cardholderName: 'Alex Johnson'
    },
    {
      id: 'card_2',
      type: 'credit_card',
      brand: 'Mastercard',
      last4: '8888',
      expMonth: 9,
      expYear: 2025,
      isDefault: false,
      cardholderName: 'Alex Johnson'
    }
  ]);
  
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([
    {
      id: 'inv_001',
      date: '2025-04-15',
      amount: 49.99,
      description: 'Premium Subscription - Monthly',
      status: 'paid',
      invoice_url: '#',
      paymentMethod: 'Visa •••• 4242'
    },
    {
      id: 'inv_002',
      date: '2025-03-15',
      amount: 49.99,
      description: 'Premium Subscription - Monthly',
      status: 'paid',
      invoice_url: '#',
      paymentMethod: 'Visa •••• 4242'
    },
    {
      id: 'inv_003',
      date: '2025-02-15',
      amount: 149.99,
      description: 'Advanced Python Course',
      status: 'paid',
      invoice_url: '#',
      paymentMethod: 'Mastercard •••• 8888'
    }
  ]);
  
  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'premium',
    status: 'active',
    renewalDate: '2025-06-15',
    price: 49.99,
    interval: 'monthly',
    startDate: '2024-12-15',
    nextBillingAmount: 49.99
  });

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/billing');
        
        if (!response.ok) {
          throw new Error('Failed to fetch billing data');
        }
        
        const data = await response.json();
        setSubscription(data.subscription);
        setPaymentMethods(data.paymentMethods);
        setBillingHistory(data.billingHistory);
      } catch (error) {
        console.error('Error fetching billing data:', error);
        toast.error('Failed to load billing information');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchBillingData();
    }
  }, [session]);

  const handleRemovePaymentMethod = async (id: string) => {
    if (paymentMethods.length === 1) {
      toast.error('You must have at least one payment method');
      return;
    }
    
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removePaymentMethod',
          paymentMethodId: id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove payment method');
      }
      
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
      toast.success('Payment method removed');
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method');
    }
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatePaymentMethod',
          paymentMethodId: id,
          isDefault: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment method');
      }
      
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === id
        }))
      );
      toast.success('Default payment method updated');
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
    }
  };

  const handleChangePlan = async (plan: string) => {
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'changePlan',
          planId: plan
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to change plan');
      }
      
      const data = await response.json();
      setSubscription(data.subscription);
      toast.success('Subscription plan updated');
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to update subscription plan');
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      // In a real app, this would open a modal with a form to add a new payment method
      // After adding in the modal, we would call the API to save the new payment method
      const mockNewCard: PaymentMethod = {
        id: `card_${Math.random().toString(36).substring(2, 8)}`,
        type: 'credit_card',
        brand: 'Visa',
        last4: '1234',
        expMonth: 12,
        expYear: 2028,
        isDefault: false,
        cardholderName: 'Alex Johnson'
      };
      
      setPaymentMethods(prev => [...prev, mockNewCard]);
      toast.success('New payment method added');
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 min-w-0">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex justify-end mb-6 min-w-0">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-sm text-gray-500 break-words">Need help?</span>
          <Link 
            href="/dashboard/support" 
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center break-words min-w-0"
          >
            Contact Support
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
      
      {/* Current Subscription */}
      <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center min-w-0">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 min-w-0">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 break-words">Current Subscription</h3>
                <p className="text-sm text-gray-500 mt-0.5 break-words">Manage your plan and billing preferences</p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 break-words min-w-0">
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Active
            </span>
          </div>
          
          <div className="mt-8 bg-white rounded-lg border border-blue-100 overflow-hidden overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
              <div className="flex items-center justify-between min-w-0">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase break-words">
                    {subscription.interval}
                  </span>
                  <h4 className="mt-1 text-lg font-semibold text-gray-900 capitalize break-words">{subscription.plan} Plan</h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900 break-words">${subscription?.price ? subscription.price.toFixed(2) : '0.00'}</span>
                  <span className="text-gray-500 text-sm break-words">/{subscription.interval}</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 divide-y divide-gray-100">
              <div className="py-3 flex items-center justify-between min-w-0">
                <div className="flex items-center min-w-0">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700 break-words">Started on</span>
                </div>
                <span className="text-sm font-medium text-gray-900 break-words">{subscription.startDate}</span>
              </div>
              
              <div className="py-3 flex items-center justify-between min-w-0">
                <div className="flex items-center min-w-0">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700 break-words">Next billing date</span>
                </div>
                <span className="text-sm font-medium text-gray-900 break-words">{subscription.renewalDate}</span>
              </div>
              
              <div className="py-3 flex items-center justify-between min-w-0">
                <div className="flex items-center min-w-0">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700 break-words">Next billing amount</span>
                </div>
                <span className="text-sm font-medium text-gray-900 break-words">${subscription?.nextBillingAmount ? subscription.nextBillingAmount.toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Available Plans */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 break-words">Available Plans</h3>
          <p className="mt-1 text-sm text-gray-500 break-words">Choose the plan that works best for you</p>
        </div>
        
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`border rounded-xl overflow-hidden transition-all ${
                  plan.recommended ? 'border-blue-300 shadow-md ring-1 ring-blue-300' : 
                  'border-gray-200 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                {plan.recommended && (
                  <div className="bg-blue-500 text-white px-4 py-1 text-center text-xs font-medium break-words">
                    RECOMMENDED
                  </div>
                )}
                {plan.popular && (
                  <div className="bg-green-500 text-white px-4 py-1 text-center text-xs font-medium break-words">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="px-5 py-5">
                  <h4 className="text-lg font-medium text-gray-900 break-words">{plan.name}</h4>
                  <div className="mt-2 flex items-baseline min-w-0">
                    <span className="text-2xl font-semibold text-gray-900 break-words">${plan?.price ? plan.price.toFixed(2) : '0.00'}</span>
                    <span className="ml-1 text-gray-500 text-sm break-words">/{plan.interval}</span>
                  </div>
                  
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start min-w-0">
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0 min-w-0" />
                        <span className="text-sm text-gray-600 break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-5">
                    <button
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={plan.id === subscription.plan}
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        plan.id === subscription.plan ? 
                        'border-blue-300 text-blue-700 bg-blue-50 cursor-default' : 
                        'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {plan.id === subscription.plan ? (
                        <>Current Plan</>
                      ) : (
                        <>Switch to {plan.name}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between min-w-0">
            <div>
              <h3 className="text-lg font-medium text-gray-900 break-words">Payment Methods</h3>
              <p className="mt-1 text-sm text-gray-500 break-words">Manage your payment options</p>
            </div>
            <button
              onClick={handleAddPaymentMethod}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 break-words min-w-0"
            >
              <PlusCircle className="mr-2 h-4 w-4 text-gray-500" />
              Add Payment Method
            </button>
          </div>
        </div>
        
        <div className="px-6 py-5 divide-y divide-gray-200">
          {paymentMethods.map((method) => (
            <div key={method.id} className="py-4 flex flex-wrap md:flex-nowrap items-center justify-between min-w-0">
              <div className="flex items-center min-w-0">
                <div className="h-12 w-16 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center mr-4 min-w-0">
                  {method.brand === 'Visa' && <span className="font-bold text-blue-700 break-words">VISA</span>}
                  {method.brand === 'Mastercard' && <span className="font-bold text-red-600 break-words">MC</span>}
                  {method.brand === 'Amex' && <span className="font-bold text-blue-500 break-words">AMEX</span>}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 break-words">{method.brand} •••• {method.last4}</p>
                  <p className="text-xs text-gray-500">Expires {method.expMonth}/{method.expYear}</p>
                  <p className="text-xs text-gray-500">{method.cardholderName}</p>
                  {method.isDefault && (
                    <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 break-words min-w-0">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-3 mt-3 md:mt-0 min-w-0">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center break-words min-w-0"
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Set as default
                  </button>
                )}
                <button
                  onClick={() => handleRemovePaymentMethod(method.id)}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center break-words min-w-0"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 break-words">Billing History</h3>
          <p className="mt-1 text-sm text-gray-500 break-words">View and download your previous invoices</p>
        </div>
        
        <div className="px-6 py-5">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">Payment Method</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider break-words">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingHistory.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 break-words">{invoice.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 break-words">{invoice.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 break-words">{invoice.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 break-words">${invoice?.amount ? invoice.amount.toFixed(2) : '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize break-words min-w-0">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium break-words">
                      <a href={invoice.invoice_url} className="text-blue-600 hover:text-blue-900 inline-flex items-center min-w-0">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
