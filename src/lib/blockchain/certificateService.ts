/**
 * Certificate Service
 * Handles interaction with the blockchain for issuing and verifying certificates
 */

import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESSES, DEFAULT_NETWORK, RPC_PROVIDERS, IPFS_CONFIG } from './contractConfig';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

// Define a type for ProjectSubmission that we need for our functions
type ProjectSubmission = {
  id: string;
  projectId: string;
  studentId: string;
  submittedAt: Date;
  reviewedAt?: Date | null;
  grade?: number | null;
  status: string;
  reviewerId?: string | null;
  project?: {
    id: string;
    title: string;
  };
};

const prisma = new PrismaClient();

/**
 * Creates metadata for the certificate to be stored on IPFS
 */
export async function createCertificateMetadata({
  studentName,
  studentId,
  courseName,
  courseId,
  issueDate,
  projectSubmissions,
  certificateId,
  imageUrl,
}: {
  studentName: string;
  studentId: string;
  courseName: string;
  courseId: string;
  issueDate: Date;
  projectSubmissions: ProjectSubmission[];
  certificateId: string;
  imageUrl?: string;
}) {
  // Format projects data for the metadata
  const projects = await Promise.all(
    projectSubmissions.map(async (submission) => {
      // If submission already includes project data, use it
      if (submission.project) {
        return {
          projectId: submission.projectId,
          projectTitle: submission.project.title || 'Unknown Project',
          submissionDate: submission.submittedAt,
          grade: submission.grade,
          reviewDate: submission.reviewedAt,
        };
      }
      
      // Otherwise fetch the project data
      // Access Project through the Prisma client's generated models
      const project = await prisma.project.findUnique({
        where: { id: submission.projectId },
        select: { title: true, id: true }
      });

      return {
        projectId: submission.projectId,
        projectTitle: project?.title || 'Unknown Project',
        submissionDate: submission.submittedAt,
        grade: submission.grade,
        reviewDate: submission.reviewedAt,
      };
    })
  );

  // Create the metadata object following the ERC721 Metadata standard
  // with additional certificate-specific properties
  const metadata = {
    name: `${courseName} Certificate`,
    description: `This certificate verifies that ${studentName} has successfully completed all required projects for ${courseName}.`,
    image: imageUrl || `https://skymirror.academy/api/certificates/image/${certificateId}`,
    external_url: `https://skymirror.academy/certificates/${certificateId}`,
    attributes: [
      {
        trait_type: 'Course',
        value: courseName,
      },
      {
        trait_type: 'Student',
        value: studentName,
      },
      {
        trait_type: 'Issued Date',
        value: issueDate.toISOString(),
        display_type: 'date',
      },
      {
        trait_type: 'Issuer',
        value: 'SkyMirror Academy',
      },
    ],
    properties: {
      studentId,
      courseId,
      certificateId,
      issueDate: issueDate.toISOString(),
      projects,
    },
  };

  return metadata;
}

/**
 * Uploads certificate metadata to IPFS via Pinata
 */
