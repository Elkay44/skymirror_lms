"use client";

import { useState } from 'react';
import { Award, Search, CheckCircle, XCircle, ArrowRight, Shield, ExternalLink, FileCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface BlockchainDetails {
  tokenId: string;
  contractAddress: string;
  txHash: string;
  ipfsUrl?: string;
  studentName: string;
  courseName: string;
  courseId: string;
  studentId: string;
  issuedAt: string;
  expiresAt?: string;
  isRevoked: boolean;
  projectsHash: string;
}

interface Project {
  title: string;
  description?: string;
  completedAt?: string;
}

interface VerificationResult {
  valid: boolean;
  certificate?: {
    id: string;
    title: string;
    description?: string;
    studentName: string;
    studentImage?: string;
    courseName: string;
    courseDescription?: string;
    issuedAt: string;
    expiresAt?: string;
    instructorName: string;
    instructorImage?: string;
    projects: Project[];
    isRevoked: boolean;
    blockchainVerified: boolean;
    blockchainDetails?: BlockchainDetails;
  };
  reason?: string;
}

export default function CertificateVerification() {
  const [credentialId, setCredentialId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentialId.trim()) return;
    
    setIsVerifying(true);
    setResult(null);
    
    try {
      // Call our API endpoint to verify the certificate
      const response = await fetch(`/api/certificates/verify?id=${encodeURIComponent(credentialId)}`);
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setResult({
          valid: true,
          certificate: data.certificate
        });
      } else {
        setResult({
          valid: false,
          reason: data.reason || data.error || 'Certificate not found. Please check the credential ID and try again.'
        });
      }
    } catch (error) {
      setResult({
        valid: false,
        reason: 'An error occurred during verification. Please try again later.'
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            <Shield className="inline-block mr-2 h-8 w-8" />
            Blockchain Certificate Verification
          </h1>
          <p className="mt-3 max-w-md mx-auto text-lg text-white opacity-90 sm:text-xl md:mt-5 md:max-w-3xl">
            Verify the authenticity of blockchain-secured certificates issued by SkyMirror Academy
          </p>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <label htmlFor="credential-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Certificate ID or Token ID
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      id="credential-id"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Certificate ID or blockchain token ID"
                      value={credentialId}
                      onChange={(e) => setCredentialId(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifying || !credentialId.trim()}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify'}
                    {!isVerifying && <ArrowRight className="h-4 w-4 ml-1" />}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter a certificate ID (e.g., cert_xx) or a blockchain token ID (e.g., 1, 2, etc.)
                </p>
              </div>
            </form>
            
            {/* Results section */}
            {result && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-900">Verification Result</h3>
                  <div className="ml-4 flex-shrink-0">
                    {result.valid ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  {result.valid && result.certificate ? (
                    <div className="space-y-8">
                      {/* Certificate header */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-bold">{result.certificate.title}</h2>
                            <p className="mt-1 text-blue-100">{result.certificate.description}</p>
                          </div>
                          <Award className="h-16 w-16 text-yellow-300" />
                        </div>
                        <div className="mt-4 text-sm">
                          <p>Issued to <span className="font-bold">{result.certificate.studentName}</span></p>
                          <p>For completing <span className="font-bold">{result.certificate.courseName}</span></p>
                        </div>
                        <div className="mt-4 flex justify-between text-xs text-blue-100">
                          <p>Issued: {formatDate(result.certificate.issuedAt)}</p>
                          {result.certificate.expiresAt && (
                            <p>Expires: {formatDate(result.certificate.expiresAt)}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Certificate details */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 bg-gray-50">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Certificate Details</h3>
                        </div>
                        <div className="border-t border-gray-200">
                          <dl>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Student</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{result.certificate.studentName}</dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Course</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{result.certificate.courseName}</dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Instructor</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{result.certificate.instructorName}</dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(result.certificate.issuedAt)}</dd>
                            </div>
                            {result.certificate.expiresAt && (
                              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Expiration Date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(result.certificate.expiresAt)}</dd>
                              </div>
                            )}
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Certificate ID</dt>
                              <dd className="mt-1 text-sm font-mono text-gray-900 sm:mt-0 sm:col-span-2">{result.certificate.id}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      
                      {/* Projects completed */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 bg-gray-50">
                          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                            Completed Projects
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-500">Projects completed to earn this certificate</p>
                        </div>
                        <div className="border-t border-gray-200">
                          <ul className="divide-y divide-gray-200">
                            {result.certificate.projects.map((project, index) => (
                              <li key={index} className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-blue-600 truncate">{project.title}</p>
                                    {project.description && (
                                      <p className="mt-1 text-sm text-gray-500 truncate">{project.description}</p>
                                    )}
                                  </div>
                                  {project.completedAt && (
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Completed {formatDate(project.completedAt)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Blockchain verification */}
                      {result.certificate.blockchainVerified && result.certificate.blockchainDetails && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-4 py-5 sm:px-6 bg-gray-50">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                              <Shield className="h-5 w-5 mr-2 text-blue-600" />
                              Blockchain Verification
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">This certificate has been verified on the Ethereum blockchain</p>
                          </div>
                          <div className="border-t border-gray-200">
                            <dl>
                              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Token ID</dt>
                                <dd className="mt-1 text-sm font-mono text-gray-900 sm:mt-0 sm:col-span-2">
                                  {result.certificate.blockchainDetails.tokenId}
                                </dd>
                              </div>
                              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Contract Address</dt>
                                <dd className="mt-1 text-sm font-mono text-gray-900 sm:mt-0 sm:col-span-2">
                                  <div className="flex items-center">
                                    <span className="truncate">{result.certificate.blockchainDetails.contractAddress}</span>
                                    <a
                                      href={`https://etherscan.io/address/${result.certificate.blockchainDetails.contractAddress}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </div>
                                </dd>
                              </div>
                              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Transaction Hash</dt>
                                <dd className="mt-1 text-sm font-mono text-gray-900 sm:mt-0 sm:col-span-2">
                                  <div className="flex items-center">
                                    <span className="truncate">{result.certificate.blockchainDetails.txHash}</span>
                                    <a
                                      href={`https://etherscan.io/tx/${result.certificate.blockchainDetails.txHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </div>
                                </dd>
                              </div>
                              
                              {result.certificate.blockchainDetails.ipfsUrl && (
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                  <dt className="text-sm font-medium text-gray-500">IPFS Metadata</dt>
                                  <dd className="mt-1 text-sm font-mono text-gray-900 sm:mt-0 sm:col-span-2">
                                    <div className="flex items-center">
                                      <span className="truncate">{result.certificate.blockchainDetails.ipfsUrl}</span>
                                      <a
                                        href={result.certificate.blockchainDetails.ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    </div>
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-700 mt-2">{result.reason}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* About blockchain certificate verification */}
        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              About Blockchain Certificate Verification
            </h2>
          </div>
          <div className="px-6 py-5">
            <div className="prose prose-blue max-w-none">
              <p>
                SkyMirror Academy issues blockchain-verified digital certificates to students who successfully complete 
                all required projects in our courses. Each certificate is minted as an NFT (Non-Fungible Token) on the Ethereum
                blockchain, providing an immutable and verifiable record of achievement.
              </p>
              <p>
                Our blockchain verification system provides multiple layers of security and trust:
              </p>
              <ul>
                <li><strong>Immutable Records:</strong> Once issued on the blockchain, certificates cannot be altered or forged</li>
                <li><strong>Project Verification:</strong> Certificates are only issued when all required projects are completed</li>
                <li><strong>Decentralized Verification:</strong> Anyone can independently verify a certificate directly on the blockchain</li>
                <li><strong>Permanent Storage:</strong> Certificate metadata is stored on IPFS, a decentralized storage system</li>
                <li><strong>Ownership Control:</strong> Students own their certificates as NFTs in their Ethereum wallets</li>
              </ul>
              <h3>Verification Process</h3>
              <p>
                When verifying a certificate, our system checks multiple factors:
              </p>
              <ol>
                <li>Validates the certificate exists in our database</li>
                <li>Confirms the certificate is not revoked or expired</li>
                <li>Verifies the certificate on the Ethereum blockchain</li>
                <li>Validates the project completion data matches the on-chain hash</li>
              </ol>
              <p>
                If you have any questions about our blockchain certification system or need assistance 
                with verification, please contact our support team at certificates@skymirror.academy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
