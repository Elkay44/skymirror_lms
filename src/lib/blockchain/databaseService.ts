/**
 * Database Service for Blockchain Certifications
 * Handles interactions between Prisma database models and the blockchain
 */

import { PrismaClient, Certification, Project, ProjectSubmission, User, Course } from '@prisma/client';
import * as certificateService from './certificateService';

const prisma = new PrismaClient();

/**
 * Verifies if a student is eligible for certification based on project completion
 */
export async function isEligibleForCertification(studentId: string, courseId: string) {
  try {
    // Get all required projects for the course
    const requiredProjects = await prisma.project.findMany({
      where: {
        courseId,
        isRequiredForCertification: true,
        isPublished: true,
      },
    });

    if (requiredProjects.length === 0) {
      return { eligible: false, reason: 'No required projects found for this course' };
    }

    // Get all approved submissions for this student in this course
    const approvedSubmissions = await prisma.projectSubmission.findMany({
      where: {
        studentId,
        project: {
          courseId,
          isRequiredForCertification: true,
        },
        status: 'APPROVED',
      },
    });

    // Check if all required projects have approved submissions
    const approvedProjectIds = approvedSubmissions.map(submission => submission.projectId);
    const missingProjects = requiredProjects.filter(
      project => !approvedProjectIds.includes(project.id)
    );

    if (missingProjects.length > 0) {
      return {
        eligible: false,
        reason: 'Missing approved submissions for required projects',
        missingProjects,
      };
    }

    return { eligible: true, approvedSubmissions };
  } catch (error) {
    console.error('Error checking certification eligibility:', error);
    throw new Error(`Failed to check certification eligibility: ${(error as Error).message}`);
  }
}

/**
 * Prepares project data for blockchain verification
 */
export async function prepareProjectData(approvedSubmissions: ProjectSubmission[]) {
  try {
    const projectData = await Promise.all(
      approvedSubmissions.map(async (submission) => {
        const project = await prisma.project.findUnique({
          where: { id: submission.projectId },
        });

        return {
          projectId: submission.projectId,
          projectTitle: project?.title || 'Unknown',
          submissionId: submission.id,
          grade: submission.grade || 0,
          submittedAt: submission.submittedAt.toISOString(),
          reviewedAt: submission.reviewedAt?.toISOString() || null,
          reviewerId: submission.reviewerId || null,
        };
      })
    );

    // Sort by submission date to ensure consistent hash generation
    projectData.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

    return JSON.stringify(projectData);
  } catch (error) {
    console.error('Error preparing project data:', error);
    throw new Error(`Failed to prepare project data: ${(error as Error).message}`);
  }
}

/**
 * Issues a certificate for a student who has completed all required projects
 */
export async function issueCertificate({
  studentId,
  courseId,
  certificateType = 'COURSE_COMPLETION',
  expiresAt = null,
  privateKey,
}: {
  studentId: string;
  courseId: string;
  certificateType?: string;
  expiresAt?: Date | null;
  privateKey: string;
}) {
  try {
    // First check eligibility
    const eligibility = await isEligibleForCertification(studentId, courseId);
    
    if (!eligibility.eligible) {
      throw new Error(`Student is not eligible for certification: ${eligibility.reason}`);
    }

    // Get student, course and submission data
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!student || !course) {
      throw new Error('Student or course not found');
    }

    if (!student.walletAddress) {
      throw new Error('Student does not have a wallet address');
    }

    // Check if approvedSubmissions exists and is an array
    if (!eligibility.approvedSubmissions || !Array.isArray(eligibility.approvedSubmissions)) {
      throw new Error('No approved submissions found for certification');
    }

    // Prepare project data for verification
    const projectData = await prepareProjectData(eligibility.approvedSubmissions);

    // Create a certification record in our database
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId,
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const certification = await prisma.certification.create({
      data: {
        userId: studentId,
        courseId,
        enrollmentId: enrollment.id,
        expiresAt,
        metadata: JSON.stringify({
          title: `${course.title} Certificate`,
          description: `Certificate of completion for ${course.title}`,
          certificateType,
        }),
      },
    });

    // Create metadata for IPFS
    const metadata = await certificateService.createCertificateMetadata({
      studentName: student.name || 'Student',
      studentId,
      courseName: course.title,
      courseId,
      issueDate: certification.issuedAt,
      projectSubmissions: eligibility.approvedSubmissions,
      certificateId: certification.id,
    });

    // Upload to IPFS
    const tokenURI = await certificateService.uploadToIPFS(metadata);

    // Issue certificate on blockchain
    const result = await certificateService.issueCertificate({
      studentAddress: student.walletAddress,
      studentName: student.name || 'Student',
      studentId,
      courseName: course.title,
      courseId,
      projectsData: projectData,
      tokenURI,
      expirationDate: expiresAt || undefined,
      privateKey,
    });

    // Update certification record with blockchain details
    const updatedCertification = await prisma.certification.update({
      where: { id: certification.id },
      data: {
        verificationUrl: `https://explorer.certify.com/certificate/${result.txHash}`,
        metadata: JSON.stringify({
          ...(certification.metadata ? JSON.parse(certification.metadata) : {}),
          tokenId: result.tokenId,
          txHash: result.txHash,
          ipfsHash: tokenURI,
        }),
      },
      include: {
        user: true,
        course: true,
      },
    });

    return updatedCertification;
  } catch (error) {
    console.error('Error issuing certificate:', error);
    throw new Error(`Failed to issue certificate: ${(error as Error).message}`);
  }
}

