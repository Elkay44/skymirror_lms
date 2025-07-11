import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import * as databaseService from '@/lib/blockchain/databaseService';

const prisma = new PrismaClient();

// GET /api/certificates - Get all certificates for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    
    // Get all certificates for the user
    const certificates = await prisma.certification.findMany({
      where: { studentId: userId },
      include: {
        course: {
          select: {
            title: true,
            imageUrl: true,
            instructor: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        submissions: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
    
    // Format certificates for the frontend
    const formattedCertificates = certificates.map((cert) => ({
      id: cert.id,
      title: cert.title,
      description: cert.description,
      courseId: cert.courseId,
      courseName: cert.course.title,
      courseImage: cert.course.imageUrl,
      instructorName: cert.course.instructor.name,
      instructorImage: cert.course.instructor.image,
      issueDate: cert.issuedAt.toISOString(),
      expiryDate: cert.expiresAt?.toISOString(),
      credentialId: cert.tokenId || cert.verificationCode || cert.id,
      verificationUrl: cert.verificationUrl || `/verify/${cert.id}`,
      blockchain: {
        tokenId: cert.tokenId,
        contractAddress: cert.contractAddress,
        txHash: cert.txHash,
        ipfsUrl: cert.ipfsMetadataUrl,
      },
      status: cert.isRevoked ? 'revoked' : (cert.expiresAt && cert.expiresAt < new Date() ? 'expired' : 'active'),
      projects: cert.submissions.map(sub => ({
        id: sub.projectId,
        title: sub.project.title,
        completedAt: sub.reviewedAt?.toISOString(),
        grade: sub.grade
      }))
    }));
    
    return NextResponse.json(formattedCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
