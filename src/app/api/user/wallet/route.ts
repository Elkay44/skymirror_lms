import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/user/wallet - Get user wallet information
export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        walletAddress: true,
        role: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      walletAddress: user.walletAddress,
      hasWallet: !!user.walletAddress,
      role: user.role
    });
  } catch (error) {
    console.error('Error fetching wallet information:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet information' }, { status: 500 });
  }
}

// POST /api/user/wallet - Update user wallet information
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const { walletAddress } = await req.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }
    
    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid Ethereum wallet address' }, { status: 400 });
    }
    
    // Check if the wallet is already associated with another account
    const existingUser = await prisma.user.findFirst({
      where: {
        walletAddress,
        id: { not: userId }
      }
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'This wallet address is already associated with another account' 
      }, { status: 400 });
    }
    
    // Update the user's wallet address
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress },
      select: { 
        walletAddress: true,
        role: true,
      }
    });
    
    return NextResponse.json({
      success: true,
      walletAddress: updatedUser.walletAddress,
      hasWallet: true,
      role: updatedUser.role
    });
  } catch (error) {
    console.error('Error updating wallet information:', error);
    return NextResponse.json({ error: 'Failed to update wallet information' }, { status: 500 });
  }
}