/**
 * Verifies a certificate in the database and on the blockchain
 */
export async function verifyCertificateById(certificationId: string) {
  try {
    // Get certification from database
    const certification = await prisma.certification.findUnique({
      where: { id: certificationId },
      include: {
        user: true,
        course: true,
        projectSubmission: true,
      },
    });

    if (!certification) {
      return { valid: false, reason: 'Certificate not found in database' };
    }

    // Parse metadata to check for revocation status
    const metadata = certification.metadata ? JSON.parse(certification.metadata) : {};
    
    if (metadata.isRevoked) {
      return { valid: false, reason: 'Certificate has been revoked', certification };
    }

    if (certification.expiresAt && certification.expiresAt < new Date()) {
      return { valid: false, reason: 'Certificate has expired', certification };
    }

    const tokenId = metadata.tokenId;
    if (!tokenId) {
      return { valid: false, reason: 'Certificate not issued on blockchain', certification };
    }

    // Verify on blockchain
    const blockchainVerification = await certificateService.verifyCertificate(tokenId);

    if (!blockchainVerification.valid) {
      return { valid: false, reason: 'Certificate verification failed on blockchain', certification };
    }

    // If there's a project submission, verify its data
    if (certification.projectSubmission) {
      const projectData = await prepareProjectData([certification.projectSubmission]);
      const projectVerification = await certificateService.verifyProjectData(
        tokenId,
        projectData
      );

      if (!projectVerification.valid) {
        return { 
          valid: false, 
          reason: 'Project data verification failed', 
          certification 
        };
      }
    }

    return {
      valid: true,
      certification,
      blockchainDetails: blockchainVerification.certificate,
    };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    throw new Error(`Failed to verify certificate: ${(error as Error).message}`);
  }
}

/**
 * Revokes a certificate
 */
export async function revokeCertificate({
  certificationId,
  reason,
  privateKey,
}: {
  certificationId: string;
  reason: string;
  privateKey: string;
}) {
  try {
    // Get certification from database
    const certification = await prisma.certification.findUnique({
      where: { id: certificationId },
    });

    if (!certification) {
      throw new Error('Certificate not found');
    }

    // Parse metadata to check revocation status
    const metadata = certification.metadata ? JSON.parse(certification.metadata) : {};
    
    if (metadata.isRevoked) {
      throw new Error('Certificate already revoked');
    }

    if (!metadata.tokenId) {
      throw new Error('Certificate not issued on blockchain');
    }

    // Revoke on blockchain
    const result = await certificateService.revokeCertificate({
      tokenId: metadata.tokenId,
      reason,
      privateKey,
    });

    // Update in database
    const updatedCertification = await prisma.certification.update({
      where: { id: certificationId },
      data: {
        metadata: JSON.stringify({
          ...metadata,
          isRevoked: true,
          revokedAt: new Date().toISOString(),
          revocationReason: reason,
        }),
      },
    });

    return {
      success: true,
      certification: updatedCertification,
      blockchainTxHash: result.txHash,
    };
  } catch (error) {
    console.error('Error revoking certificate:', error);
    throw new Error(`Failed to revoke certificate: ${(error as Error).message}`);
  }
}

/**
 * Get all certificates for a student
 */
export async function getStudentCertificates(studentId: string) {
  try {
    const certifications = await prisma.certification.findMany({
      where: { 
        userId: studentId,
      },
      include: {
        course: true,
        projectSubmission: true,
        user: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    // Parse metadata for each certification
    return certifications.map(cert => ({
      ...cert,
      metadata: cert.metadata ? JSON.parse(cert.metadata) : {},
    }));
  } catch (error) {
    console.error('Error getting student certificates:', error);
    throw new Error(`Failed to get student certificates: ${(error as Error).message}`);
  }
}

/**
 * Get all certificates for a course
 */
export async function getCourseCertificates(courseId: string) {
  try {
    const certifications = await prisma.certification.findMany({
      where: { courseId },
      include: {
        user: true,
        projectSubmission: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    // Parse metadata for each certification
    return certifications.map(cert => ({
      ...cert,
      metadata: cert.metadata ? JSON.parse(cert.metadata) : {},
    }));
  } catch (error) {
    console.error('Error getting course certificates:', error);
    throw new Error(`Failed to get course certificates: ${(error as Error).message}`);
  }
}