export async function uploadToIPFS(metadata: any) {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${IPFS_CONFIG.pinata.jwt}`,
        },
      }
    );

    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload certificate metadata to IPFS');
  }
}

/**
 * Generates a hash of project data for on-chain verification
 */
export function generateProjectsHash(projectData: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(projectData));
}

/**
 * Connect to the blockchain provider
 */
export function getProvider(network = DEFAULT_NETWORK) {
  const rpcUrl = RPC_PROVIDERS[network as keyof typeof RPC_PROVIDERS];
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get contract instance
 */
export function getContract(signerOrProvider: ethers.Signer | ethers.Provider, network = DEFAULT_NETWORK) {
  const contractAddress = CONTRACT_ADDRESSES[network as keyof typeof CONTRACT_ADDRESSES];
  return new ethers.Contract(contractAddress, CONTRACT_ABI, signerOrProvider);
}

/**
 * Issues a certificate on the blockchain
 */
export async function issueCertificate({
  studentAddress,
  studentName,
  studentId,
  courseName,
  courseId,
  projectsData,
  tokenURI,
  expirationDate,
  privateKey,
}: {
  studentAddress: string;
  studentName: string;
  studentId: string;
  courseName: string;
  courseId: string;
  projectsData: string;
  tokenURI: string;
  expirationDate?: Date;
  privateKey: string; // Private key of the academy wallet to sign transactions
}) {
  try {
    // Connect to provider and get signer
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = getContract(wallet);

    // Generate hash of project data
    const projectsHash = generateProjectsHash(projectsData);

    // Prepare expiration timestamp (0 for no expiration)
    const expiresAt = expirationDate ? Math.floor(expirationDate.getTime() / 1000) : 0;

    // Issue certificate transaction
    const tx = await contract.issueCertificate(
      studentAddress,
      studentName,
      studentId,
      courseName,
      courseId,
      projectsHash,
      tokenURI,
      expiresAt
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Extract token ID from event logs
    const event = receipt.events?.find((e: any) => e.event === 'CertificateIssued');
    const tokenId = event?.args?.tokenId.toString();

    return {
      success: true,
      tokenId,
      txHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error('Error issuing certificate:', error);
    throw new Error(`Failed to issue certificate: ${(error as Error).message}`);
  }
}

/**
 * Verifies a certificate on the blockchain
 */
export async function verifyCertificate(tokenId: string) {
  try {
    const provider = getProvider();
    const contract = getContract(provider);

    // Check if certificate is valid, not expired, and not revoked
    const isValid = await contract.verifyCertificate(tokenId);

    if (!isValid) {
      return { valid: false, reason: 'Certificate is invalid, expired, or revoked' };
    }

    // Get certificate details
    const [
      studentName,
      courseName,
      courseId,
      studentId,
      issuedAt,
      expiresAt,
      isRevoked,
      projectsHash,
    ] = await contract.getCertificate(tokenId);

    return {
      valid: true,
      certificate: {
        tokenId,
        studentName,
        courseName,
        courseId,
        studentId,
        issuedAt: new Date(issuedAt.toNumber() * 1000),
        expiresAt: expiresAt.toNumber() > 0 ? new Date(expiresAt.toNumber() * 1000) : null,
        isRevoked,
        projectsHash,
      },
    };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    throw new Error(`Failed to verify certificate: ${(error as Error).message}`);
  }
}

/**
 * Verify project data matches the hash stored in the certificate
 */
export async function verifyProjectData(tokenId: string, projectData: string) {
  try {
    const provider = getProvider();
    const contract = getContract(provider);

    const isValid = await contract.verifyProjects(tokenId, projectData);
    return { valid: isValid };
  } catch (error) {
    console.error('Error verifying project data:', error);
    throw new Error(`Failed to verify project data: ${(error as Error).message}`);
  }
}

/**
 * Revoke a certificate
 */
export async function revokeCertificate({
  tokenId,
  reason,
  privateKey,
}: {
  tokenId: string;
  reason: string;
  privateKey: string;
}) {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = getContract(wallet);

    const tx = await contract.revokeCertificate(tokenId, reason);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error('Error revoking certificate:', error);
    throw new Error(`Failed to revoke certificate: ${(error as Error).message}`);
  }
}

/**
 * Get all certificates for a student
 */
export async function getStudentCertificates(studentAddress: string) {
  try {
    const provider = getProvider();
    const contract = getContract(provider);

    const tokenIds = await contract.getStudentCertificates(studentAddress);
    return tokenIds.map((id: bigint) => id.toString());
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
    const provider = getProvider();
    const contract = getContract(provider);

    const tokenIds = await contract.getCourseCertificates(courseId);
    return tokenIds.map((id: bigint) => id.toString());
  } catch (error) {
    console.error('Error getting course certificates:', error);
    throw new Error(`Failed to get course certificates: ${(error as Error).message}`);
  }
}
