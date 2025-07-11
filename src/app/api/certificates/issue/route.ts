import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import * as databaseService from '@/lib/blockchain/databaseService';

const prisma = new PrismaClient();

// POST /api/certificates/issue - Issue a new certificate
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only instructors can issue certificates
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { role: true }
    });
    
    if (user?.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Only instructors can issue certificates' }, { status: 403 });
    }
    
    const data = await req.json();
    const { studentId, courseId, expiresAt, privateKey } = data;
    
    if (!studentId || !courseId) {
      return NextResponse.json({ error: 'Student ID and course ID are required' }, { status: 400 });
    }
    
    // Check if the course exists and belongs to the instructor
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: session.user.id as string
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or you do not have permission' }, { status: 404 });
    }
    
    // Check if the student has a wallet address
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { walletAddress: true }
    });
    
    if (!student?.walletAddress) {
      return NextResponse.json({
        error: 'Student does not have a wallet address',
        needsWallet: true
      }, { status: 400 });
    }
    
    // Check eligibility and issue certificate
    const eligibility = await databaseService.isEligibleForCertification(studentId, courseId);
    
    if (!eligibility.eligible) {
      return NextResponse.json({
        error: 'Student is not eligible for certification',
        reason: eligibility.reason,
        missingProjects: eligibility.missingProjects
      }, { status: 400 });
    }
    
    // Get the private key from environment in production
    const certPrivateKey = privateKey || process.env.CERTIFICATE_PRIVATE_KEY;
    
    if (!certPrivateKey) {
      return NextResponse.json({ error: 'Certificate private key is required' }, { status: 400 });
    }
    
    // Issue the certificate
    const expirationDate = expiresAt ? new Date(expiresAt) : null;
    const certificate = await databaseService.issueCertificate({
      studentId,
      courseId,
      expiresAt: expirationDate,
      privateKey: certPrivateKey
    });
    
    return NextResponse.json({
      success: true,
      certificateId: certificate.id,
      tokenId: certificate.tokenId,
      txHash: certificate.txHash,
      verificationUrl: certificate.verificationUrl
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json({
      error: 'Failed to issue certificate',
      message: (error as Error).message
    }, { status: 500 });
  }
}
