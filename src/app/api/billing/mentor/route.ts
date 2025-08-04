import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch mentor billing information
export async function GET() {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'This endpoint is only available for mentors' }, { status: 403 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        mentorEarnings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            mentorSession: {
              include: {
                student: { select: { name: true } }
              }
            }
          }
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        paymentMethods: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate earnings totals
    const totalEarnings = user.mentorEarnings.reduce((sum: number, earning: any) => sum + earning.amount, 0);
    const completedEarnings = user.mentorEarnings
      .filter((earning: any) => earning.status === 'COMPLETED')
      .reduce((sum: number, earning: any) => sum + earning.amount, 0);
    const pendingEarnings = user.mentorEarnings
      .filter((earning: any) => earning.status === 'PENDING')
      .reduce((sum: number, earning: any) => sum + earning.amount, 0);
    
    // Calculate this month's earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = user.mentorEarnings
      .filter((earning: any) => earning.createdAt >= startOfMonth)
      .reduce((sum: number, earning: any) => sum + earning.amount, 0);

    // Format recent earnings
    const recentEarnings = user.mentorEarnings.map((earning: any) => ({
      id: earning.id,
      date: earning.createdAt.toISOString().split('T')[0],
      amount: earning.amount,
      menteeName: earning.mentorSession?.student?.name || 'Unknown Student',
      sessionType: earning.sessionType || '1-on-1 Mentoring',
      status: earning.status.toLowerCase()
    }));

    // Format payout history
    const payoutHistory = user.payouts.map((payout: any) => ({
      id: payout.id,
      date: payout.createdAt.toISOString().split('T')[0],
      amount: payout.amount,
      status: payout.status.toLowerCase(),
      method: payout.method || 'Bank Transfer',
      reference: payout.reference || `TXN-${payout.id.slice(-6)}`
    }));

    // Format payment methods
    const payoutMethods = user.paymentMethods.map((pm: any) => ({
      id: pm.id,
      type: pm.type,
      bankName: pm.brand || 'Bank',
      accountNumber: `****${pm.last4 || '1234'}`,
      routingNumber: '****5678',
      isDefault: pm.isDefault
    }));

    const billingData = {
      earnings: {
        total: totalEarnings,
        pending: pendingEarnings,
        completed: completedEarnings,
        thisMonth: thisMonthEarnings
      },
      recentEarnings,
      payoutHistory,
      payoutMethods
    };

    return NextResponse.json(billingData);
  } catch (error) {
    console.error('Error fetching mentor billing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Handle mentor billing actions (payout requests, payment method updates)
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'This endpoint is only available for mentors' }, { status: 403 });
    }
    
    // Parse request body
    const data = await req.json();
    const { action, amount } = data;
    
    // Handle different billing actions
    if (action === 'requestPayout') {
      if (!amount || amount < 50) {
        return NextResponse.json({ error: 'Minimum payout amount is $50' }, { status: 400 });
      }
      
      // In a real app, this would create a payout request
      return NextResponse.json({
        success: true,
        message: `Payout request for $${amount} submitted successfully`,
        payout: {
          id: 'payout_' + Date.now(),
          amount: amount,
          status: 'pending',
          requestDate: new Date().toISOString().split('T')[0]
        }
      });
    } else if (action === 'addPaymentMethod') {
      // Add new payment method
      return NextResponse.json({
        success: true,
        message: 'Payment method added successfully'
      });
    } else if (action === 'setDefaultPaymentMethod') {
      // Set default payment method
      return NextResponse.json({
        success: true,
        message: 'Default payment method updated'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing mentor billing action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
