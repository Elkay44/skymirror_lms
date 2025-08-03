import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: Fetch billing information for the current user
export async function GET() {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In a real application, this would fetch from a database
    // For now, we'll return mock data based on the user's role
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Billing is only available for students' }, { status: 403 });
    }
    
    // Mock data for student billing
    const billingData = {
      subscription: {
        plan: 'premium',
        status: 'active',
        renewalDate: '2025-06-15',
        price: 49.99,
        interval: 'monthly'
      },
      paymentMethods: [
        {
          id: 'card_1',
          type: 'credit_card',
          brand: 'Visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2026,
          isDefault: true,
        }
      ],
      billingHistory: [
        {
          id: 'inv_001',
          date: '2025-04-15',
          amount: 49.99,
          description: 'Premium Subscription - Monthly',
          status: 'paid',
          invoice_url: '#'
        },
        {
          id: 'inv_002',
          date: '2025-03-15',
          amount: 49.99,
          description: 'Premium Subscription - Monthly',
          status: 'paid',
          invoice_url: '#'
        },
        {
          id: 'inv_003',
          date: '2025-02-15',
          amount: 149.99,
          description: 'Advanced Python Course',
          status: 'paid',
          invoice_url: '#'
        }
      ]
    };
    
    return NextResponse.json(billingData);
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Update billing information (e.g., change subscription plan)
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Billing is only available for students' }, { status: 403 });
    }
    
    // Parse request body
    const data = await req.json();
    const { action, planId } = data;
    
    // Handle different billing actions
    if (action === 'changePlan') {
      // In a real app, this would update the subscription in a payment processor like Stripe
      return NextResponse.json({
        success: true,
        message: `Subscription plan changed to ${planId}`,
        subscription: {
          plan: planId,
          status: 'active',
          renewalDate: '2025-07-15', // Example: one month later
          price: planId === 'premium' ? 49.99 : planId === 'basic' ? 19.99 : 99.99,
          interval: 'monthly'
        }
      });
    } else if (action === 'updatePaymentMethod') {
      // Update default payment method
      return NextResponse.json({
        success: true,
        message: 'Payment method updated successfully'
      });
    } else if (action === 'cancelSubscription') {
      // Cancel subscription
      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
        subscription: {
          plan: 'premium',
          status: 'cancelled',
          renewalDate: null,
          price: 49.99,
          interval: 'monthly'
        }
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating billing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
