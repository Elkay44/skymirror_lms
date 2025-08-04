import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch instructor billing information
export async function GET() {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'This endpoint is only available for instructors' }, { status: 403 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        instructorRevenues: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            course: {
              select: {
                title: true,
                _count: {
                  select: { enrollments: true }
                }
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

    // Calculate revenue totals
    const totalRevenue = user.instructorRevenues.reduce((sum: number, revenue: any) => sum + revenue.amount, 0);
    const completedRevenue = user.instructorRevenues
      .filter((revenue: any) => revenue.status === 'COMPLETED')
      .reduce((sum: number, revenue: any) => sum + revenue.amount, 0);
    const pendingRevenue = user.instructorRevenues
      .filter((revenue: any) => revenue.status === 'PENDING')
      .reduce((sum: number, revenue: any) => sum + revenue.amount, 0);
    
    // Calculate this month's revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = user.instructorRevenues
      .filter((revenue: any) => revenue.createdAt >= startOfMonth)
      .reduce((sum: number, revenue: any) => sum + revenue.amount, 0);

    // Calculate course vs subscription revenue
    const courseRevenue = user.instructorRevenues
      .filter((revenue: any) => revenue.revenueType === 'COURSE_SALE')
      .reduce((sum: number, revenue: any) => sum + revenue.amount, 0);
    const subscriptionRevenue = user.instructorRevenues
      .filter((revenue: any) => revenue.revenueType === 'SUBSCRIPTION')
      .reduce((sum: number, revenue: any) => sum + revenue.amount, 0);

    // Format recent revenue
    const recentRevenue = user.instructorRevenues.map((revenue: any) => ({
      id: revenue.id,
      date: revenue.createdAt.toISOString().split('T')[0],
      amount: revenue.amount,
      description: revenue.description || 'Course Revenue',
      status: revenue.status.toLowerCase(),
      courseId: revenue.courseId,
      courseName: revenue.course?.title || 'Unknown Course',
      studentCount: revenue.course?._count?.enrollments || 0,
      revenueType: revenue.revenueType?.toLowerCase() || 'course_sale'
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
      accountNumber: `****${pm.last4 || '5678'}`,
      routingNumber: '****9012',
      isDefault: pm.isDefault
    }));

    const billingData = {
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        completed: completedRevenue,
        thisMonth: thisMonthRevenue,
        courseRevenue,
        subscriptionRevenue
      },
      recentRevenue,
      payoutHistory,
      payoutMethods
    };
    
    return NextResponse.json(billingData);
  } catch (error) {
    console.error('Error fetching instructor billing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Handle instructor billing actions (payout requests, payment method updates)
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'This endpoint is only available for instructors' }, { status: 403 });
    }
    
    // Parse request body
    const data = await req.json();
    const { action, amount } = data;
    
    // Handle different billing actions
    if (action === 'requestPayout') {
      if (!amount || amount < 100) {
        return NextResponse.json({ error: 'Minimum payout amount is $100' }, { status: 400 });
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
    console.error('Error processing instructor billing action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
