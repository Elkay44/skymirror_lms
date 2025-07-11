import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Accredible API configuration
const ACCREDIBLE_API_KEY = process.env.ACCREDIBLE_API_KEY;
const ACCREDIBLE_GROUP_ID = process.env.ACCREDIBLE_GROUP_ID;

interface CertificateData {
  enrollmentId: string;
  userId: string;
  courseId: string;
  completedAt: Date;
}

interface CertificateWithRelations {
  id: string;
  enrollmentId: string;
  userId: string;
  issuedAt: Date;
  courseTitle: string;
  tokenId: string | null;
  ipfsHash: string | null;
  blockchainTxId: string | null;
  blockchainUrl: string | null;
  verificationUrl: string | null;
  enrollment: {
    user: {
      name: string | null;
      email: string;
    };
    course: {
      title: string;
    };
  };
  user: {
    name: string | null;
    email: string;
  };
}

async function createBlockchainCertificate(data: CertificateData) {
  try {
    const response = await fetch('https://api.accredible.com/v1/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token token=${ACCREDIBLE_API_KEY}`,
      },
      body: JSON.stringify({
        credential: {
          group_id: ACCREDIBLE_GROUP_ID,
          recipient: {
            name: data.userId,
            email: data.userId,
          },
          custom_attributes: {
            course_id: data.courseId,
            completion_date: data.completedAt.toISOString(),
          },
        },
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating blockchain certificate:', error);
    throw error;
  }
}

async function sendCertificateEmail(email: string, name: string, courseTitle: string, certificateUrl: string) {
  try {
    if (!resend) {
      console.warn('Resend API key not configured, skipping email');
      return;
    }
    await resend.emails.send({
      from: 'Skymirror Learning <noreply@skymirror.com>',
      to: email,
      subject: `Congratulations! You've completed ${courseTitle}`,
      html: `
        <h1>Congratulations, ${name}!</h1>
        <p>You've successfully completed ${courseTitle}!</p>
        <p>Your certificate is ready to view and download:</p>
        <p><a href="${certificateUrl}">View Your Certificate</a></p>
        <p>This certificate has been verified and can be shared with employers and on your LinkedIn profile.</p>
      `
    });
  } catch (error) {
    console.error('Error sending certificate email:', error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { enrollmentId } = body;

    // Get enrollment details
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        course: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { enrollmentId },
      include: {
        user: true,
        enrollment: {
          include: {
            course: true
          }
        }
      }
    }) as CertificateWithRelations | null;

    if (existingCertificate) {
      return NextResponse.json(
        { error: 'Certificate already issued' },
        { status: 400 }
      );
    }

    // Create blockchain certificate
    const blockchainData = await createBlockchainCertificate({
      enrollmentId,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      completedAt: new Date(),
    });

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        enrollmentId,
        userId: enrollment.userId,
        courseTitle: enrollment.course.title,
        blockchainUrl: blockchainData.credential.url,
        blockchainTxId: blockchainData.credential.transaction_id,
        tokenId: blockchainData.credential.token_id,
        ipfsHash: blockchainData.credential.ipfs_hash,
        verificationUrl: blockchainData.credential.verification_url,
      },
    });

    // Update enrollment status
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Send certificate email
    if (enrollment.user?.email && certificate.blockchainUrl) {
      await sendCertificateEmail(
        enrollment.user.email,
        enrollment.user.name || 'Student',
        enrollment.course.title,
        certificate.blockchainUrl
      );
    }

    return NextResponse.json({
      message: 'Certificate issued successfully',
      certificateId: certificate.id,
      certificateUrl: certificate.blockchainUrl,
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Webhook endpoint for certificate verification
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const certificateId = url.searchParams.get('id');

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: true,
        enrollment: {
          include: {
            user: true,
            course: true
          }
        }
      }
    }) as CertificateWithRelations | null;

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      verified: true,
      data: {
        recipient: certificate.enrollment.user.name || 'Student',
        course: certificate.enrollment.course.title,
        issuedAt: certificate.issuedAt,
        blockchainUrl: certificate.blockchainUrl,
        blockchainTxId: certificate.blockchainTxId,
        tokenId: certificate.tokenId,
        ipfsHash: certificate.ipfsHash,
        verificationUrl: certificate.verificationUrl
      },
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
