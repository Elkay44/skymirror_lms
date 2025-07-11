import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as databaseService from '@/lib/blockchain/databaseService';

const prisma = new PrismaClient();

// POST /api/certificates/verify - Verify a certificate
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { certificateId, tokenId } = data;
    
    if (!certificateId && !tokenId) {
      return NextResponse.json({ error: 'Certificate ID or token ID is required' }, { status: 400 });
    }
    
    let verificationResult;
    
    if (certificateId) {
      // Verify by our database ID
      verificationResult = await databaseService.verifyCertificateById(certificateId);
    } else {
      // Verify by blockchain token ID
      // First find the certificate in our database
      const certificate = await prisma.certification.findFirst({
        where: { tokenId: tokenId.toString() }
      });
      
      if (!certificate) {
        return NextResponse.json({
          valid: false,
          reason: 'Certificate not found in our records'
        });
      }
      
      verificationResult = await databaseService.verifyCertificateById(certificate.id);
    }
    
    // Return the verification result
    if (verificationResult.valid) {
      // Filter sensitive information for public verification
      const { certification } = verificationResult;
      
      return NextResponse.json({
        valid: true,
        certificate: {
          id: certification.id,
          title: certification.title,
          description: certification.description,
          studentId: certification.studentId,
          courseId: certification.courseId,
          tokenId: certification.tokenId,
          contractAddress: certification.contractAddress,
          ipfsMetadataUrl: certification.ipfsMetadataUrl,
          issuedAt: certification.issuedAt,
          expiresAt: certification.expiresAt,
          isRevoked: certification.isRevoked,
        },
        blockchainDetails: verificationResult.blockchainDetails
      });
    } else {
      return NextResponse.json({
        valid: false,
        reason: verificationResult.reason
      });
    }
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json({
      error: 'Failed to verify certificate',
      message: (error as Error).message
    }, { status: 500 });
  }
}

// GET /api/certificates/verify?id=xxx - Public endpoint to verify a certificate
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }
    
    // Check if it's a database ID or blockchain token ID
    let certificate = await prisma.certification.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            name: true,
            email: true,
            image: true
          }
        },
        course: {
          select: {
            title: true,
            description: true,
            instructor: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        submissions: {
          include: {
            project: {
              select: {
                title: true,
                description: true
              }
            }
          }
        }
      }
    });
    
    // If not found by ID, try by token ID
    if (!certificate) {
      certificate = await prisma.certification.findFirst({
        where: { tokenId: id },
        include: {
          student: {
            select: {
              name: true,
              email: true,
              image: true
            }
          },
          course: {
            select: {
              title: true,
              description: true,
              instructor: {
                select: {
                  name: true,
                  image: true
                }
              }
            }
          },
          submissions: {
            include: {
              project: {
                select: {
                  title: true,
                  description: true
                }
              }
            }
          }
        }
      });
    }
    
    if (!certificate) {
      return NextResponse.json({
        valid: false,
        reason: 'Certificate not found'
      });
    }
    
    // Verify on blockchain if token ID exists
    let blockchainVerification = null;
    if (certificate.tokenId) {
      try {
        // Verify using our service
        const verificationResult = await databaseService.verifyCertificateById(certificate.id);
        if (verificationResult.valid) {
          blockchainVerification = verificationResult.blockchainDetails;
        }
      } catch (error) {
        console.error('Blockchain verification error:', error);
        // Continue without blockchain verification
      }
    }
    
    // Construct public verification result
    return NextResponse.json({
      valid: !certificate.isRevoked && (!certificate.expiresAt || certificate.expiresAt > new Date()),
      certificate: {
        id: certificate.id,
        title: certificate.title,
        description: certificate.description,
        studentName: certificate.student.name,
        studentImage: certificate.student.image,
        courseName: certificate.course.title,
        courseDescription: certificate.course.description,
        instructorName: certificate.course.instructor.name,
        instructorImage: certificate.course.instructor.image,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        isRevoked: certificate.isRevoked,
        projects: certificate.submissions.map(sub => ({
          title: sub.project.title,
          description: sub.project.description,
          completedAt: sub.reviewedAt
        })),
        blockchainVerified: !!blockchainVerification,
        blockchainDetails: blockchainVerification
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json({
      error: 'Failed to verify certificate',
      message: (error as Error).message
    }, { status: 500 });
  }
}
