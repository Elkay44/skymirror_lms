import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch billing information for the current user
export async function GET() {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Billing is only available for students' }, { status: 403 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        subscription: true,
        paymentMethods: {
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Format subscription data
    const subscription = user.subscription ? {
      plan: user.subscription.plan,
      status: user.subscription.status,
      renewalDate: user.subscription.currentPeriodEnd.toISOString().split('T')[0],
      price: user.subscription.price,
      interval: user.subscription.interval
    } : null;
    
    // Format payment methods
    const paymentMethods = user.paymentMethods.map((pm: any) => ({
      id: pm.id,
      type: pm.type,
      brand: pm.brand,
      last4: pm.last4,
      expMonth: pm.expMonth,
      expYear: pm.expYear,
      isDefault: pm.isDefault,
      cardholderName: pm.cardholderName
    }));
    
    // Format billing history
    const billingHistory = user.invoices.map((invoice: any) => ({
      id: invoice.id,
      date: invoice.createdAt.toISOString().split('T')[0],
      amount: invoice.amount,
      description: invoice.description,
      status: invoice.status,
      invoice_url: invoice.invoiceUrl || '#',
      paymentMethod: invoice.paymentMethodId ? 'Card' : 'Unknown'
    }));
    
    const billingData = {
      subscription,
      paymentMethods,
      billingHistory
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
